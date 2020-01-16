import {QueryConfig} from 'pg';

class QueryError extends Error {
	public readonly query: string;
	public readonly values: readonly any[] | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
	public causedBy: Error | undefined;

	public constructor(input: QueryConfig | string, values?: readonly any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
		super('Query execution failed.');
		this.query = typeof input === 'string' ? input : input.text;
		this.values = typeof input === 'string' ? values : input.values;
	}
}

export default QueryError;
