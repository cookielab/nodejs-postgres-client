import {Client} from 'pg';
import Transaction from '../src/Transaction';

describe('transaction', () => {
	it('executes a transaction callback upon perform', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		const transactionCallback = jest.fn();

		const transaction = new Transaction(client, transactionCallback);
		await transaction.perform();

		expect(transactionCallback).toHaveBeenCalledTimes(1);
		expect(transactionCallback).toHaveBeenCalledWith(transaction);
	});

	it('executes a nested transaction callback upon perform', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn();

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await transaction.perform();

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
		expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, nestedTransactionCallback, {
			savepointCounter: 1,
		}));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
	});

	it('executes a nested transaction in sequence using iteration and Promise.all', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn();

		const iterations = new Array(3).fill(null);

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await Promise.all(iterations.map(async () => {
				await connection.transaction(nestedTransactionCallback);
			}));
		});
		await transaction.perform();

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(3);
		expect(nestedTransactionCallback).toHaveBeenNthCalledWith(1, new Transaction(client, nestedTransactionCallback, {
			savepointCounter: 1,
		}));
		expect(nestedTransactionCallback).toHaveBeenNthCalledWith(2, new Transaction(client, nestedTransactionCallback, {
			savepointCounter: 2,
		}));
		expect(nestedTransactionCallback).toHaveBeenNthCalledWith(3, new Transaction(client, nestedTransactionCallback, {
			savepointCounter: 3,
		}));

		expect(client.query).toHaveBeenCalledTimes(6);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(3, 'SAVEPOINT savepoint2', undefined);
		expect(client.query).toHaveBeenNthCalledWith(4, 'RELEASE SAVEPOINT savepoint2', undefined);
		expect(client.query).toHaveBeenNthCalledWith(5, 'SAVEPOINT savepoint3', undefined);
		expect(client.query).toHaveBeenNthCalledWith(6, 'RELEASE SAVEPOINT savepoint3', undefined);
	});

	it('rollbacks a failing nested transaction callback upon perform', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn(() => {
			throw new Error('Failing transaction');
		});

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await expect(transaction.perform())
			.rejects
			.toEqual(new Error('Failing transaction'));

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
		expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, nestedTransactionCallback, {
			savepointCounter: 1,
		}));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
	});

	it('succeeds check for unfinished insert streams from nested transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
			const stream = transaction.insertStream('not_existing_table');
			stream.emit('finish');
		});

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await transaction.perform();

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
	});

	it('fails check for unfinished insert streams from nested transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
			transaction.insertStream('not_existing_table');
		});

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await expect(transaction.perform())
			.rejects
			.toEqual(new Error('Cannot commit transaction (or release savepoint) because there is 1 unfinished insert streams.'));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
	});

	it('succeeds check for unfinished delete streams from nested transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
			const stream = transaction.deleteStream('not_existing_table');
			stream.emit('finish');
		});

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await transaction.perform();

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
	});

	it('fails check for unfinished delete streams from nested transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
			transaction.deleteStream('not_existing_table');
		});

		const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		});
		await expect(transaction.perform())
			.rejects
			.toEqual(new Error('Cannot commit transaction (or release savepoint) because there is 1 unfinished delete streams.'));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
	});
});
