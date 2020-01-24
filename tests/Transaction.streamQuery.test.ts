import {Connection} from '../src';
import {PoolClient} from 'pg';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';
import Transaction from '../src/Transaction';

const createDatabaseClientMock = (): jest.Mocked<PoolClient> => {
	const databaseClient: jest.Mocked<PoolClient> = new (jest.fn())();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	databaseClient.query = jest.fn((stream: DatabaseReadStream) => stream) as any;

	return databaseClient;
};

describe('Transaction.streamQuery', () => {
	it('runs query stream exclusively in the transaction', async () => {
		const databaseClient = createDatabaseClientMock();

		await Transaction.createAndRun(databaseClient, async (connection: Connection) => {
			expect(connection).toBeInstanceOf(Transaction);
			const stream = await connection.streamQuery('');
			expect(stream).toBeInstanceOf(DatabaseReadStream);
			const streamEndPromise = new Promise((resolve: () => void) => {
				stream.once('close', resolve);
			});
			stream.destroy();
			await streamEndPromise;
		});

		expect(databaseClient.query).toHaveBeenCalledTimes(1);
	});

	it('releases the client with error for an error during the function call', async () => {
		const databaseClient = createDatabaseClientMock();
		const querySpy = jest.spyOn(databaseClient, 'query')
			.mockImplementationOnce(() => {
				throw new Error('TEST');
			});

		await Transaction.createAndRun(databaseClient, async (connection: Connection) => {
			expect(connection).toBeInstanceOf(Transaction);
			await expect(connection.streamQuery(''))
				.rejects.toEqual(new Error('TEST'));
		});

		expect(databaseClient.query).toHaveBeenCalledTimes(1);

		querySpy.mockRestore();
	});

	it('releases the client with error for an error event on the stream', async () => {
		const databaseClient = createDatabaseClientMock();

		await Transaction.createAndRun(databaseClient, async (connection: Connection) => {
			expect(connection).toBeInstanceOf(Transaction);
			const stream = await connection.streamQuery('');
			expect(stream).toBeInstanceOf(DatabaseReadStream);

			await new Promise((resolve: () => void) => {
				setTimeout(() => {
					stream.emit('error', new Error('TEST2'));
					resolve();
				}, 50);
			});
		});

		expect(databaseClient.query).toHaveBeenCalledTimes(1);
	});
});
