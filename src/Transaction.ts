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

const SAVEPOINT_PREFIX = 'savepoint';

class Transaction<T> extends QueryableConnection implements Connection {
	protected readonly connection!: Client | PoolClient; // ! - initialized in parent constructor
	private readonly innerTransactionLock: Lock;
	private isReadStreamInProgress: boolean;
	private insertStreamInProgressCount: number;
	private deleteStreamInProgressCount: number;
	private readonly savepointCounter: number;
	private readonly savepointName: string;

	public constructor(client: Client | PoolClient, options?: TransactionOptions) {
		super(client, options);
		this.innerTransactionLock = new Lock();
		this.isReadStreamInProgress = false;
		this.insertStreamInProgressCount = 0;
		this.deleteStreamInProgressCount = 0;
		this.savepointCounter = options?.savepointCounter ?? 1;
		this.savepointName = `${SAVEPOINT_PREFIX}${this.savepointCounter}`;
	}

	public async transaction<U>(transactionCallback: TransactionCallback<U>): Promise<U> {
		await this.innerTransactionLock.acquire();
		try {
			await super.query(`SAVEPOINT ${this.savepointName}`);

			try {
				const transaction = new Transaction<U>(this.connection, {
					debug: this.debug,
					savepointCounter: this.savepointCounter + 1,
				});
				const result = await transactionCallback(transaction);

				if (transaction.insertStreamInProgressCount > 0) {
					throw new Error(`Cannot commit transaction (or release savepoint) because there is ${transaction.insertStreamInProgressCount} unfinished insert streams.`);
				}
				if (transaction.deleteStreamInProgressCount > 0) {
					throw new Error(`Cannot commit transaction (or release savepoint) because there is ${transaction.deleteStreamInProgressCount} unfinished delete streams.`);
				}

				await super.query(`RELEASE SAVEPOINT ${this.savepointName}`);

				return result;
			} catch (error) {
				await super.query(`ROLLBACK TO SAVEPOINT ${this.savepointName}`);
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
