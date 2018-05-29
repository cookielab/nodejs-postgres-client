// @flow

import pg from 'pg';
import pgUtils from 'pg/lib/utils';
import prepareJavascriptValue from './prepareJavascriptValue';
import QueryableConnection from './QueryableConnection';
import {SQL} from 'pg-async';
import Transaction from './Transaction';
import TypeNotFoundError from './errors/TypeNotFoundError';
import type {JavascriptType} from './prepareJavascriptValue';
import type {Pool} from 'pg';
import type {TransactionCallback} from './Transaction';

export type DatabaseType = {
    name: string,
    parser: DatabaseTypeParser,
};

export type DatabaseTypeParser = (value: string) => ?any; // eslint-disable-line flowtype/no-weak-types

class Client extends QueryableConnection {
    pool: Pool;
    javascriptTypesRegistered: boolean;

    constructor(pool: Pool, debug: boolean = false): void {
        super(pool, debug);
        this.pool = pool;
        this.javascriptTypesRegistered = false;
    }

    async transaction<T>(transactionCallback: TransactionCallback<T>): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const transaction = new Transaction(client, this.debug, transactionCallback);
            const result = await transaction.perform();

            await client.query('COMMIT');
            client.release();

            return result;

        } catch (error) {
            await client.query('ROLLBACK');
            client.release(error);
            throw error;

        }
    }

    registerJavascriptTypes(javascriptTypes: JavascriptType[]): void {
        if (this.javascriptTypesRegistered) {
            throw new Error('Javascript types should be registered only once.');
        }

        this.javascriptTypesRegistered = true;

        const originalPrepareValue = pgUtils.prepareValue;

        pgUtils.prepareValue = prepareJavascriptValue.bind(null, originalPrepareValue, javascriptTypes);
    }

    async registerDatabaseTypes(databaseTypes: DatabaseType[]): Promise<void> {
        const promises = databaseTypes.map(async (type: DatabaseType): Promise<void> => {
            const {oid} = await this.getOne(SQL`
                SELECT oid FROM pg_type WHERE typname = ${type.name}
            `, TypeNotFoundError);

            pg.types.setTypeParser(oid, type.parser);
        });

        await Promise.all(promises);
    }

    async end(): Promise<void> {
        await this.pool.end();
    }
}

export default Client;
