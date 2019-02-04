import {QueryConfig} from 'pg';

class QueryError extends Error {
    readonly query: string;
    readonly values: any[] | undefined;
    causedBy: Error | undefined;

    constructor(input: QueryConfig | string, values?: any[]) {
        super('Query execution failed.');
        this.query = typeof input === 'string' ? input : input.text;
        this.values = typeof input === 'string' ? values : input.values;
    }
}

export default QueryError;
