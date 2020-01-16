import {AsyncConnection} from './Connection';
import {Client, Pool, PoolClient, QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import {SQL} from 'pg-async';
import BatchInsertCollector from './BatchInsertCollector';
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

	protected constructor(connection: Client | Pool | PoolClient, options: ConnectionOptions) {
		this.connection = connection;
		this.debug = options.debug === true;
	}

	public async findOne(input: QueryConfig | string, values?: readonly any[]): Promise<Row | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getRows(input, values);

		if (result.length > 1) {
			throw new OneRowExpectedError(result.length);
		}

		if (result.length === 0) {
			return null;
		}

		return result[0];
	}

	public async findOneColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<T | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getColumn<T>(input, values, columnIndex);

		if (result.length > 1) {
			throw new OneRowExpectedError(result.length);
		}

		if (result.length === 0) {
			return null;
		}

		return result[0];
	}

	public async getOne(input: QueryConfig, error: {new(...parameters: readonly any[]): Error}): Promise<Row> { // eslint-disable-line @typescript-eslint/no-explicit-any
		try {
			return await this.getRow(input);
		} catch (e) {
			if (e instanceof OneRowExpectedError) {
				const values = input.values != null ? input.values : [];
				throw new error(...values); // eslint-disable-line new-cap
			}

			throw e;
		}
	}

	public async insert(table: string, values: Row): Promise<QueryResult> {
		return await this.query(SQL`
            INSERT INTO $identifier${table} $insert${values}
        `);
	}

	public async query(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const queryError = this.debug
			? new QueryError(input, values) // capture stack trace
			: null;

		try {
			return await this.connection.query(input, values?.slice());
		} catch (databaseError) {
			if (queryError == null) {
				throw databaseError;
			}

			queryError.message = databaseError.message;
			queryError.causedBy = databaseError;
			throw queryError;
		}
	}

	public async getRow(input: QueryConfig | string, values?: readonly any[]): Promise<Row> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getRows(input, values);

		if (result.length !== 1) {
			throw new OneRowExpectedError(result.length);
		}

		return result[0];
	}

	public async getRows(input: QueryConfig | string, values?: readonly any[]): Promise<readonly Row[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.query(input, values);

		return result.rows;
	}

	public async getColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<readonly T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.query(input, values);

		return mapOneColumn(result.rows, columnIndex);
	}

	public async getOneColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex: number = 0): Promise<T> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const result = await this.getColumn<T>(input, values, columnIndex);

		if (result.length !== 1) {
			throw new OneRowExpectedError(result.length);
		}

		return result[0];
	}

	public insertStream(tableName: string, querySuffix?: string, batchSize?: number): DatabaseInsertStream {
		const collector = new BatchInsertCollector(this, tableName);
		if (querySuffix != null) {
			collector.setQuerySuffix(querySuffix);
		}
		if (batchSize != null) {
			collector.setBatchSize(batchSize);
		}

		return new DatabaseInsertStream(collector);
	}
}
