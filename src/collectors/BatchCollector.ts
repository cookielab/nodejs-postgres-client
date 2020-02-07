import {AsyncQueryable} from '../Connection';
import {SqlFragment} from 'pg-async/lib/sql';

const MAX_BATCH_SIZE = 1000;

abstract class BatchCollector<T> {
	protected readonly connection: AsyncQueryable;
	protected readonly tableName: string;
	private readonly batchSize: number;
	private affectedRowCount: number;
	private values: T[];
	private flushPromise: Promise<void>;
	private error: Error | null;

	public constructor(connection: AsyncQueryable, tableName: string, batchSize?: number) {
		this.connection = connection;
		this.tableName = tableName;
		this.batchSize = batchSize != null && batchSize > 0 && batchSize <= MAX_BATCH_SIZE
			? batchSize
			: MAX_BATCH_SIZE;
		this.affectedRowCount = 0;
		this.values = [];
		this.flushPromise = Promise.resolve();
		this.error = null;
	}

	public getBatchSize(): number {
		return this.batchSize;
	}

	public getAffectedRowCount(): number {
		return this.affectedRowCount;
	}

	public add(value: T): void {
		if (this.error != null) {
			throw this.error;
		}
		this.values.push(value);
		if (this.values.length >= this.batchSize) {
			this.flushPromise = this.flushInternal(true);
		}
	}

	public async flush(): Promise<void> {
		return await this.flushInternal(false);
	}

	private async flushInternal(internalCall: boolean): Promise<void> {
		const values = this.values;
		const promise = this.flushPromise;
		this.values = [];
		await promise;
		if (!internalCall && this.error != null) {
			throw this.error;
		}
		if (values.length > 0) {
			try {
				const result = await this.connection.query(this.getQuery(values));
				this.affectedRowCount = this.affectedRowCount + result.rowCount;
			} catch (error) {
				this.error = error;
				if (!internalCall) {
					throw error;
				}
			}
		}
	}

	protected abstract getQuery(values: readonly T[]): SqlFragment;
}

export default BatchCollector;
