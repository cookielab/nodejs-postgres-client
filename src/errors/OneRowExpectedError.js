// @flow

class OneRowExpectedError extends Error {
    count: number;

    constructor(count: number): void {
        super(`Exactly one row is expected, but the query returned "${count}" rows.`);
        this.count = count;
    }
}

export default OneRowExpectedError;
