import {Client, QueryConfig} from 'pg';
import {DatabaseReadStream} from '../src';
import {sleep} from './utils';
import Transaction from '../src/Transaction';

describe('transaction', () => {
	it('executes a nested transaction callback passing another transaction', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn();
		const transactionCallback = async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		};

		await Transaction.createAndRun(client, transactionCallback);

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
		// @ts-ignore allow constructor usage in tests
		expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, {
			savepointCounter: 2,
		}));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
	});

	it('rollbacks for a failing nested transaction callback', async () => {
		const client: jest.Mocked<Client> = new (jest.fn())();
		client.query = jest.fn();

		const nestedTransactionCallback = jest.fn(() => {
			throw new Error('Failing transaction');
		});
		const transactionCallback = async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
		};

		await expect(Transaction.createAndRun(client, transactionCallback))
			.rejects
			.toEqual(new Error('Failing transaction'));

		expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
		// @ts-ignore allow constructor usage in tests
		expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, {
			savepointCounter: 2,
		}));

		expect(client.query).toHaveBeenCalledTimes(2);
		expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
		expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
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

		const nestedTransactionCallback = jest.fn(async (): Promise<void> => {
			await sleep(50);
		});
		const transactionCallback = async (connection: Transaction<void>): Promise<void> => {
			await connection.transaction(nestedTransactionCallback);
			await connection.query('SELECT 42 as theAnswer');
			const queryStream = await connection.streamQuery('SELECT 42 as theAnswer');
			setTimeout(() => queryStream.destroy(), 50);
			const insertStream = await connection.insertStream('test_insert_stream_table');
			setTimeout(() => insertStream.destroy(), 50);
			const deleteStream = await connection.deleteStream('test_delete_stream_table');
			setTimeout(() => deleteStream.destroy(), 50);
			await connection.transaction(nestedTransactionCallback);
			await connection.query('SELECT 42 as theAnswer');
			const queryStream2 = await connection.streamQuery('SELECT 42 as theAnswer');
			setTimeout(() => queryStream2.destroy(), 50);
			const insertStream2 = await connection.insertStream('test_insert_stream_table');
			setTimeout(() => insertStream2.destroy(), 50);
			const deleteStream2 = await connection.deleteStream('test_delete_stream_table');
			setTimeout(() => deleteStream2.destroy(), 50);
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
