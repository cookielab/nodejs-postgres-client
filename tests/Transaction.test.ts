import {Client, QueryConfig} from 'pg';
import {Connection, DatabaseReadStream} from '../src';
import {sleep} from './utils';
import QueryError from '../src/errors/QueryError';
import Transaction from '../src/Transaction';

describe('Transaction', () => {
	it('rethrows error from connection without debug mode', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		// @ts-ignore
		client.query = jest.fn(async () => await Promise.reject(new Error('TEST')));

		const transactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await expect(connection.query('TEST')).rejects.toEqual(new Error('TEST'));
		});

		await Transaction.createAndRun(client, transactionCallback);

		expect(transactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(1);
		expect(client.query).toHaveBeenNthCalledWith(1, 'TEST', undefined);
	});

	it('rethrows error from connection with debug mode', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		// @ts-ignore
		client.query = jest.fn(async () => await Promise.reject(new Error('TEST')));

		const transactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			const queryPromise = connection.query('TEST');
			await expect(queryPromise).rejects.toBeInstanceOf(QueryError);
			await expect(queryPromise).rejects.toHaveProperty('causedBy', new Error('TEST'));
		});

		await Transaction.createAndRun(client, transactionCallback, {
			debug: true,
		});

		expect(transactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(1);
		expect(client.query).toHaveBeenNthCalledWith(1, 'TEST', undefined);
	});

	it('executes the given callback', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const transactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.query('TEST');
		});

		await Transaction.createAndRun(client, transactionCallback);

		expect(transactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(1);
		expect(client.query).toHaveBeenNthCalledWith(1, 'TEST', undefined);
	});

	it('executes a nested transaction callback passing another transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.query('TEST');
		});
		const transactionCallback = async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.transaction(nestedTransactionCallback);
		};

		await Transaction.createAndRun(client, transactionCallback);

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(3);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'TEST', undefined);
		expect(client.query).toHaveBeenNthCalledWith(3, 'RELEASE SAVEPOINT savepoint1', undefined);
	});

	it('throws error when finishing callback without awaiting stream ends', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const transactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.query('TEST');
			await connection.insertStream('TEST');
			// here should be the stream end awaited
		});

		await expect(Transaction.createAndRun(client, transactionCallback))
			.rejects
			.toEqual(new Error('The transaction callback resolved but not all queries, nested transactions or streams are finished. Check your transaction callback and make sure that all of it is done before resolving the callback.'));

		expect(transactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(1);
		expect(client.query).toHaveBeenNthCalledWith(1, 'TEST', undefined);
	});

	it('rollbacks for a failing nested transaction callback', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.query('TEST1');
			await Promise.reject(new Error('Failing transaction'));
			await connection.query('TEST2');
		});
		const transactionCallback = async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await connection.transaction(nestedTransactionCallback);
		};

		await expect(Transaction.createAndRun(client, transactionCallback))
			.rejects
			.toEqual(new Error('Failing transaction'));

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);

		expect(client.query).toHaveBeenCalledTimes(3);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'TEST1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
	});

	it('awaits all (previous) pending locks before next "query" or committing the transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		// @ts-ignore
		client.query = jest.fn((query: string | DatabaseReadStream) => {
			if (query instanceof DatabaseReadStream) {
				return query;
			}

			// eslint-disable-next-line @typescript-eslint/return-await
			return Promise.resolve();
		});

		const nestedTransactionCallback = jest.fn(async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);
			await sleep(50);
		});
		const transactionCallback = async (connection: Connection): Promise<void> => {
			expect(connection).toBeInstanceOf(Transaction);

			await connection.transaction(nestedTransactionCallback);
			await connection.query('SELECT 42 as theAnswer');
			const queryStream = await connection.streamQuery('SELECT 42 as theAnswer');
			const queryStreamEndPromise = new Promise((resolve: () => void) => {
				queryStream.once('close', resolve);
			});
			setTimeout(() => queryStream.destroy(), 100);
			const insertStream = await connection.insertStream('test_insert_stream_table');
			const insertStreamEndPromise = new Promise((resolve: () => void) => {
				insertStream.once('close', resolve);
			});
			setTimeout(() => insertStream.destroy(), 90);
			const deleteStream = await connection.deleteStream('test_delete_stream_table');
			const deleteStreamEndPromise = new Promise((resolve: () => void) => {
				deleteStream.once('close', resolve);
			});
			setTimeout(() => deleteStream.destroy(), 80);
			await connection.transaction(nestedTransactionCallback);
			await connection.query('SELECT 42 as theAnswer');
			const queryStream2 = await connection.streamQuery('SELECT 42 as theAnswer');
			const queryStream2EndPromise = new Promise((resolve: () => void) => {
				queryStream2.once('close', resolve);
			});
			setTimeout(() => queryStream2.destroy(), 70);
			const insertStream2 = await connection.insertStream('test_insert_stream_table');
			const insertStream2EndPromise = new Promise((resolve: () => void) => {
				insertStream2.once('close', resolve);
			});
			setTimeout(() => insertStream2.destroy(), 60);
			const deleteStream2 = await connection.deleteStream('test_delete_stream_table');
			const deleteStream2EndPromise = new Promise((resolve: () => void) => {
				deleteStream2.once('close', resolve);
			});
			setTimeout(() => deleteStream2.destroy(), 50);
			await Promise.all([
				queryStreamEndPromise,
				insertStreamEndPromise,
				deleteStreamEndPromise,
				queryStream2EndPromise,
				insertStream2EndPromise,
				deleteStream2EndPromise,
			]);
		};

		await Transaction.createAndRun(client, transactionCallback);

		expect(client.query).toHaveBeenCalledTimes(8);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(3, 'SELECT 42 as theAnswer', undefined);
		expect(client.query).toHaveBeenNthCalledWith(4, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql).toBeInstanceOf(DatabaseReadStream);
				// @ts-ignore
				expect(sql.cursor.text).toBe('SELECT 42 as theAnswer');
				// @ts-ignore
				expect(sql.cursor.values).toBeNull();

				return true;
			},
		});
		expect(client.query).toHaveBeenNthCalledWith(5, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(6, 'RELEASE SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(7, 'SELECT 42 as theAnswer', undefined);
		expect(client.query).toHaveBeenNthCalledWith(8, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql).toBeInstanceOf(DatabaseReadStream);
				// @ts-ignore
				expect(sql.cursor.text).toBe('SELECT 42 as theAnswer');
				// @ts-ignore
				expect(sql.cursor.values).toBeNull();

				return true;
			},
		});
	});
});
