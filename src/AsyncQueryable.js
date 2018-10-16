// @flow

import type {QueryConfig, ResultSet} from 'pg';
import type {QueryValue} from './QueryValue';

export interface AsyncQueryable {
    query(input: QueryConfig | string, values?: QueryValue[]): Promise<ResultSet>,
}
