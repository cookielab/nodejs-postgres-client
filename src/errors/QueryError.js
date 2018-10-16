// @flow

import type {QueryConfig} from 'pg';
import type {QueryValue} from '../QueryValue';

class QueryError extends Error {
    +query: string;
    +values: ?QueryValue[];
    causedBy: ?Error;

    constructor(input: QueryConfig | string, values?: QueryValue[]): void {
        super('Query execution failed.');
        this.query = typeof input === 'string' ? input : input.text;
        this.values = typeof input === 'string' ? values : input.values;
    }
}

export default QueryError;
