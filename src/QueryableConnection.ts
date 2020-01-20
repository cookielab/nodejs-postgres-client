import {AsyncConnection} from './Connection';
import {Client, Pool, PoolClient, QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import {SQL} from 'pg-async';
import BatchDeleteCollector, {DeleteCollectorOptions, OneDatabaseValue} from './BatchDeleteCollector';
import BatchInsertCollector, {InsertCollectorOptions} from './BatchInsertCollector';
import DatabaseDeleteStream from './streams/DatabaseDeleteStream';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import OneRowExpectedError from './errors/OneRowExpectedError';
import QueryError from './errors/QueryError';
import mapOneColumn from './mapOneColumn';

interface ConnectionOptions {
	readonly debug?: boolean;
}

export default abstract class QueryableConnection implements AsyncConnection {
	protected readonly connection: Client | Pool | PoolClient;
	protected readonly debug: boolean;

	protected constructor(connection: Client | Pool | PoolClient, options?: ConnectionOptions) {
		this.connection = connection;
		this.debug = options?.debug === true;
	}

	public async findOne<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getRows<T>(input, values);

		if (result.length > 1) {
			throw new OneRowExpectedError(result.length);
		}

		if (result.length === 0) {
			return null;
		}

		return result[0];
	}

	public async findOneColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<T | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getColumn<T>(input, values, columnIndex);

		if (result.length > 1) {
			throw new OneRowExpectedError(result.length);
		}

		if (result.length === 0) {
			return null;
		}

		return result[0];
	}

	public async getOne<T extends Row = Row>(input: QueryConfig, error: {new(...parameters: readonly any[]): Error}): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any
		try {
			return await this.getRow<T>(input);
		} catch (e) {
			if (e instanceof OneRowExpectedError) {
				throw new error(...(input?.values ?? [])); // eslint-disable-line new-cap
			}

			throw e;
		}
	}

	public async insert<T extends Row = Row>(table: string, values: T): Promise<QueryResult<T>> {
		return await this.query(SQL`
            INSERT INTO $identifier${table} $insert${values}
        `);
	}

	public async query<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult<T>> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const queryError = this.debug
			? new QueryError(input, values) // capture stack trace
			: null;

		try {
			return await this.connection.query<T>(input, values?.slice());
		} catch (databaseError) {
			if (queryError == null) {
				throw databaseError;
			}

			queryError.message = databaseError.message;
			queryError.causedBy = databaseError;
			throw queryError;
		}
	}

	public async getRow<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getRows<T>(input, values);

		if (result.length !== 1) {
			throw new OneRowExpectedError(result.length);
		}

		return result[0];
	}

	public async getRows<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<readonly T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.query<T>(input, values);

		return result.rows;
	}

	public async getColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<readonly T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.query(input, values);

		return mapOneColumn(result.rows, columnIndex);
	}

	public async getOneColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getColumn<T>(input, values, columnIndex);

		if (result.length !== 1) {
			throw new OneRowExpectedError(result.length);
		}

		return result[0];
	}

	public async insertStream<T extends Row = Row>(tableName: string, options?: InsertCollectorOptions): Promise<DatabaseInsertStream<T>> {
		const collector = new BatchInsertCollector<T>(this, tableName, options);

		return await Promise.resolve(new DatabaseInsertStream<T>(collector));
	}

	public async deleteStream<T extends OneDatabaseValue = string>(tableName: string, options?: DeleteCollectorOptions): Promise<DatabaseDeleteStream<T>> {
		const collector = new BatchDeleteCollector<T>(this, tableName, options);

		return await Promise.resolve(new DatabaseDeleteStream<T>(collector));
	}
}
