import DatabaseReadStream from './streams/DatabaseReadStream';
import {QueryConfig, QueryResult} from 'pg';
import {Row} from './Row';
import DatabaseInsertStream from './streams/DatabaseInsertStream';

export interface AsyncQueryable {
    query(input: QueryConfig | string, values?: any[]): Promise<QueryResult>;
}

export interface AsyncConnection extends AsyncQueryable {
    findOne(input: QueryConfig | string, values?: any[]): Promise<Row | null>;
    getOne(input: QueryConfig, error: {new(...parameters: any[]): Error}): Promise<Row>;
    insert(table: string, values: Row): Promise<QueryResult>;
    getRow(input: QueryConfig | string, values?: any[]): Promise<Row>;
    getRows(input: QueryConfig | string, values?: any[]): Promise<Row[]>;
    insertStream(tableName: string, querySuffix?: string, batchSize?: number): DatabaseInsertStream;
}

export interface Connection extends AsyncConnection {
    transaction<T>(callback: (connection: Connection) => Promise<T> | T): Promise<T>;
    streamQuery(input: QueryConfig | string, values?: any[]): Promise<DatabaseReadStream>;
}
