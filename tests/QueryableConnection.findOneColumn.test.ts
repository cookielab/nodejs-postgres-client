import {Row, SQL} from '../src';
import Client from '../src/Client';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

describe('findOneColumn', () => {
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

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name FROM table`);

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

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name FROM table`, [], 1);

		expect(result).toBe('row 42');
	});

	it('returns null when a row is not found', async () => {
		const resultRows: Row[] = [];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: resultRows,
			}));

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name from table`, [], 1);

		expect(result).toBeNull();
	});

	it('throws an error if too many rows are not found', async () => {
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

		await expect(connection.findOneColumn<number>(SQL`SELECT id, name from table`, [], 1))
			.rejects.toEqual(new OneRowExpectedError(2));
	});

	it('throws an error when non existent column index requested', async () => {
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

		await expect(connection.findOneColumn<string>(SQL`SELECT id, name from table`, [], 3))
			.rejects.toEqual(new NonExistentColumnIndexError(3, 1));
	});
});
