// @flow

import type {QueryInput} from 'pg';

class QueryError extends Error {
    query: string;
    causedBy: ?Error;
    values: ?mixed[];

    constructor(input: QueryInput, values?: mixed[]): void {
        super('Query execution failed.');
        this.query = input.toString();
        this.values = values;
    }
}

export default QueryError;
