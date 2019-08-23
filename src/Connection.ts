import {QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';

export interface AsyncQueryable {
	query(input: QueryConfig | string, values?: any[]): Promise<QueryResult>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface AsyncConnection extends AsyncQueryable {
	findOne(input: QueryConfig | string, values?: any[]): Promise<Row | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getOne(input: QueryConfig, error: {new(...parameters: any[]): Error}): Promise<Row>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insert(table: string, values: Row): Promise<QueryResult>;

	getRow(input: QueryConfig | string, values?: any[]): Promise<Row>; // eslint-disable-line @typescript-eslint/no-explicit-any
	getRows(input: QueryConfig | string, values?: any[]): Promise<Row[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
	insertStream(tableName: string, querySuffix?: string, batchSize?: number): DatabaseInsertStream;
}

export interface Connection extends AsyncConnection {
	transaction<T>(callback: (connection: Connection) => Promise<T> | T): Promise<T>;

	streamQuery(input: QueryConfig | string, values?: any[]): Promise<DatabaseReadStream>; // eslint-disable-line @typescript-eslint/no-explicit-any
}
