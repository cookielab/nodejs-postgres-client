import {SQL} from 'pg-async';
import {WritableStreamAsyncWriter} from '@cookielab.io/stream-async-wrappers';
import {createPool} from '../bootstrap';
import {sleep} from '../utils';
import BatchDeleteCollector from '../../src/BatchDeleteCollector';
import Client from '../../src/Client';
import DatabaseDeleteStream from '../../src/streams/DatabaseDeleteStream';
import valueListTransformer from '../../src/transformers/valueListTransformer';

const TABLE_NAME = 'test_database_delete_stream';

SQL.registerTransform('values', valueListTransformer);

describe('DatabaseDeleteStream', () => {
	const batchSize = 2;

	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	let spyOnQuery: jest.SpyInstance = jest.fn();
	beforeEach(async () => {
		await client.query(SQL`CREATE TABLE IF NOT EXISTS $id${TABLE_NAME} (id BIGINT PRIMARY KEY, name TEXT NOT NULL)`);
		await client.query(SQL`TRUNCATE $id${TABLE_NAME}`);
		await client.query(SQL`
			INSERT INTO $id${TABLE_NAME} ("id", "name") VALUES
			(1, 'Lorem Ipsum 1'),
			(2, 'Lorem Ipsum 2'),
			(3, 'Lorem Ipsum 3')
		`);
		spyOnQuery = jest.spyOn(client, 'query');
	});
	afterEach(async () => {
		spyOnQuery.mockRestore();
		await client.query(SQL`DROP TABLE IF EXISTS $id${TABLE_NAME}`);
	});

	it('flushes rows on batch size write and on the end', async () => {
		const batchDeleteCollector = new BatchDeleteCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const deleteStream = new DatabaseDeleteStream(batchDeleteCollector);

		const stream = new WritableStreamAsyncWriter(deleteStream);
		for (let i = 0; i < 7; i++) {
			await stream.write(i);
		}
		await sleep(50);
		expect(spyOnQuery).toHaveBeenCalledTimes(3);

		await stream.end();
		expect(spyOnQuery).toHaveBeenCalledTimes(4);
	});

	it('emits event "deleting_finished" with information about deleted rows', async () => {
		const batchDeleteCollector = new BatchDeleteCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const deleteStream = new DatabaseDeleteStream(batchDeleteCollector);

		const stream = new WritableStreamAsyncWriter(deleteStream);
		const eventPromise = new Promise((resolve: () => void) => {
			deleteStream.once('deleting_finished', (result: object) => {
				expect(result).toHaveProperty('deletedRowCount', 3);
				resolve();
			});
		});

		for (let i = 0; i < 7; i++) {
			await stream.write(i);
		}

		// Add one extra row to make sure it will resolve conflicts correctly
		await stream.write(3);

		await stream.end();
		await eventPromise;
	});

	it('triggers error on wrong delete on batch flush', async () => {
		const batchDeleteCollector = new BatchDeleteCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const deleteStream = new DatabaseDeleteStream(batchDeleteCollector);
		const promise = new Promise((resolve: () => void, reject: (error: Error) => void) => {
			deleteStream.on('error', reject);
			deleteStream.once('finish', () => {
				deleteStream.removeListener('error', reject);
				resolve();
			});
		});

		deleteStream.write(1);
		deleteStream.write({});

		await sleep(50);

		deleteStream.write(2);

		await expect(promise).rejects.toThrow();

		deleteStream.end();
	});

	it('triggers error on wrong delete at the end', async () => {
		const batchDeleteCollector = new BatchDeleteCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const insertStream = new DatabaseDeleteStream(batchDeleteCollector);
		const promise = new Promise((resolve: () => void, reject: (error: Error) => void) => {
			insertStream.once('error', reject);
			insertStream.once('finish', () => {
				insertStream.removeListener('error', reject);
				resolve();
			});
		});

		insertStream.write(1);
		insertStream.write(2);
		insertStream.write({});
		insertStream.end();

		await expect(promise).rejects.toThrow();
	});
});
