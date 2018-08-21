// @flow

import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryableConnection from './QueryableConnection';
import type {QueryConfig} from 'pg';

export type Connection = QueryableConnection & {
    transaction<T>((connection: Connection) => Promise<T>): Promise<T>,
    streamQuery(input: QueryConfig | string, values?: mixed[]): Promise<DatabaseReadStream>,
};
