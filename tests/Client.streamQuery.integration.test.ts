import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';
import {createPool} from './bootstrap';
import Client from '../src/Client';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';

describe('Client.streamQuery', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('performs a successful query stream by string query', async () => {
		const stream = await client.streamQuery('SELECT 42 AS theAnswer');

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

	it('performs a successful query stream by query config', async () => {
		const stream = await client.streamQuery({text: 'SELECT 42 AS theAnswer'});

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

	it('performs a failing query stream', async () => {
		const stream = await client.streamQuery('SELECT 42 AS theAnswer FROM unknown_table');

		expect(stream).toBeInstanceOf(DatabaseReadStream);
		const reader = new ReadableStreamAsyncReader(stream);
		await expect(reader.read())
			.rejects
			.toEqual(new Error('relation "unknown_table" does not exist'));
	});
});
