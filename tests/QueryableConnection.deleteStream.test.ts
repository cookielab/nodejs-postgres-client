import Client from '../src/Client';
import DatabaseDeleteStream from '../src/streams/DatabaseDeleteStream';
import QueryableConnection from '../src/QueryableConnection';

describe('QueryableConnection.deleteStream', () => {
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

	it('returns stream without calling a query', async () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const stream = await connection!.deleteStream('table');

		expect(stream).toBeInstanceOf(DatabaseDeleteStream);
		expect(originalQuerySpy).toHaveBeenCalledTimes(0);
	});
});
