import {QueryConfig} from 'pg';
import {QueryValue} from '../QueryValue';

class QueryError extends Error {
    readonly query: string;
    readonly values: QueryValue[] | undefined;
    causedBy: Error | undefined;

    constructor(input: QueryConfig | string, values?: QueryValue[]) {
        super('Query execution failed.');
        this.query = typeof input === 'string' ? input : input.text;
        this.values = typeof input === 'string' ? values : input.values;
    }
}

export default QueryError;
