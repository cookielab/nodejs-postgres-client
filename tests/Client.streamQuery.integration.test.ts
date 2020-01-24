import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';
import {SQL} from 'pg-async';
import {createPool} from './bootstrap';
import Client from '../src/Client';

describe('Client.streamQuery', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('performs a successful query stream by string query', async () => {
		const stream = await client.streamQuery('SELECT 42 AS theAnswer');

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

	it('performs a successful query stream by query config', async () => {
		const stream = await client.streamQuery({text: 'SELECT 42 AS theAnswer'});

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

	it('performs a successful query stream by query string and values', async () => {
		const stream = await client.streamQuery('SELECT $1 AS theAnswer', [42]);

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

	it('performs a successful query stream by sql tag', async () => {
		const stream = await client.streamQuery(SQL`SELECT ${42} AS theAnswer`);

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

	it('performs a failing query stream', async () => {
		const stream = await client.streamQuery('SELECT 42 AS theAnswer FROM unknown_table');

		const reader = new ReadableStreamAsyncReader(stream);
		await expect(reader.read())
			.rejects
			.toEqual(new Error('relation "unknown_table" does not exist'));

		stream.destroy();
	});
});
