import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';
import {createPool} from './bootstrap';
import Client from '../src/Client';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';
import Transaction from '../src/Transaction';

describe('transaction database integration', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('performs a successful query stream by string query', async () => {
		await client.transaction(async (transaction: Transaction<void>): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

			expect(stream).toBeInstanceOf(DatabaseReadStream);
			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe(42);
				}
			} while (row != null);
		});
	});

	it('performs a successful query stream by query config', async () => {
		await client.transaction(async (transaction: Transaction<void>): Promise<void> => {
			const stream = await transaction.streamQuery({text: 'SELECT 42 AS theAnswer'});

			expect(stream).toBeInstanceOf(DatabaseReadStream);
			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe(42);
				}
			} while (row != null);
		});
	});

	it('performs a failing query stream', async () => {
		await client.transaction(async (transaction: Transaction<void>): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer FROM unknown_table');

			expect(stream).toBeInstanceOf(DatabaseReadStream);
			const reader = new ReadableStreamAsyncReader(stream);
			await expect(reader.read())
				.rejects
				.toEqual(new Error('relation "unknown_table" does not exist'));
		});
	});

	it('fails trying to run another query in transaction with open stream', async () => {
		await client.transaction(async (transaction: Transaction<void>): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

			expect(stream).toBeInstanceOf(DatabaseReadStream);
			await expect(transaction.query('SELECT 41 AS theAnswer'))
				.rejects
				.toEqual(new Error('Cannot run another query while one is still in progress. Possibly opened cursor.'));

			const destroyPromise = new Promise((resolve: () => void): void => {
				stream.once('close', resolve);
			});

			stream.destroy();

			await destroyPromise;

			const result = await transaction.query('SELECT 41 AS theAnswer');
			expect(result.rowCount).toBe(1);

			const row = result.rows[0];
			expect(row.theanswer).toBe(41);
		});
	});

	it('fails trying to run another query stream in transaction with open stream', async () => {
		await client.transaction(async (transaction: Transaction<void>): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

			expect(stream).toBeInstanceOf(DatabaseReadStream);
			await expect(transaction.streamQuery('SELECT 41 AS theAnswer'))
				.rejects
				.toEqual(new Error('Cannot run another query while one is still in progress. Possibly opened cursor.'));

			const destroyPromise = new Promise((resolve: () => void): void => {
				stream.once('close', resolve);
			});

			stream.destroy();

			await destroyPromise;

			const stream2 = await transaction.streamQuery('SELECT 42 AS theAnswer');

			expect(stream2).toBeInstanceOf(DatabaseReadStream);

			const destroy2Promise = new Promise((resolve: () => void): void => {
				stream2.once('close', resolve);
			});

			stream2.destroy();

			await destroy2Promise;
		});
	});
});
