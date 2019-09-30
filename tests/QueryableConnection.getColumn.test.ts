import {Row, SQL} from '../src';
import Client from '../src/Client';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';

describe('getColumn', () => {
	it('returns values of column with index 0 when column index not supplied', async () => {
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

		const expectedValues = [42, 666];

		const result = await connection.getColumn(SQL`SELECT id, name FROM table`);

		expect(result).toEqual(expectedValues);
	});

	it('returns values for requested column index from rows', async () => {
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

		const expectedValues = ['row 42', 'row 666'];

		const result = await connection.getColumn(SQL`SELECT id, name FROM table`, [], 1);

		expect(result).toEqual(expectedValues);
	});

	it('throws error when non existent column index requested', async () => {
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

		await expect(connection.getColumn(SQL`SELECT id, name, non_existent from table`, [], 3)).rejects.toEqual(new NonExistentColumnIndexError(3, 1));
	});
});
