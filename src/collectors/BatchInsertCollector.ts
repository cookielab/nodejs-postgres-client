import {AsyncQueryable} from '../Connection';
import {Row} from '../Row';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import BatchCollector from './BatchCollector';

export interface InsertCollectorOptions {
	readonly batchSize?: number;
	readonly querySuffix?: string;
}

class BatchInsertCollector<T extends Row> extends BatchCollector<T> {
	private readonly querySuffix: string;

	public constructor(connection: AsyncQueryable, tableName: string, options?: InsertCollectorOptions) {
		super(connection, tableName, options?.batchSize);
		this.querySuffix = options?.querySuffix ?? '';
	}

	protected getQuery(values: readonly T[]): SqlFragment {
		return SQL`INSERT INTO $identifier${this.tableName} $multiInsert${values} $raw${this.querySuffix}`;
	}
}

export default BatchInsertCollector;
