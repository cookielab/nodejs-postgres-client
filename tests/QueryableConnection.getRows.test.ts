import {Row} from '../src';
import Client from '../src/Client';

describe('QueryableConnection.getRows', () => {
	it('returns only the result rows', async () => {
		const resultRows: Row[] = [];
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'INSERT',
				rowCount: 0,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.getRows('');
		expect(result).toBe(resultRows);
	});
});
