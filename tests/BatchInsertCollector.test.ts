import {AsyncQueryable} from '../src/Connection';
import {BatchInsertCollector} from '../src';
import {QueryConfig} from 'pg';
import {sleep} from './utils';

const createItem = (id: number): {readonly id: number} => ({id});

describe('BatchInsertCollector', () => {
	let insertedValues: Set<unknown> = new Set();
	const database: AsyncQueryable = {
		query: async (sql: QueryConfig) => {
			const beforeInserted = insertedValues.size;
			for (const value of (sql.values ?? [])) {
				insertedValues.add(value);
			}
			const rowCount: number = insertedValues.size - beforeInserted;

			return await Promise.resolve({
				rowCount: rowCount,
				command: '',
				oid: 0,
				fields: [],
				rows: new Array(rowCount).fill({}),
			});
		},
	};

	let spyOnDatabaseQuery: jest.SpyInstance | null = null;
	beforeEach(() => {
		spyOnDatabaseQuery = jest.spyOn(database, 'query');
	});
	afterEach(() => {
		insertedValues = new Set();
		spyOnDatabaseQuery?.mockRestore();
	});

	it('use default batch size if less or equal to 0', () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 0,
		});

		expect(collector.getBatchSize()).toBe(1000);
	});

	it('use default batch size if greater than MAX', () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 1001,
		});

		expect(collector.getBatchSize()).toBe(1000);
	});

	it('does not do anything on flush for no rows added', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});
		await collector.flush();

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);
	});

	it('returns void after adding a row', () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});

		const result = collector.add(createItem(1));

		expect(result).toBeUndefined();
	});

	it('calls a query every batch size addition or on flush', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});

		collector.add(createItem(1));
		collector.add(createItem(2));
		collector.add(createItem(3));
		collector.add(createItem(4));
		await sleep(50);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		collector.add(createItem(5));
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);
		await sleep(50);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		await collector.flush();
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(3);
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(1, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1),\n($2) ');
				expect(sql.values).toEqual([1, 2]);

				return true;
			},
		});
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(2, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1),\n($2) ');
				expect(sql.values).toEqual([3, 4]);

				return true;
			},
		});
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(3, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1) ');
				expect(sql.values).toEqual([5]);

				return true;
			},
		});
	});

	it('supports query suffix', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
			querySuffix: 'ON CONFLICT DO NOTHING',
		});

		collector.add(createItem(1));
		await collector.flush();

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);
		expect(spyOnDatabaseQuery).toBeCalledWith({
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1) ON CONFLICT DO NOTHING');
				expect(sql.values).toEqual([1]);

				return true;
			},
		});
	});

	it('calculates amount of inserted rows by query result not by added rows', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
			querySuffix: 'ON CONFLICT DO NOTHING',
		});

		collector.add(createItem(1));
		collector.add(createItem(2));
		collector.add(createItem(3));
		collector.add(createItem(4));
		collector.add(createItem(2)); // duplicate item
		await collector.flush();

		// Calling add method 5 times with a row but only 4 rows have been added because of duplicate key
		expect(collector.getInsertedRowCount()).toBe(4);
	});

	it('fails on the next .add call for failed auto-flush', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});

		spyOnDatabaseQuery?.mockImplementationOnce(async () => {
			await sleep(50);
			throw new Error('TEST');
		});

		collector.add(createItem(1));
		collector.add(createItem(1));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);

		await sleep(10);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		collector.add(createItem(2));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		await sleep(50);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		expect(() => collector.add(createItem(3))).toThrow(new Error('TEST'));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);
	});

	it('fails on the manual .flush call for failed auto-flush', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});

		spyOnDatabaseQuery?.mockImplementationOnce(async () => {
			await sleep(50);
			throw new Error('TEST');
		});

		collector.add(createItem(1));
		collector.add(createItem(1));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);

		await sleep(10);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		collector.add(createItem(2));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		await sleep(50);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		await expect(collector.flush()).rejects.toEqual(new Error('TEST'));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);
	});

	it('fails on the manual .flush call', async () => {
		const collector = new BatchInsertCollector(database, 'account', {
			batchSize: 2,
		});

		spyOnDatabaseQuery?.mockImplementationOnce(async () => await Promise.resolve({
			rowCount: 2,
			command: '',
			oid: 0,
			fields: [],
			rows: [],
		}))
			.mockImplementationOnce(async () => {
				await sleep(50);
				throw new Error('TEST');
			});

		collector.add(createItem(1));
		collector.add(createItem(1));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);

		await sleep(10);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		collector.add(createItem(2));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		await sleep(50);

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		await expect(collector.flush()).rejects.toEqual(new Error('TEST'));

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);
	});
});
