import {Row} from '../Row';
import {Writable} from 'stream';
import BatchInsertCollector from '../BatchInsertCollector';

export default class DatabaseInsertStream extends Writable {
	private readonly batchInsertCollector: BatchInsertCollector;

	public constructor(batchInsertCollector: BatchInsertCollector) {
		super({
			objectMode: true,
			highWaterMark: batchInsertCollector.getBatchSize(),
		});
		this.batchInsertCollector = batchInsertCollector;
	}

	public _write(row: Row, encoding: string, callback: (error?: Error) => void): void {
		try {
			this.batchInsertCollector.add(row);
			callback();
		} catch (error) {
			callback(error);
		}
	}

	public async _final(callback: (error?: Error) => void): Promise<void> {
		try {
			await this.batchInsertCollector.flush();
			this.emit('inserting_finished', {
				insertedRowCount: this.batchInsertCollector.getInsertedRowCount(),
			});
			callback();
		} catch (error) {
			callback(error);
		}
	}
}
