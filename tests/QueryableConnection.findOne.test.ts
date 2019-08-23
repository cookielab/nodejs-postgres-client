import Client from '../src/Client';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

describe('findOne', () => {
	it('returns a row when found', async () => {
		const row = {};
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRows').mockImplementation(() => Promise.resolve([
			row,
		]));

		const result = await connection.findOne('SELECT 42 AS answer');
		expect(result).toBe(row);
	});

	it('returns null when a row is not found', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRows').mockImplementation(() => Promise.resolve([]));

		const result = await connection.findOne('SELECT 42');
		expect(result).toBe(null);
	});

	it('throws an error if too many rows are found', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRows').mockImplementation(() => Promise.resolve([
			{},
			{},
		]));

		await expect(connection.findOne('SELECT 42')).rejects.toBeInstanceOf(OneRowExpectedError);
	});
});
