import {SQL} from '../src';
import Client from '../src/Client';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

class CustomNotFoundError extends Error {
    private id: any;
    constructor(id: any) {
        super('Not found.');
        this.id = id;
    }
}

class UnexpectedError extends Error {
}

describe('getOne', () => {
    it('returns a row when found', async () => {
        const databaseRow = {};
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'getRow').mockImplementation(() => Promise.resolve(databaseRow));

        const id = 42;
        const result = await connection.getOne(SQL`SELECT ${id}`, OneRowExpectedError);

        expect(result).toBe(databaseRow);
    });

    it('throws a custom error when a row is not found using parametrized query', async () => {
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'getRow').mockImplementation(() => Promise.reject(new OneRowExpectedError(0)));

        const id = 42;

        await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
            .rejects
            .toEqual(new CustomNotFoundError(id));
    });

    it('throws a custom error when a row is not found using plain text query', async () => {
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'getRow').mockImplementation(() => Promise.reject(new OneRowExpectedError(0)));

        await expect(connection.getOne({text: 'SELECT 42'}, CustomNotFoundError))
            .rejects
            .toEqual(new CustomNotFoundError(0));
    });

    it('rethrows an unexpected error', async () => {
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'getRow').mockImplementation(() => Promise.reject(new UnexpectedError()));

        const id = 42;

        await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
            .rejects
            .toEqual(new UnexpectedError());
    });
});
