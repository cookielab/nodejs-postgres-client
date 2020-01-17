class NonExistentColumnIndexError extends Error {
	public readonly maximumAvailableIndex: number;
	public readonly requestedColumnIndex: number;

	public constructor(requestedColumnIndex: number, maximumAvailableIndex: number) {
		super(`Non existent column index ${requestedColumnIndex} requested, but query maximum available index is ${maximumAvailableIndex}`);
		this.maximumAvailableIndex = maximumAvailableIndex;
		this.requestedColumnIndex = requestedColumnIndex;
	}
}

export default NonExistentColumnIndexError;
