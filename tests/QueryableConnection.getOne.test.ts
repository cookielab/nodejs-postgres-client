import {Row, SQL} from '../src';
import Client from '../src/Client';
import OneRowExpectedError from '../src/errors/OneRowExpectedError';

class CustomNotFoundError extends Error {
	private readonly id: unknown;
	public constructor(id: unknown) {
		super('Not found.');
		this.id = id;
	}
}

class UnexpectedError extends Error {
}

describe('getOne', () => {
	it('returns a row when found', async () => {
		const row: Row = {};
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRow')
			.mockImplementation(() => Promise.resolve(row));

		const result = await connection.getOne(SQL`SELECT ${42}`, OneRowExpectedError);

		expect(result).toBe(row);
	});

	it('throws a custom error when a row is not found using parametrized query', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRow')
			.mockImplementation(() => Promise.reject(new OneRowExpectedError(0)));

		const id = 42;
		await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
			.rejects.toEqual(new CustomNotFoundError(id));
	});

	it('throws a custom error when a row is not found using plain text query', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRow')
			.mockImplementation(() => Promise.reject(new OneRowExpectedError(0)));

		await expect(connection.getOne({text: 'SELECT 42'}, CustomNotFoundError))
			.rejects.toEqual(new CustomNotFoundError(0));
	});

	it('rethrows an unexpected error', async () => {
		const connection = new Client(jest.fn() as any); // eslint-disable-line @typescript-eslint/no-explicit-any
		jest.spyOn(connection, 'getRow')
			.mockImplementation(() => Promise.reject(new UnexpectedError()));

		const id = 42;
		await expect(connection.getOne(SQL`SELECT ${id}`, CustomNotFoundError))
			.rejects.toEqual(new UnexpectedError());
	});
});
