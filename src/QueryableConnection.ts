import BatchInsertCollector from './BatchInsertCollector';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import OneRowExpectedError from './errors/OneRowExpectedError';
import QueryError from './errors/QueryError';
import {SQL} from 'pg-async';
import {Client, Pool, PoolClient, QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import {AsyncConnection} from './Connection';

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

    async findOne(input: QueryConfig | string, values?: any[]): Promise<Row | null> {
        const result = await this.getRows(input, values);

        if (result.length > 1) {
            throw new OneRowExpectedError(result.length);
        }

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    async getOne(input: QueryConfig, error: {new(...parameters: any[]): Error}): Promise<Row> {
        try {
            return await this.getRow(input);

        } catch (e) {
            if (e instanceof OneRowExpectedError) {
                const values = input.values != null ? input.values : [];
                throw new error(...values);
            }

            throw e;
        }
    }

    insert(table: string, values: Row): Promise<QueryResult> {
        return this.query(SQL`
            INSERT INTO $identifier${table} $insert${values}
        `);
    }

    async query(input: QueryConfig | string, values?: any[]): Promise<QueryResult> {
        const queryError = this.debug
            ? new QueryError(input, values) // capture stack trace
            : null;

        try {
            return await this.connection.query(input, values);

        } catch (databaseError) {
            if (queryError == null) {
                throw databaseError;
            }

            queryError.message = databaseError.message;
            queryError.causedBy = databaseError;
            throw queryError;
        }
    }

    async getRow(input: QueryConfig | string, values?: any[]): Promise<Row> {
        const result = await this.getRows(input, values);

        if (result.length !== 1) {
            throw new OneRowExpectedError(result.length);
        }

        return result[0];
    }

    async getRows(input: QueryConfig | string, values?: any[]): Promise<Row[]> {
        const result = await this.query(input, values);

        return result.rows;
    }

    insertStream(tableName: string, querySuffix?: string, batchSize?: number): DatabaseInsertStream {
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
