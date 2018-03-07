import OneRowExpectedError from '../src/errors/OneRowExpectedError';
import QueryableConnection from '../src/QueryableConnection';
import {SQL} from '../src';

class CustomNotFoundError extends Error {
    constructor(id) {
        super('Not found.');
        this.id = id;
    }
}

class UnexpectedError extends Error {
}

describe('getOne', () => {
    it('returns a row when found', async () => {
        const databaseRow = {};
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRow').mockImplementation(() => databaseRow);

        const id = 42;
        const result = await connection.getOne(SQL`SELECT ${id}`);

        expect(result).toBe(databaseRow);
    });

    it('throws a custom error when a row is not found', async () => {
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRow').mockImplementation(() => {
            throw new OneRowExpectedError();
        });

        const id = 42;

        await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
            .rejects
            .toEqual(new CustomNotFoundError(id));
    });

    it('rethrows an unexpected error', async () => {
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRow').mockImplementation(() => {
            throw new UnexpectedError();
        });

        const id = 42;

        await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
            .rejects
            .toEqual(new UnexpectedError());
    });
});
