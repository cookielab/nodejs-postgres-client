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

		await Transaction.createAndRun(databaseClient, async (transaction: Connection) => {
			const stream = await transaction.streamQuery('');
			expect(stream).toBeInstanceOf(DatabaseReadStream);
			stream.destroy();
		});

		expect(databaseClient.query).toHaveBeenCalledTimes(1);
	});

	it('releases the client with error for an error during the function call', async () => {
		const databaseClient = createDatabaseClientMock();
		const querySpy = jest.spyOn(databaseClient, 'query')
			.mockImplementationOnce(() => {
				throw new Error('TEST');
			});

		// TODO - the transaction should fail
		await Transaction.createAndRun(databaseClient, async (transaction: Connection) => {
			await expect(transaction.streamQuery(''))
				.rejects.toEqual(new Error('TEST'));
		});

		expect(databaseClient.query).toHaveBeenCalledTimes(1);

		querySpy.mockRestore();
	});

	it('releases the client with error for an error event on the stream', async () => {
		const databaseClient = createDatabaseClientMock();

		// TODO - the transaction should fail
		await Transaction.createAndRun(databaseClient, async (transaction: Connection) => {
			const stream = await transaction.streamQuery('');
			expect(stream).toBeInstanceOf(DatabaseReadStream);

			setTimeout(() => {
				stream.emit('error', new Error('TEST2'));
			}, 50);
		});

		// Performs no queries
		expect(databaseClient.query).toHaveBeenCalledTimes(1);
	});
});
