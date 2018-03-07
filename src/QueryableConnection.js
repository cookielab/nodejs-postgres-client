// @flow

import convertKeys from './convertKeys';
import OneRowExpectedError from './errors/OneRowExpectedError';
import QueryError from './errors/QueryError';
import {SQL} from 'pg-async';
import type {Client, Pool, QueryInput, Result} from 'pg';
import type {Row} from './Row';
import type {SqlFragment} from 'pg-async';

class Connection {
    connection: Client | Pool;
    debug: boolean;

    constructor(connection: Client | Pool, debug: boolean = false): void {
        this.connection = connection;
        this.debug = debug;
    }

    async findOne(input: QueryInput, values?: mixed[]): Promise<?Row> {
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

    insert(table: string, values: {[key: string]: any}): Promise<Result> { // eslint-disable-line flowtype/no-weak-types
        const convertedKeys = convertKeys(values);

        return this.query(SQL`
            INSERT INTO $identifier${table} $insert${convertedKeys}
        `);
    }

    async query(input: QueryInput, values?: mixed[]): Promise<Result> {
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

    async getRow(input: QueryInput, values?: mixed[]): Promise<Row> {
        const result = await this.getRows(input, values);

        if (result.length !== 1) {
            throw new OneRowExpectedError(result.length);
        }

        return result[0];
    }

    async getRows(input: QueryInput, values?: mixed[]): Promise<Row[]> {
        const result = await this.query(input, values);
        return result.rows;
    }
}

export default Connection;
