import {QueryConfig} from 'pg';

class QueryError extends Error {
	public readonly query: string;
	public readonly values: readonly any[] | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
	private _causedBy: Error | undefined;

	public constructor(input: QueryConfig | string, values?: readonly any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
		super('Query execution failed.');
		this.query = typeof input === 'string' ? input : input.text;
		this.values = typeof input === 'string' ? values : input.values;
	}

	public get causedBy(): Error | undefined {
		return this._causedBy;
	}

	public set causedBy(value: Error | undefined) {
		if (this._causedBy != null) {
			throw new Error('Error reason (caused by) was already set.');
		}
		this._causedBy = value;
	}
}

export default QueryError;
