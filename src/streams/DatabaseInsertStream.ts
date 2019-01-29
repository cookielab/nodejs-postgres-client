import BatchInsertCollector from '../BatchInsertCollector';
import {Writable} from 'stream';
import {Row} from '../Row';

export default class DatabaseInsertStream extends Writable {
    private readonly batchInsertCollector: BatchInsertCollector;
    private itemsCount: number;
    private promises: Set<Promise<void>>;

    constructor(batchInsertCollector: BatchInsertCollector) {
        super({
            objectMode: true,
            highWaterMark: batchInsertCollector.getBatchSize(),
        });
        this.batchInsertCollector = batchInsertCollector;
        this.itemsCount = 0;
        this.promises = new Set();
    }

    getPromisesForAwait(): Promise<void>[] {
        const promises = Array.from(this.promises.values());
        this.itemsCount = 0;
        this.promises = new Set();
        return promises;
    }

    async _write(row: Row, encoding: string, callback: (error?: Error) => void): Promise<void> {
        try {
            this.promises.add(this.batchInsertCollector.add(row));
            this.itemsCount++;

            if (this.itemsCount >= this.writableHighWaterMark) {
                await Promise.all(this.getPromisesForAwait());
            }
            callback();
        } catch (error) {
            callback(error);
        }
    }

    async _final(callback: (error?: Error) => void): Promise<void> {
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
