// @flow

import type DatabaseReadStream from './streams/DatabaseReadStream';
import type QueryableConnection from './QueryableConnection';
import type {QueryConfig} from 'pg';
import type {QueryValue} from './QueryValue';

export type Connection = QueryableConnection & {
    transaction<T>((connection: Connection) => Promise<T>): Promise<T>,
    streamQuery(input: QueryConfig | string, values?: QueryValue[]): Promise<DatabaseReadStream>,
};
