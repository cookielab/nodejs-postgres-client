// @flow

import type {QueryConfig, ResultSet} from 'pg';

export interface AsyncQueryable {
    query(input: QueryConfig | string, values?: mixed[]): Promise<ResultSet>,
}
