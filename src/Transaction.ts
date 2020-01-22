import {Client, PoolClient, QueryConfig, QueryResult} from 'pg';
import {Connection} from './Connection';
import {DeleteCollectorOptions, OneDatabaseValue} from './BatchDeleteCollector';
import {InsertCollectorOptions} from './BatchInsertCollector';
import {Lock} from 'semaphore-async-await';
import {Row} from './Row';
import {Stream} from 'stream';
import DatabaseDeleteStream from './streams/DatabaseDeleteStream';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryError from './errors/QueryError';
import QueryableConnection from './QueryableConnection';

export type TransactionCallback<T> = (connection: Transaction<T>) => Promise<T> | T;

interface TransactionOptions {
	readonly debug?: boolean;
	readonly savepointCounter?: number;
}

const SAVEPOINT_PREFIX = 'savepoint';

class Transaction<T> extends QueryableConnection implements Connection {
	protected readonly connection!: Client | PoolClient; // ! - initialized in parent constructor
	private readonly lock: Lock;
	private readonly savepointCounter: number;
	private readonly savepointName: string;

	private constructor(client: Client | PoolClient, options?: TransactionOptions) {
		super(client, options);
		this.lock = new Lock();
		this.savepointCounter = options?.savepointCounter ?? 1;
		this.savepointName = `${SAVEPOINT_PREFIX}${this.savepointCounter}`;
	}

	public static async createAndRun<X>(client: Client | PoolClient, transactionCallback: TransactionCallback<X>, options?: TransactionOptions): Promise<X> {
		const transaction = new Transaction<X>(client, options);
		const result = await transactionCallback(transaction);

		// ensure that all locks are released by acquiring it
		await transaction.lock.acquire();
		transaction.lock.release();

		return result;
	}

	public async transaction<U>(transactionCallback: TransactionCallback<U>): Promise<U> {
		await this.lock.acquire();
		try {
			await super.query(`SAVEPOINT ${this.savepointName}`);

			try {
				const result = await Transaction.createAndRun<U>(this.connection, transactionCallback, {
					debug: this.debug,
					savepointCounter: this.savepointCounter + 1,
				});

				await super.query(`RELEASE SAVEPOINT ${this.savepointName}`);

				return result;
			} catch (error) {
				await super.query(`ROLLBACK TO SAVEPOINT ${this.savepointName}`);
				throw error;
			}
		} finally {
			this.lock.release();
		}
	}

	public async query<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult<T>> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const queryError = this.debug
			? new QueryError(input, values) // capture stack trace
			: null;

		await this.lock.acquire();
		try {
			return await super.query<T>(input, values);
		} catch (databaseError) {
			if (queryError == null) {
				throw databaseError;
			}

			queryError.message = databaseError.message;
			queryError.causedBy = databaseError instanceof QueryError ? databaseError.causedBy : databaseError;
			throw queryError;
		} finally {
			this.lock.release();
		}
	}

	public async streamQuery(input: QueryConfig | string, values?: readonly any[]): Promise<DatabaseReadStream> { // eslint-disable-line @typescript-eslint/no-explicit-any
		return await this.ensureStreamInCriticalSectionByFactory(
			async () => {
				const stream = this.connection.query(new DatabaseReadStream(
					typeof input === 'string' ? input : input.text,
					typeof input === 'string' ? values?.slice() : input.values,
				));

				return await Promise.resolve(stream);
			},
			['error', 'close', 'end']
		);
	}

	public async insertStream<T extends Row = Row>(tableName: string, options?: InsertCollectorOptions): Promise<DatabaseInsertStream<T>> {
		return await this.ensureStreamInCriticalSectionByFactory(
			async () => await super.insertStream<T>(tableName, options),
			['error', 'close', 'finish']
		);
	}

	public async deleteStream<T extends OneDatabaseValue = string>(tableName: string, options?: DeleteCollectorOptions): Promise<DatabaseDeleteStream<T>> {
		return await this.ensureStreamInCriticalSectionByFactory(
			async () => await super.deleteStream<T>(tableName, options),
			['error', 'close', 'finish']
		);
	}

	private async ensureStreamInCriticalSectionByFactory<T extends Stream>(factory: () => Promise<T>, releaseEvents: readonly string[]): Promise<T> {
		await this.lock.acquire();
		try {
			const stream = await factory();

			const resetStreamProgressHandler = (): void => {
				for (const event of releaseEvents) {
					stream.removeListener(event, resetStreamProgressHandler);
				}
				this.lock.release();
			};
			for (const event of releaseEvents) {
				stream.once(event, resetStreamProgressHandler);
			}

			return stream;
		} catch (error) {
			this.lock.release();
			throw error;
		}
	}
}

export default Transaction;
