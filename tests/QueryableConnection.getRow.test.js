import OneRowExpectedError from '../src/errors/OneRowExpectedError';
import QueryableConnection from '../src/QueryableConnection';

describe('getRow', () => {
    it('returns only one row when found', async () => {
        const resultRow = {};

        const client = new (jest.fn())();
        client.query = jest.fn(() => ({
            rows: [resultRow],
        }));

        const connection = new QueryableConnection(client);

        const result = await connection.getRow('');
        expect(result).toBe(resultRow);
    });

    it('throws an exception when no row is found', async () => {
        const client = new (jest.fn())();
        client.query = jest.fn(() => ({
            rows: [],
        }));

        const connection = new QueryableConnection(client);

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(0));
    });

    it('throws an exception when too many rows are found', async () => {
        const client = new (jest.fn())();
        client.query = jest.fn(() => ({
            rows: [
                {},
                {},
            ],
        }));

        const connection = new QueryableConnection(client);

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(2));
    });
});
