class NonExistentColumnIndexError extends Error {
	private readonly maximumAvailableIndex: number;
	private readonly requestedColumnIndex: number;

	public constructor(requestedColumnIndex: number, maximumAvailableIndex: number) {
		super(`Non existent column index ${requestedColumnIndex} requested, but query maximum available index is ${maximumAvailableIndex}`);
		this.maximumAvailableIndex = maximumAvailableIndex;
		this.requestedColumnIndex = requestedColumnIndex;
	}
}

export default NonExistentColumnIndexError;
