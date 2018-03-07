import OneRowExpectedError from '../src/errors/OneRowExpectedError';
import QueryableConnection from '../src/QueryableConnection';

describe('findOne', () => {
    it('returns a row when found', async () => {
        const row = {};
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRows').mockImplementation(() => {
            return [
                row,
            ];
        });

        const result = await connection.findOne('SELECT 42 AS answer');
        expect(result).toBe(row);
    });

    it('returns null when a row is not found', async () => {
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRows').mockImplementation(() => {
            return [];
        });

        const result = await connection.findOne('SELECT 42');
        expect(result).toBe(null);
    });

    it('throws an error if too many rows are found', async () => {
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'getRows').mockImplementation(() => {
            return [
                {},
                {},
            ];
        });

        await expect(connection.findOne('SELECT 42')).rejects.toBeInstanceOf(OneRowExpectedError);
    });
});
