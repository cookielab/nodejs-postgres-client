import {SQL} from 'pg-async';
import {WritableStreamAsyncWriter} from '@cookielab.io/stream-async-wrappers';
import {createPool} from '../bootstrap';
import {sleep} from '../utils';
import BatchInsertCollector from '../../src/BatchInsertCollector';
import Client from '../../src/Client';
import DatabaseInsertStream from '../../src/streams/DatabaseInsertStream';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';
import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import multiInsertTransformer from '../../src/transformers/multiInsertTransformer';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

const TABLE_NAME = 'test_database_insert_stream';

SQL.registerTransform('columnName', columnNameTransformer);
SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

describe('DatabaseInsertStream', () => {
	const batchSize = 2;

	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	let spyOnQuery: jest.SpyInstance = jest.fn();
	beforeEach(async () => {
		await client.query(SQL`CREATE TABLE IF NOT EXISTS $id${TABLE_NAME} (id BIGINT PRIMARY KEY, name TEXT NOT NULL)`);
		await client.query(SQL`TRUNCATE $id${TABLE_NAME}`);
		spyOnQuery = jest.spyOn(client, 'query');
	});
	afterEach(async () => {
		spyOnQuery.mockRestore();
		await client.query(SQL`DROP TABLE IF EXISTS $id${TABLE_NAME}`);
	});

	it('flushes rows on batch size write and on the end', async () => {
		const batchInsertCollector = new BatchInsertCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const insertStream = new DatabaseInsertStream(batchInsertCollector);

		const stream = new WritableStreamAsyncWriter(insertStream);
		for (let i = 0; i < 7; i++) {
			await stream.write({id: i, name: 'Lorem Ipsum'});
		}
		await sleep(50);
		expect(spyOnQuery).toHaveBeenCalledTimes(3);

		await stream.end();
		expect(spyOnQuery).toHaveBeenCalledTimes(4);
	});

	it('emits event "inserting_finished" with information about inserted rows', async () => {
		const batchInsertCollector = new BatchInsertCollector(client, TABLE_NAME, {
			batchSize: batchSize,
			querySuffix: 'ON CONFLICT DO NOTHING',
		});
		const insertStream = new DatabaseInsertStream(batchInsertCollector);

		const stream = new WritableStreamAsyncWriter(insertStream);
		const eventPromise = new Promise((resolve: () => void) => {
			insertStream.once('inserting_finished', (result: object) => {
				expect(result).toHaveProperty('insertedRowCount', 7);
				resolve();
			});
		});

		for (let i = 0; i < 7; i++) {
			await stream.write({id: i, name: 'Lorem Ipsum'});
		}

		// Add one extra row to make sure it will resolve conflicts correctly
		await stream.write({id: 3, name: 'Lorem Ipsum'});

		await stream.end();
		await eventPromise;
	});

	it('triggers error on wrong insert on batch flush', async () => {
		const batchInsertCollector = new BatchInsertCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const insertStream = new DatabaseInsertStream(batchInsertCollector);
		const promise = new Promise((resolve: () => void, reject: (error: Error) => void) => {
			insertStream.once('error', reject);
			insertStream.once('finish', () => {
				insertStream.removeListener('error', reject);
				resolve();
			});
		});

		insertStream.write({id: 1, name: 'Lorem Ipsum'});
		insertStream.write({id: 1, name: 'Lorem Ipsum'});
		insertStream.end();

		await expect(promise).rejects.toThrow();
	});

	it('triggers error on wrong insert at the end', async () => {
		const batchInsertCollector = new BatchInsertCollector(client, TABLE_NAME, {
			batchSize: batchSize,
		});
		const insertStream = new DatabaseInsertStream(batchInsertCollector);
		const promise = new Promise((resolve: () => void, reject: (error: Error) => void) => {
			insertStream.once('error', reject);
			insertStream.once('finish', () => {
				insertStream.removeListener('error', reject);
				resolve();
			});
		});

		insertStream.write({id: 1, name: 'Lorem Ipsum'});
		insertStream.write({id: 2, name: 'Lorem Ipsum'});
		insertStream.write({id: 1, name: 'Lorem Ipsum'});
		insertStream.end();

		await expect(promise).rejects.toThrow();
	});
});
