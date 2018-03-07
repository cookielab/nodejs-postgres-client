import QueryableConnection from '../src/QueryableConnection';

describe('getRows', () => {
    it('returns only the result rows', async () => {
        const resultRows = [];
        const connection = new QueryableConnection();

        jest.spyOn(connection, 'query').mockImplementation(() => ({
            rows: resultRows,
        }));

        const result = await connection.getRows('');
        expect(result).toBe(resultRows);
    });
});
