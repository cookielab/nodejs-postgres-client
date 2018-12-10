class OneRowExpectedError extends Error {
    readonly count: number;

    constructor(count: number) {
        super(`Exactly one row is expected, but the query returned "${count}" rows.`);
        this.count = count;
    }
}

export default OneRowExpectedError;
