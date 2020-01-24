import {Row, SQL} from '../src';
import Client from '../src/Client';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

describe('getOneColumn', () => {
	it('returns value of column with index 0 when column index not supplied and row is found', async () => {
		const resultRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.getOneColumn<number>(SQL`SELECT id, name FROM table`);

		expect(result).toBe(42);
	});

	it('returns value for requested column index from row when found', async () => {
		const resultRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.getOneColumn<number>(SQL`SELECT id, name FROM table`, [], 1);

		expect(result).toBe('row 42');
	});

	it('throws error when non existent column index requested', async () => {
		const resultRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		await expect(connection.getColumn(SQL`SELECT id, name, non_existent from table`, [], 3))
			.rejects.toEqual(new NonExistentColumnIndexError(3, 1));
	});

	it('throws error when more than one row is returned', async () => {
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

		await expect(connection.getOneColumn<number>(SQL`SELECT id, name from table`, [], 1))
			.rejects.toEqual(new OneRowExpectedError(2));
	});
});
