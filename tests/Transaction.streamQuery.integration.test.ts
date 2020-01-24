import {Connection, SQL} from '../src';
import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';
import {createPool} from './bootstrap';
import Client from '../src/Client';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';

describe('Transaction.streamQuery', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('performs a successful query stream by string query', async () => {
		await client.transaction(async (transaction: Connection): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe(42);
				}
			} while (row != null);

			stream.destroy();
		});
	});

	it('performs a successful query stream by query config', async () => {
		await client.transaction(async (transaction: Connection): Promise<void> => {
			const stream = await transaction.streamQuery({text: 'SELECT 42 AS theAnswer'});

			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe(42);
				}
			} while (row != null);

			stream.destroy();
		});
	});

	it('performs a successful query stream by query string and values', async () => {
		await client.transaction(async (transaction: Connection): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT $1 AS theAnswer', [42]);

			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe('42');
				}
			} while (row != null);

			stream.destroy();
		});
	});

	it('performs a successful query stream by sql tag', async () => {
		await client.transaction(async (transaction: Connection): Promise<void> => {
			const stream = await transaction.streamQuery(SQL`SELECT ${42} AS theAnswer`);

			const reader = new ReadableStreamAsyncReader(stream);
			let row = null;
			do {
				row = await reader.read();
				if (row != null) {
					expect(row.theanswer).toBe('42');
				}
			} while (row != null);

			stream.destroy();
		});
	});

	it('performs a failing query stream', async () => {
		await client.transaction(async (transaction: Connection): Promise<void> => {
			const stream = await transaction.streamQuery('SELECT 42 AS theAnswer FROM unknown_table');

			const reader = new ReadableStreamAsyncReader(stream);
			await expect(reader.read())
				.rejects
				.toEqual(new Error('relation "unknown_table" does not exist'));

			stream.destroy();
		});
	});
});
