import {AsyncQueryable} from '../Connection';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import BatchCollector from './BatchCollector';

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

class BatchDeleteCollector<T extends OneDatabaseValue> extends BatchCollector<T> {
	private readonly keyName: string;

	public constructor(connection: AsyncQueryable, tableName: string, options?: DeleteCollectorOptions) {
		super(connection, tableName, options?.batchSize);
		this.keyName = options?.keyName ?? 'id';
	}

	protected getQuery(values: readonly T[]): SqlFragment {
		return SQL`DELETE FROM $identifier${this.tableName} WHERE $identifier${this.keyName} IN ($values${values})`;
	}
}

export default BatchDeleteCollector;
