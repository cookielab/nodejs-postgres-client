// @flow

import DatabaseReadStream from './streams/DatabaseReadStream';
import pg from 'pg';
import pgUtils from 'pg/lib/utils';
import prepareJavascriptValue from './prepareJavascriptValue';
import QueryableConnection from './QueryableConnection';
import registerColumnNameMapper from './registerColumnNameMapper';
import {SQL} from 'pg-async';
import Transaction from './Transaction';
import TypeNotFoundError from './errors/TypeNotFoundError';
import type {ColumnNameMapper} from './registerColumnNameMapper';
import type {JavascriptType} from './prepareJavascriptValue';
import type {Pool, QueryConfig} from 'pg';
import type {TransactionCallback} from './Transaction';

export type DatabaseType = {
    name: string,
    parser: DatabaseTypeParser,
};

export type DatabaseTypeParser = (value: string) => ?any; // eslint-disable-line flowtype/no-weak-types

type ClientOptions = {
    debug?: boolean,
    javascriptTypes?: JavascriptType[],
    columnNameMapper?: ColumnNameMapper,
};

const OPTIONS_DEFAULT = {
    debug: false,
};

class Client extends QueryableConnection {
    +pool: Pool;

    constructor(pool: Pool, options: ClientOptions = OPTIONS_DEFAULT): void {
        super(pool, options);
        this.pool = pool;

        if (options.javascriptTypes != null) {
            const originalPrepareValue = pgUtils.prepareValue;
            pgUtils.prepareValue = prepareJavascriptValue.bind(null, originalPrepareValue, options.javascriptTypes);
        }
        if (options.columnNameMapper) {
            registerColumnNameMapper(options.columnNameMapper);
        }
    }

    async transaction<T>(transactionCallback: TransactionCallback<T>): Promise<T> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const transaction = new Transaction(client, transactionCallback, {
                debug: this.debug,
            });
            const result = await transaction.perform();

            transaction.validateUnfinishedInsertStreams();

            await client.query('COMMIT');
            client.release();

            return result;

        } catch (error) {
            await client.query('ROLLBACK');
            client.release(error);
            throw error;
        }
    }

    async streamQuery(input: QueryConfig | string, values?: mixed[]): Promise<DatabaseReadStream> {
        const query = new DatabaseReadStream(
            typeof input === 'string' ? input : input.text,
            typeof input === 'string' ? values : input.values
        );

        const client = await this.pool.connect();
        const stream = client.query(query);

        const clientReleaseListener = (error?: Error): void => {
            stream.removeListener('error', clientReleaseListener);
            stream.removeListener('end', clientReleaseListener);
            stream.removeListener('close', clientReleaseListener);
            client.release(error);
        };
        stream.once('error', clientReleaseListener);
        stream.once('end', clientReleaseListener);
        stream.once('close', clientReleaseListener);

        return stream;
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
