// @flow

import BatchInsertCollector from './BatchInsertCollector';
import convertKeys from './convertKeys';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import OneRowExpectedError from './errors/OneRowExpectedError';
import QueryError from './errors/QueryError';
import {SQL} from 'pg-async';
import type {AsyncQueryable} from './AsyncQueryable';
import type {Client, Pool, PoolClient, QueryConfig, ResultSet} from 'pg';
import type {Row} from './Row';
import type {SqlFragment} from 'pg-async';

class Connection implements AsyncQueryable {
    +connection: Client | Pool | PoolClient;
    +debug: boolean;

    constructor(connection: Client | Pool | PoolClient, debug: boolean = false): void {
        this.connection = connection;
        this.debug = debug;
    }

    async findOne(input: QueryConfig | string, values?: mixed[]): Promise<?Row> {
        const result = await this.getRows(input, values);

        if (result.length > 1) {
            throw new OneRowExpectedError(result.length);
        }

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    async getOne(sql: SqlFragment, error: Class<Error>): Promise<Row> {
        try {
            return await this.getRow(sql);

        } catch (e) {
            if (e instanceof OneRowExpectedError) {
                throw new error(...sql.values);
            }

            throw e;
        }
    }

    insert(table: string, values: {[key: string]: any}): Promise<ResultSet> { // eslint-disable-line flowtype/no-weak-types
        const convertedKeys = convertKeys(values);

        return this.query(SQL`
            INSERT INTO $identifier${table} $insert${convertedKeys}
        `);
    }

    async query(input: QueryConfig | string, values?: mixed[]): Promise<ResultSet> {
        const queryError = this.debug
            ? new QueryError(input, values) // capture stack trace
            : null;

        const queryConfig = typeof input === 'string'
            ? {text: input, values: values}
            : input;

        try {
            return await this.connection.query(queryConfig);

        } catch (databaseError) {
            if (queryError == null) {
                throw databaseError;
            }

            queryError.message = databaseError.message;
            queryError.causedBy = databaseError;
            throw queryError;
        }
    }

    async getRow(input: QueryConfig | string, values?: mixed[]): Promise<Row> {
        const result = await this.getRows(input, values);

        if (result.length !== 1) {
            throw new OneRowExpectedError(result.length);
        }

        return result[0];
    }

    async getRows(input: QueryConfig | string, values?: mixed[]): Promise<Row[]> {
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

export default Connection;
