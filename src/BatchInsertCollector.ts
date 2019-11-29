import {AsyncQueryable} from './Connection';
import {Row} from './Row';
import {SQL} from 'pg-async';

const maxBatchInsert = 1000;

class BatchInsertCollector {
	private readonly connection: AsyncQueryable;
	private readonly tableName: string;
	private insertedRowCount: number;
	private batchSize: number;
	private querySuffix: string;
	private rows: Row[];
	private batchPromise: Promise<void>;
	private batchPromiseHandlers!: {resolve: () => void; reject: (error: Error) => void}; // ! - initialized in the promise created in the constructor

	public constructor(connection: AsyncQueryable, tableName: string) {
		this.connection = connection;
		this.tableName = tableName;
		this.insertedRowCount = 0;
		this.batchSize = maxBatchInsert;
		this.querySuffix = '';
		this.rows = [];
		this.batchPromise = new Promise((resolve: () => void, reject: (error: Error) => void): void => {
			this.batchPromiseHandlers = {resolve, reject};
		});
	}

	public getBatchSize(): number {
		return this.batchSize;
	}

	public setBatchSize(batchSize: number): BatchInsertCollector {
		this.batchSize = batchSize <= 0 || batchSize > maxBatchInsert
			? maxBatchInsert
			: batchSize;

		return this;
	}

	public setQuerySuffix(querySuffix: string): BatchInsertCollector {
		this.querySuffix = querySuffix;

		return this;
	}

	public getInsertedRowCount(): number {
		return this.insertedRowCount;
	}

	public async add(row: Row): Promise<void> {
		this.rows.push(row);
		const promise = this.batchPromise;

		if (this.rows.length === 1) {
			process.nextTick(() => this.flush());
		}
		if (this.rows.length >= this.batchSize) {
			await this.flush();
		}

		return await promise;
	}

	public async flush(): Promise<void> {
		if (this.rows.length > 0) {
			const rows = this.rows;
			const batchPromiseHandlers = this.batchPromiseHandlers;
			this.rows = [];
			this.batchPromise = new Promise((resolve: () => void, reject: (error: Error) => void): void => {
				this.batchPromiseHandlers = {resolve, reject};
			});
			try {
				const result = await this.connection.query(SQL`INSERT INTO $identifier${this.tableName} $multiInsert${rows} $raw${this.querySuffix}`);
				this.insertedRowCount = this.insertedRowCount + result.rowCount;
				batchPromiseHandlers.resolve();
			} catch (error) {
				batchPromiseHandlers.reject(error);
			}
		}
	}
}

export default BatchInsertCollector;
