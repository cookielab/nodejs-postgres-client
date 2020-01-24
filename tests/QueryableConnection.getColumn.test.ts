import {Row, SQL} from '../src';
import Client from '../src/Client';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';

describe('getColumn', () => {
	it('returns values of column with index 0 when column index not supplied', async () => {
		const resultRows: Row[] = [
			{
				id: 42,
				name: 'row 42',
			},
			{
				id: 666,
				name: 'row 666',
			},
		];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.getColumn(SQL`SELECT id, name FROM table`);

		expect(result).toStrictEqual([42, 666]);
	});

	it('returns values for requested column index from rows', async () => {
		const resultRows: Row[] = [
			{
				id: 42,
				name: 'row 42',
			}, {
				id: 666,
				name: 'row 666',
			},
		];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.getColumn(SQL`SELECT id, name FROM table`, [], 1);

		expect(result).toStrictEqual(['row 42', 'row 666']);
	});

	it('throws error when non existent column index requested', async () => {
		const resultRows: Row[] = [
			{
				id: 42,
				name: 'row 42',
			}, {
				id: 666,
				name: 'row 666',
			},
		];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		await expect(connection.getColumn(SQL`SELECT id, name from table`, [], 3))
			.rejects.toEqual(new NonExistentColumnIndexError(3, 1));
	});
});
