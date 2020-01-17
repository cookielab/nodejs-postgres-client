import {AsyncQueryable} from './Connection';
import {Row} from './Row';
import {SQL} from 'pg-async';

const MAX_BATCH_SIZE = 1000;

export interface CollectorOptions {
	readonly batchSize?: number;
	readonly querySuffix?: string;
}

class BatchInsertCollector {
	private readonly connection: AsyncQueryable;
	private readonly tableName: string;
	private readonly options: Readonly<Required<CollectorOptions>>;
	private insertedRowCount: number;
	private rows: Row[];
	private flushPromise: Promise<void>;

	public constructor(connection: AsyncQueryable, tableName: string, options?: CollectorOptions) {
		this.connection = connection;
		this.tableName = tableName;
		this.options = {
			batchSize: options?.batchSize != null && options.batchSize > 0 && options.batchSize <= MAX_BATCH_SIZE
				? options.batchSize
				: MAX_BATCH_SIZE,
			querySuffix: options?.querySuffix ?? '',
		};
		this.insertedRowCount = 0;
		this.rows = [];
		this.flushPromise = Promise.resolve();
	}

	public getBatchSize(): number {
		return this.options.batchSize;
	}

	public getInsertedRowCount(): number {
		return this.insertedRowCount;
	}

	public add(row: Row): void {
		this.rows.push(row);
		if (this.rows.length >= this.options.batchSize) {
			this.flushPromise = this.flush();
		}
	}

	public async flush(): Promise<void> {
		const rows = this.rows;
		const promise = this.flushPromise;
		this.rows = [];
		await promise;
		if (rows.length > 0) {
			const result = await this.connection.query(SQL`INSERT INTO $identifier${this.tableName} $multiInsert${rows} $raw${this.options.querySuffix}`);
			this.insertedRowCount = this.insertedRowCount + result.rowCount;
		}
	}
}

export default BatchInsertCollector;
