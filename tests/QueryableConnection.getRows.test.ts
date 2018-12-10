import Client from '../src/Client';
import {Row} from '../src';

describe('getRows', () => {
    it('returns only the result rows', async () => {
        const resultRows: Row[] = [];
        const connection = new Client(jest.fn() as any);
        jest.spyOn(connection, 'query').mockImplementation(() => ({
            rows: resultRows,
        }));

        const result = await connection.getRows('');
        expect(result).toBe(resultRows);
    });
});
