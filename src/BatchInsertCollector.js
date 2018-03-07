// @flow

import SQL from 'pg-async/lib/sql';
import type {Connection} from './Connection';
import type {Row} from './Row';

const maxBatchInsert = 1000;

class BatchInsertCollector {
    connection: Connection;
    tableName: string;
    batchSize: number;
    querySuffix: string;
    rows: Row[];

    constructor(connection: Connection, tableName: string): void {
        this.connection = connection;
        this.tableName = tableName;
        this.batchSize = maxBatchInsert;
        this.querySuffix = '';
        this.rows = [];
    }

    setBatchSize(batchSize: number): BatchInsertCollector {
        this.batchSize = batchSize <= 0 || batchSize > maxBatchInsert
            ? maxBatchInsert
            : batchSize;
        return this;
    }

    setQuerySuffix(querySuffix: string): BatchInsertCollector {
        this.querySuffix = querySuffix;
        return this;
    }

    async add(row: Row): Promise<void> {
        this.rows.push(row);

        if (this.rows.length >= this.batchSize) {
            await this.flush();
        }
    }

    async flush(): Promise<void> {
        if (this.rows.length > 0) {
            await this.connection.query(SQL`INSERT INTO $identifier${this.tableName} $multiInsert${this.rows} $raw${this.querySuffix}`);
            this.rows = [];
        }
    }
}

export default BatchInsertCollector;
