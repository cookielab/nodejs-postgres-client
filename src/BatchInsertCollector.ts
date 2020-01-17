import {AsyncQueryable} from './Connection';
import {Row} from './Row';
import {SQL} from 'pg-async';

const MAX_BATCH_SIZE = 1000;

export interface InsertCollectorOptions {
	readonly batchSize?: number;
	readonly querySuffix?: string;
}

class BatchInsertCollector<T extends Row> {
	private readonly connection: AsyncQueryable;
	private readonly tableName: string;
	private readonly options: Readonly<Required<InsertCollectorOptions>>;
	private insertedRowCount: number;
	private records: T[];
	private flushPromise: Promise<void>;

	public constructor(connection: AsyncQueryable, tableName: string, options?: InsertCollectorOptions) {
		this.connection = connection;
		this.tableName = tableName;
		this.options = {
			batchSize: options?.batchSize != null && options.batchSize > 0 && options.batchSize <= MAX_BATCH_SIZE
				? options.batchSize
				: MAX_BATCH_SIZE,
			querySuffix: options?.querySuffix ?? '',
		};
		this.insertedRowCount = 0;
		this.records = [];
		this.flushPromise = Promise.resolve();
	}

	public getBatchSize(): number {
		return this.options.batchSize;
	}

	public getInsertedRowCount(): number {
		return this.insertedRowCount;
	}

	public add(record: T): void {
		this.records.push(record);
		if (this.records.length >= this.options.batchSize) {
			this.flushPromise = this.flush();
		}
	}

	public async flush(): Promise<void> {
		const records = this.records;
		const promise = this.flushPromise;
		this.records = [];
		await promise;
		if (records.length > 0) {
			const result = await this.connection.query(SQL`INSERT INTO $identifier${this.tableName} $multiInsert${records} $raw${this.options.querySuffix}`);
			this.insertedRowCount = this.insertedRowCount + result.rowCount;
		}
	}
}

export default BatchInsertCollector;
