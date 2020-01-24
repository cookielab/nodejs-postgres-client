import {Pool, PoolClient} from 'pg';
import {sleep} from './utils';
import Client from '../src/Client';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';

const createDatabaseClientMock = (): jest.Mocked<PoolClient> => {
	const databaseClient: jest.Mocked<PoolClient> = new (jest.fn())();
	databaseClient.release = jest.fn();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	databaseClient.query = jest.fn((stream: DatabaseReadStream) => stream) as any;

	return databaseClient;
};

const createPoolMock = (databaseClient: PoolClient): jest.Mocked<Pool> => {
	const pool: jest.Mocked<Pool> = new (jest.fn())();
	pool.connect = jest.fn();
	jest.spyOn(pool, 'connect')
		.mockImplementation(async () => await Promise.resolve(databaseClient)); // eslint-disable-line @typescript-eslint/no-misused-promises

	return pool;
};

describe('Client.streamQuery', () => {
	it('obtains a client for the stream from the pool and releases it on stream end', async () => {
		const databaseClient = createDatabaseClientMock();
		const pool = createPoolMock(databaseClient);

		const client = new Client(pool);
		const stream = await client.streamQuery('');
		expect(stream).toBeInstanceOf(DatabaseReadStream);

		// Obtains a client from the pool
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Performs a query to register the stream to the client
		expect(databaseClient.query).toHaveBeenCalledTimes(1);

		// Client not release yet
		expect(databaseClient.release).toHaveBeenCalledTimes(0);

		stream.destroy();

		await sleep(50);

		// Releases client
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release without parameters for successful stream
		expect(databaseClient.release).toHaveBeenCalledWith(undefined);
	});

	it('releases the client with error for an error during the function call', async () => {
		const databaseClient = createDatabaseClientMock();
		const querySpy = jest.spyOn(databaseClient, 'query')
			.mockImplementationOnce(() => {
				throw new Error('TEST');
			});

		const pool = createPoolMock(databaseClient);

		const client = new Client(pool);

		await expect(client.streamQuery(''))
			.rejects.toEqual(new Error('TEST'));

		// Obtains a client from the pool
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Performs a query to register the stream to the client
		expect(databaseClient.query).toHaveBeenCalledTimes(1);

		// Releases client
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release without parameters for successful stream
		expect(databaseClient.release).toHaveBeenCalledWith(new Error('TEST'));

		querySpy.mockRestore();
	});

	it('releases the client with error for an error event on the stream', async () => {
		const databaseClient = createDatabaseClientMock();

		const pool = createPoolMock(databaseClient);

		const client = new Client(pool);
		const stream = await client.streamQuery('');
		expect(stream).toBeInstanceOf(DatabaseReadStream);

		// Obtains a client from the pool
		expect(pool.connect).toHaveBeenCalledTimes(1);

		// Performs a query to register the stream to the client
		expect(databaseClient.query).toHaveBeenCalledTimes(1);

		// Client not release yet
		expect(databaseClient.release).toHaveBeenCalledTimes(0);

		stream.emit('error', new Error('TEST2'));

		// Releases client
		expect(databaseClient.release).toHaveBeenCalledTimes(1);

		// release without parameters for successful stream
		expect(databaseClient.release).toHaveBeenCalledWith(new Error('TEST2'));
	});
});
