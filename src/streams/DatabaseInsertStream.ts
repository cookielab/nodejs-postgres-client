import {Row} from '../Row';
import {Writable} from 'stream';
import BatchInsertCollector from '../collectors/BatchInsertCollector';

export default class DatabaseInsertStream<T extends Row> extends Writable {
	private readonly batchInsertCollector: BatchInsertCollector<T>;

	public constructor(batchInsertCollector: BatchInsertCollector<T>) {
		super({
			objectMode: true,
			highWaterMark: batchInsertCollector.getBatchSize(),
		});
		this.batchInsertCollector = batchInsertCollector;
	}

	public _write(record: T, encoding: string, callback: (error?: Error) => void): void {
		try {
			this.batchInsertCollector.add(record);
			callback();
		} catch (error) {
			callback(error);
		}
	}

	public async _final(callback: (error?: Error) => void): Promise<void> {
		try {
			await this.batchInsertCollector.flush();
			this.emit('inserting_finished', {
				affectedRowCount: this.batchInsertCollector.getAffectedRowCount(),
			});
			callback();
		} catch (error) {
			callback(error);
		}
	}
}
