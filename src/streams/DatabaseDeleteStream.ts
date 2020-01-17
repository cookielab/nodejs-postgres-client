import {Writable} from 'stream';
import BatchDeleteCollector, {OneDatabaseValue} from '../BatchDeleteCollector';

export default class DatabaseDeleteStream<T extends OneDatabaseValue> extends Writable {
	private readonly batchDeleteCollector: BatchDeleteCollector<T>;

	public constructor(batchDeleteCollector: BatchDeleteCollector<T>) {
		super({
			objectMode: true,
			highWaterMark: batchDeleteCollector.getBatchSize(),
		});
		this.batchDeleteCollector = batchDeleteCollector;
	}

	public _write(key: T, encoding: string, callback: (error?: Error) => void): void {
		try {
			this.batchDeleteCollector.add(key);
			callback();
		} catch (error) {
			callback(error);
		}
	}

	public async _final(callback: (error?: Error) => void): Promise<void> {
		try {
			await this.batchDeleteCollector.flush();
			this.emit('deleting_finished', {
				deletedRowCount: this.batchDeleteCollector.getDeletedRowCount(),
			});
			callback();
		} catch (error) {
			callback(error);
		}
	}
}
