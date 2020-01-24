import Client from '../src/Client';

describe('QueryableConnection.insert', () => {
	it('converts table name and the values', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		const queryMock = jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'INSERT',
				rowCount: 0,
				oid: 0,
				fields: [],
				rows: [],
			}));

		await connection.insert('table', {some: 'value'});

		expect(queryMock).toHaveBeenCalledTimes(1);
		expect(queryMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
			text: expect.stringContaining('INSERT INTO "table" ("some") VALUES ($1)'),
			values: ['value'],
		}));

		queryMock.mockRestore();
	});
});
