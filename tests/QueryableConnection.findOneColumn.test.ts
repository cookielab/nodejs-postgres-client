import {Row, SQL} from '../src';
import Client from '../src/Client';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

describe('findOneColumn', () => {
	it('returns value of column with index 0 when column index not supplied and row is found', async () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
			command: 'SELECT',
			rowCount: 2,
			oid: 0,
			fields: [{
				name: 'id',
				tableID: 1,
				columnID: 1,
				dataTypeID: 1,
				dataTypeSize: 1,
				dataTypeModifier: 1,
				format: '??',
			}, {
				name: 'name',
				tableID: 2,
				columnID: 2,
				dataTypeID: 2,
				dataTypeSize: 2,
				dataTypeModifier: 2,
				format: '??',
			}],
			rows: queryRows,
		}));

		const expectedValue = 42;

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name FROM table`);

		expect(result).toEqual(expectedValue);
	});

	it('returns value for requested column index from row when found', async () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
			command: 'SELECT',
			rowCount: 2,
			oid: 0,
			fields: [{
				name: 'id',
				tableID: 1,
				columnID: 1,
				dataTypeID: 1,
				dataTypeSize: 1,
				dataTypeModifier: 1,
				format: '??',
			}, {
				name: 'name',
				tableID: 2,
				columnID: 2,
				dataTypeID: 2,
				dataTypeSize: 2,
				dataTypeModifier: 2,
				format: '??',
			}],
			rows: queryRows,
		}));

		const expectedValue = 'row 42';

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name FROM table`, [], 1);

		expect(result).toEqual(expectedValue);
	});

	it('returns null when a row is not found', async () => {
		const queryRows: Row[] = [];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
			command: 'SELECT',
			rowCount: 2,
			oid: 0,
			fields: [{
				name: 'id',
				tableID: 1,
				columnID: 1,
				dataTypeID: 1,
				dataTypeSize: 1,
				dataTypeModifier: 1,
				format: '??',
			}, {
				name: 'name',
				tableID: 2,
				columnID: 2,
				dataTypeID: 2,
				dataTypeSize: 2,
				dataTypeModifier: 2,
				format: '??',
			}],
			rows: queryRows,
		}));

		const result = await connection.findOneColumn<number>(SQL`SELECT id, name from table`, [], 1);

		expect(result).toEqual(null);
	});

	it('throws an error if too many rows are not found', async () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}, {
			id: 666,
			name: 'row 666',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
			command: 'SELECT',
			rowCount: 2,
			oid: 0,
			fields: [{
				name: 'id',
				tableID: 1,
				columnID: 1,
				dataTypeID: 1,
				dataTypeSize: 1,
				dataTypeModifier: 1,
				format: '??',
			}, {
				name: 'name',
				tableID: 2,
				columnID: 2,
				dataTypeID: 2,
				dataTypeSize: 2,
				dataTypeModifier: 2,
				format: '??',
			}],
			rows: queryRows,
		}));

		await expect(connection.findOneColumn<number>(SQL`SELECT id, name from table`, [], 1)).rejects.toEqual(new OneRowExpectedError(2));
	});

	it('throws an error when non existent column index requested', async () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
		}];

		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query').mockImplementation(() => Promise.resolve({
			command: 'SELECT',
			rowCount: 2,
			oid: 0,
			fields: [{
				name: 'id',
				tableID: 1,
				columnID: 1,
				dataTypeID: 1,
				dataTypeSize: 1,
				dataTypeModifier: 1,
				format: '??',
			}, {
				name: 'name',
				tableID: 2,
				columnID: 2,
				dataTypeID: 2,
				dataTypeSize: 2,
				dataTypeModifier: 2,
				format: '??',
			}],
			rows: queryRows,
		}));

		await expect(connection.findOneColumn<string>(SQL`SELECT id, name, non_existent from table`, [], 3)).rejects.toEqual(new NonExistentColumnIndexError(3, 1));
	});
});
