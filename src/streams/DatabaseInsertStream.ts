import {Row} from '../Row';
import {Writable} from 'stream';
import BatchInsertCollector from '../BatchInsertCollector';

export default class DatabaseInsertStream extends Writable {
	private readonly batchInsertCollector: BatchInsertCollector;
	private promises: Set<Promise<void>>;

	public constructor(batchInsertCollector: BatchInsertCollector) {
		super({
			objectMode: true,
			highWaterMark: batchInsertCollector.getBatchSize(),
		});
		this.batchInsertCollector = batchInsertCollector;
		this.promises = new Set();
	}

	public async _write(row: Row, encoding: string, callback: (error?: Error) => void): Promise<void> {
		try {
			this.promises.add(this.batchInsertCollector.add(row));

			if (this.promises.size >= this.writableHighWaterMark) {
				await Promise.all(this.getPromisesForAwait());
			}
			callback();
		} catch (error) {
			callback(error);
		}
	}

	public async _final(callback: (error?: Error) => void): Promise<void> {
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

	private getPromisesForAwait(): ReadonlyArray<Promise<void>> {
		const promises = Array.from(this.promises.values());
		this.promises = new Set();

		return promises;
	}
}
