import {Connection} from '../src';
import {Pool, PoolClient} from 'pg';
import Client from '../src/Client';

const createDatabaseClientMock = (): jest.Mocked<PoolClient> => {
	const databaseClient: jest.Mocked<PoolClient> = new (jest.fn())();
	databaseClient.release = jest.fn();
	databaseClient.query = jest.fn();

	return databaseClient;
};

const createPoolMock = (databaseClient: PoolClient): jest.Mocked<Pool> => {
	const pool: jest.Mocked<Pool> = new (jest.fn())();
	pool.connect = jest.fn();
	jest.spyOn(pool, 'connect')
		.mockImplementation(async () => await Promise.resolve(databaseClient)); // eslint-disable-line @typescript-eslint/no-misused-promises

	return pool;
};

describe('Client.transaction', () => {
	it('begins and commits a successful transaction', async () => {
		const databaseClient = createDatabaseClientMock();
		const pool = createPoolMock(databaseClient);
		const transactionCallback = async (connection: Connection): Promise<number> => {
			await connection.query('SELECT 42');

			return 42;
		};

		const client = new Client(pool);
		const result = await client.transaction(transactionCallback);
		expect(result).toBe(42);

		// Obtains a client from the pool
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Performs transaction
		expect(databaseClient.query).toHaveBeenCalledTimes(3);
		expect(databaseClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
		expect(databaseClient.query).toHaveBeenNthCalledWith(2, 'SELECT 42', undefined);
		expect(databaseClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');

		// Releases client
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release without parameters for successful transaction
		expect(databaseClient.release).toHaveBeenCalledWith();
	});

	it('begins and rollbacks an erroneous transaction', async () => {
		const databaseClient = createDatabaseClientMock();
		const pool = createPoolMock(databaseClient);
		const transactionCallback = async (connection: Connection): Promise<void> => {
			await connection.query('SELECT 42');
			await Promise.reject(new Error('You shall not pass!'));
			await connection.query('SELECT 43');
		};

		const client = new Client(pool);
		await expect(client.transaction(transactionCallback))
			.rejects.toEqual(new Error('You shall not pass!'));

		// Obtains a client from the pool
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Performs transaction
		expect(databaseClient.query).toHaveBeenCalledTimes(3);
		expect(databaseClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
		expect(databaseClient.query).toHaveBeenNthCalledWith(2, 'SELECT 42', undefined);
		expect(databaseClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');

		// Releases client
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release with thrown error for failed transaction
		expect(databaseClient.release).toHaveBeenCalledWith(new Error('You shall not pass!'));
	});

	it('performs a nested transaction on the same connection as the parent-transaction', async () => {
		const databaseClient = createDatabaseClientMock();
		const pool = createPoolMock(databaseClient);
		const nestedTransactionCallback = jest.fn((connection: Connection): void => {
			// @ts-ignore The property is protected
			expect(connection.connection).toBe(databaseClient);
		});

		const client = new Client(pool);
		await client.transaction(async (connection: Connection): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);

		// Obtains a client from the pool only once
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Releases the client once only
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release without parameters for successful transaction
		expect(databaseClient.release).toHaveBeenCalledWith();
	});
});
