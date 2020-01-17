import {InsertCollectorOptions} from './BatchInsertCollector';
import {QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';

export interface AsyncQueryable {
	query<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<QueryResult<T>>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AsyncConnection extends AsyncQueryable {
	findOne<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
	findOneColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<T | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getOne<T extends Row = Row>(input: QueryConfig, error: {new(...parameters: readonly any[]): Error}): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insert<T extends Row = Row>(table: string, values: T): Promise<QueryResult<T>>;

	getRow<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getRows<T extends Row = Row>(input: QueryConfig | string, values?: readonly any[]): Promise<readonly T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<readonly T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getOneColumn<T>(input: QueryConfig | string, values?: readonly any[], columnIndex?: number): Promise<T>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insertStream<T extends Row = Row>(tableName: string, options?: InsertCollectorOptions): DatabaseInsertStream<T>;
}

export interface Connection extends AsyncConnection {
	transaction<T>(callback: (connection: Connection) => Promise<T> | T): Promise<T>;

	streamQuery(input: QueryConfig | string, values?: readonly any[]): Promise<DatabaseReadStream>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
