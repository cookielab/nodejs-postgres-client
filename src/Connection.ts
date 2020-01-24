import {DeleteCollectorOptions, OneDatabaseValue} from './BatchDeleteCollector';
import {InsertCollectorOptions} from './BatchInsertCollector';
import {QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import DatabaseDeleteStream from './streams/DatabaseDeleteStream';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';

export interface AsyncQueryable {
	query<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult<T>>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AsyncConnection extends AsyncQueryable {
	findOne<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
	findOneColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<T | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getOne<T extends Row = Row>(input: QueryConfig, error: {new(...parameters: readonly any[]): Error}): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insert<T extends Row = Row>(table: string, values: T): Promise<void>;

	getRow<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getRows<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<readonly T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<readonly T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getOneColumn<T extends any = unknown>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insertStream<T extends Row = Row>(tableName: string, options?: InsertCollectorOptions): Promise<DatabaseInsertStream<T>>;
	deleteStream<T extends OneDatabaseValue = string>(tableName: string, options?: DeleteCollectorOptions): Promise<DatabaseDeleteStream<T>>;
}

export interface Connection extends AsyncConnection {
	transaction<T>(callback: (connection: Connection) => Promise<T> | T): Promise<T>;

	streamQuery(input: QueryConfig | string, values?: readonly any[]): Promise<DatabaseReadStream>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
