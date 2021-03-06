import {Row} from '../src';
import Client from '../src/Client';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

describe('QueryableConnection.getRow', () => {
	it('returns only one row when found', async () => {
		const resultRow: Row = {};
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 1,
				oid: 0,
				fields: [],
				rows: [resultRow],
			}));

		const result = await connection.getRow('');
		expect(result).toBe(resultRow);
	});

	it('throws an exception when no row is found', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 0,
				oid: 0,
				fields: [],
				rows: [],
			}));

		await expect(connection.getRow(''))
			.rejects.toEqual(new OneRowExpectedError(0));
	});

	it('throws an exception when too many rows are found', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'query')
			.mockImplementation(() => Promise.resolve({
				command: 'SELECT',
				rowCount: 2,
				oid: 0,
				fields: [],
				rows: [
					{},
					{},
				],
			}));

		await expect(connection.getRow(''))
			.rejects.toEqual(new OneRowExpectedError(2));
	});
});
