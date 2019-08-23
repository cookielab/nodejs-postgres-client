class OneRowExpectedError extends Error {
	public readonly count: number;

	public constructor(count: number) {
		super(`Exactly one row is expected, but the query returned "${count}" rows.`);
		this.count = count;
	}
}

export default OneRowExpectedError;
