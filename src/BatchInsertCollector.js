// @flow

import SQL from 'pg-async/lib/sql';
import type {Connection} from './Connection';
import type {Row} from './Row';

const maxBatchInsert = 1000;

class BatchInsertCollector {
    +connection: Connection;
    +tableName: string;
    insertedRowCount: number;
    batchSize: number;
    querySuffix: string;
    rows: Row[];
    batchPromise: Promise<void>;
    batchPromiseHandlers: {resolve: () => void, reject: (Error) => void};

    constructor(connection: Connection, tableName: string): void {
        this.connection = connection;
        this.tableName = tableName;
        this.insertedRowCount = 0;
        this.batchSize = maxBatchInsert;
        this.querySuffix = '';
        this.rows = [];
        this.batchPromise = new Promise((resolve: () => void, reject: (Error) => void): void => {
            this.batchPromiseHandlers = {resolve, reject};
        });
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

    getInsertedRowCount(): number {
        return this.insertedRowCount;
    }

    async add(row: Row): Promise<void> {
        this.rows.push(row);
        const promise = this.batchPromise;

        if (this.rows.length === 1) {
            process.nextTick(() => this.flush());
        }
        if (this.rows.length >= this.batchSize) {
            await this.flush();
        }

        return promise;
    }

    async flush(): Promise<void> {
        if (this.rows.length > 0) {
            const rows = this.rows;
            const batchPromiseHandlers = this.batchPromiseHandlers;
            this.rows = [];
            this.batchPromise = new Promise((resolve: () => void, reject: (Error) => void): void => {
                this.batchPromiseHandlers = {resolve, reject};
            });
            try {
                const result = await this.connection.query(SQL`INSERT INTO $identifier${this.tableName} $multiInsert${rows} $raw${this.querySuffix}`);
                this.insertedRowCount += result.rowCount;
                batchPromiseHandlers.resolve();
            } catch (error) {
                batchPromiseHandlers.reject(error);
            }
        }
    }
}

export default BatchInsertCollector;
