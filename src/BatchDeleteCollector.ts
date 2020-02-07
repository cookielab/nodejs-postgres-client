import {AsyncQueryable} from './Connection';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';

const MAX_BATCH_SIZE = 1000;

export interface DeleteCollectorOptions {
	readonly batchSize?: number;
	readonly keyName?: string;
}

interface PostgresConvertible {
	toPostgres(): string;
}

interface SQLConvertible {
	toSQL(): string;
}

interface StringConvertible {
	toString(): string;
}

export type OneDatabaseValue = string | number | SqlFragment | PostgresConvertible | SQLConvertible | StringConvertible | null;

class BatchDeleteCollector<T extends OneDatabaseValue> {
	private readonly connection: AsyncQueryable;
	private readonly tableName: string;
	private readonly options: Readonly<Required<DeleteCollectorOptions>>;
	private deletedRowCount: number;
	private keys: T[];
	private flushPromise: Promise<void>;
	private error: Error | null;

	public constructor(connection: AsyncQueryable, tableName: string, options?: DeleteCollectorOptions) {
		this.connection = connection;
		this.tableName = tableName;
		this.options = {
			batchSize: options?.batchSize != null && options.batchSize > 0 && options.batchSize <= MAX_BATCH_SIZE
				? options.batchSize
				: MAX_BATCH_SIZE,
			keyName: options?.keyName ?? 'id',
		};
		this.deletedRowCount = 0;
		this.keys = [];
		this.flushPromise = Promise.resolve();
		this.error = null;
	}

	public getBatchSize(): number {
		return this.options.batchSize;
	}

	public getDeletedRowCount(): number {
		return this.deletedRowCount;
	}

	public add(key: T): void {
		if (this.error != null) {
			throw this.error;
		}
		this.keys.push(key);
		if (this.keys.length >= this.options.batchSize) {
			this.flushPromise = this.flushInternal(true);
		}
	}

	public async flush(): Promise<void> {
		return await this.flushInternal(false);
	}

	private async flushInternal(internalCall: boolean): Promise<void> {
		const keys = this.keys;
		const promise = this.flushPromise;
		this.keys = [];
		await promise;
		if (!internalCall && this.error != null) {
			throw this.error;
		}
		if (keys.length > 0) {
			try {
				const result = await this.connection.query(SQL`DELETE FROM $identifier${this.tableName} WHERE $identifier${this.options.keyName} IN ($values${keys})`);
				this.deletedRowCount = this.deletedRowCount + result.rowCount;
			} catch (error) {
				this.error = error;
				if (!internalCall) {
					throw error;
				}
			}
		}
	}
}

export default BatchDeleteCollector;
