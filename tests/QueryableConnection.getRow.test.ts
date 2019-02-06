import OneRowExpectedError from '../src/errors/OneRowExpectedError';
import Client from '../src/Client';

describe('getRow', () => {
    it('returns only one row when found', async () => {
        const resultRow = {};
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
            rows: [resultRow],
        }));

        const result = await connection.getRow('');
        expect(result).toBe(resultRow);
    });

    it('throws an exception when no row is found', async () => {
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
            command: 'SELECT',
            rowCount: 0,
            oid: 0,
            fields: [],
            rows: [],
        }));

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(0));
    });

    it('throws an exception when too many rows are found', async () => {
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
            command: 'SELECT',
            rowCount: 2,
            oid: 0,
            fields: [],
            rows: [
                {},
                {},
            ],
        }));

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(2));
    });
});
