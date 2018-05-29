// @flow

import type {QueryConfig} from 'pg';

class QueryError extends Error {
    query: string;
    causedBy: ?Error;
    values: ?mixed[];

    constructor(input: QueryConfig | string, values?: mixed[]): void {
        super('Query execution failed.');
        this.query = typeof input === 'string' ? input : input.text;
        this.values = typeof input === 'string' ? values : input.values;
    }
}

export default QueryError;
