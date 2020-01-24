import Client from '../src/Client';
import QueryableConnection from '../src/QueryableConnection';

describe('query', () => {
	let connection: QueryableConnection | null = null;
	let originalQuerySpy: jest.SpyInstance | null = null;
	beforeEach(() => {
		const pool = jest.fn() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
		pool.query = jest.fn(() => Promise.resolve());
		connection = new Client(pool);

		originalQuerySpy = jest.spyOn(pool, 'query');
	});
	afterEach(() => {
		if (originalQuerySpy != null) {
			originalQuerySpy.mockRestore();
		}
		originalQuerySpy = null;
		connection = null;
	});

	it('calls query on original pg connection (simple)', async () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await connection!.query('SELECT 42 AS answer');

		expect(originalQuerySpy).toHaveBeenCalledTimes(1);
		expect(originalQuerySpy).toHaveBeenCalledWith('SELECT 42 AS answer', undefined);
	});

	it('calls query on original pg connection (with values)', async () => {
		const inputValues = [42];
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await connection!.query('SELECT ? AS answer', inputValues);

		expect(originalQuerySpy).toHaveBeenCalledTimes(1);
		expect(originalQuerySpy).toHaveBeenCalledWith('SELECT ? AS answer', {
			asymmetricMatch: (values?: readonly unknown[]): boolean => {
				expect(values).not.toBe(inputValues);
				expect(values).toStrictEqual(inputValues);

				return true;
			},
		});
	});
});
