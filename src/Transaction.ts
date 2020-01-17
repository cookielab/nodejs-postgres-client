import {Client, PoolClient, QueryConfig, QueryResult} from 'pg';
import {Connection} from './Connection';
import {DeleteCollectorOptions, OneDatabaseValue} from './BatchDeleteCollector';
import {InsertCollectorOptions} from './BatchInsertCollector';
import {Lock} from 'semaphore-async-await';
import {Row} from './Row';
import DatabaseDeleteStream from './streams/DatabaseDeleteStream';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryableConnection from './QueryableConnection';

export type TransactionCallback<T> = (connection: Transaction<T>) => Promise<T> | T;

interface TransactionOptions {
	readonly debug?: boolean;
	readonly savepointCounter?: number;
}

class Transaction<T> extends QueryableConnection implements Connection {
	protected readonly connection!: Client | PoolClient; // ! - initialized in parent constructor
	private readonly transactionCallback: TransactionCallback<T>;
	private readonly innerTransactionLock: Lock;
	private savepointCounter: number;
	private isReadStreamInProgress: boolean;
	private insertStreamInProgressCount: number;
	private deleteStreamInProgressCount: number;

	public constructor(client: Client | PoolClient, transactionCallback: TransactionCallback<T>, options?: TransactionOptions) {
		super(client, options);
		this.transactionCallback = transactionCallback;
		this.innerTransactionLock = new Lock();
		this.savepointCounter = options?.savepointCounter ?? 0;
		this.isReadStreamInProgress = false;
		this.insertStreamInProgressCount = 0;
		this.deleteStreamInProgressCount = 0;
	}

	public async perform(): Promise<T> {
		const result = await this.transactionCallback(this);

		if (this.insertStreamInProgressCount > 0) {
			throw new Error(`Cannot commit transaction (or release savepoint) because there is ${this.insertStreamInProgressCount} unfinished insert streams.`);
		}
		if (this.deleteStreamInProgressCount > 0) {
			throw new Error(`Cannot commit transaction (or release savepoint) because there is ${this.deleteStreamInProgressCount} unfinished delete streams.`);
		}

		return result;
	}

	public async transaction<U>(transactionCallback: TransactionCallback<U>): Promise<U> {
		await this.innerTransactionLock.acquire();
		try {
			const savepointName = `savepoint${++this.savepointCounter}`;

			await this.query(`SAVEPOINT ${savepointName}`);

			try {
				const transaction = new Transaction<U>(this.connection, transactionCallback, {
					debug: this.debug,
					savepointCounter: this.savepointCounter,
				});
				const result = await transaction.perform();

				await this.query(`RELEASE SAVEPOINT ${savepointName}`);

				return result;
			} catch (error) {
				await this.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
				throw error;
			}
		} finally {
			this.innerTransactionLock.release();
		}
	}

	public async query<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult<T>> { // eslint-disable-line @typescript-eslint/no-explicit-any
		if (this.isReadStreamInProgress) {
			throw new Error('Cannot run another query while one is still in progress. Possibly opened cursor.');
		}

		return await super.query<T>(input, values);
	}

	public async streamQuery(input: QueryConfig | string, values?: readonly any[]): Promise<DatabaseReadStream> { // eslint-disable-line @typescript-eslint/no-explicit-any
		if (this.isReadStreamInProgress) {
			throw new Error('Cannot run another query while one is still in progress. Possibly opened cursor.');
		}

		const query = new DatabaseReadStream(
			typeof input === 'string' ? input : input.text,
			typeof input === 'string' ? values?.slice() : input.values,
		);

		const stream = this.connection.query(query);

		this.isReadStreamInProgress = true;
		const resetStreamProgressHandler = (): void => {
			stream.removeListener('error', resetStreamProgressHandler);
			stream.removeListener('end', resetStreamProgressHandler);
			stream.removeListener('close', resetStreamProgressHandler);
			this.isReadStreamInProgress = false;
		};
		stream.once('error', resetStreamProgressHandler);
		stream.once('end', resetStreamProgressHandler);
		stream.once('close', resetStreamProgressHandler);

		return await Promise.resolve(stream);
	}

	public insertStream<T extends Row = Row>(tableName: string, options?: InsertCollectorOptions): DatabaseInsertStream<T> {
		const stream = super.insertStream<T>(tableName, options);

		stream.once('finish', (): void => {
			this.insertStreamInProgressCount--;
		});
		this.insertStreamInProgressCount++;

		return stream;
	}

	public deleteStream<T extends OneDatabaseValue = string>(tableName: string, options?: DeleteCollectorOptions): DatabaseDeleteStream<T> {
		const stream = super.deleteStream<T>(tableName, options);

		stream.once('finish', (): void => {
			this.deleteStreamInProgressCount--;
		});
		this.deleteStreamInProgressCount++;

		return stream;
	}
}

export default Transaction;
