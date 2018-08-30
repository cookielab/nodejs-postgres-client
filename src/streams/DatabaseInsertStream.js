// @flow

import BatchInsertCollector from '../BatchInsertCollector';
import {Writable} from 'stream';
import type {Row} from '../Row';

export default class DatabaseInsertStream extends Writable {
    +batchInsertCollector: BatchInsertCollector;
    itemsCount: number;
    promises: Set<Promise<void>>;

    constructor(batchInsertCollector: BatchInsertCollector): void {
        super({
            objectMode: true,
            highWaterMark: batchInsertCollector.batchSize,
        });
        this.batchInsertCollector = batchInsertCollector;
        this.itemsCount = 0;
        this.promises = new Set();
    }

    // $FlowFixMe
    write(row: Row, encoding?: string | (?Error) => void, callback?: (?Error) => void): boolean {
        return super.write(row, encoding, callback);
    }

    // $FlowFixMe
    end(row?: Row | (?Error) => void, encoding?: string | (?Error) => void, callback?: (?Error) => void): void {
        return super.end(row, encoding, callback);
    }

    getPromisesForAwait(): Promise<void>[] {
        const promises = Array.from(this.promises.values());
        this.itemsCount = 0;
        this.promises = new Set();
        return promises;
    }

    // $FlowFixMe
    async _write(row: Row, encoding: string, callback: (?Error) => void): Promise<void> {
        try {
            this.promises.add(this.batchInsertCollector.add(row));
            this.itemsCount++;

            // $FlowFixMe
            if (this.itemsCount >= this.writableHighWaterMark) {
                await Promise.all(this.getPromisesForAwait());
            }
            callback();
        } catch (error) {
            callback(error);
        }
    }

    async _final(callback: (?Error) => void): Promise<void> {
        try {
            this.promises.add(this.batchInsertCollector.flush());
            await Promise.all(this.getPromisesForAwait());
            this.emit('inserting_finished', {
                insertedRowCount: this.batchInsertCollector.getInsertedRowCount(),
            });
            callback();
        } catch (error) {
            callback(error);
        }
    }
}
