import {AsyncQueryable} from '../src/Connection';
import {BatchDeleteCollector} from '../src';
import {QueryConfig} from 'pg';
import {sleep} from './utils';

describe('BatchDeleteCollector', () => {
	let deletedValues: Set<unknown> = new Set();
	const database: AsyncQueryable = {
		query: async (sql: QueryConfig) => {
			const beforeDeleted = deletedValues.size;
			for (const value of (sql.values ?? [])) {
				deletedValues.add(value);
			}
			const rowCount: number = deletedValues.size - beforeDeleted;

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
		deletedValues = new Set();
		spyOnDatabaseQuery?.mockRestore();
	});

	it('use default batch size if less or equal to 0', () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 0,
		});

		expect(collector.getBatchSize()).toBe(1000);
	});

	it('use default batch size if greater than MAX', () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 1001,
		});

		expect(collector.getBatchSize()).toBe(1000);
	});

	it('does not do anything on flush for no keys added', async () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 2,
		});
		await collector.flush();

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);
	});

	it('returns void after adding a key', () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 2,
		});

		const result = collector.add(1);

		expect(result).toBeUndefined();
	});

	it('calls a query every batch size addition or on flush', async () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 2,
		});

		collector.add(1);
		collector.add(2);
		collector.add(3);
		collector.add(4);
		await sleep(50);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		collector.add(5);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);
		await sleep(50);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		await collector.flush();
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(3);
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(1, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('DELETE FROM "account" WHERE "id" IN ($1, $2)');
				expect(sql.values).toEqual([1, 2]);

				return true;
			},
		});
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(2, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('DELETE FROM "account" WHERE "id" IN ($1, $2)');
				expect(sql.values).toEqual([3, 4]);

				return true;
			},
		});
		expect(spyOnDatabaseQuery).toHaveBeenNthCalledWith(3, {
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('DELETE FROM "account" WHERE "id" IN ($1)');
				expect(sql.values).toEqual([5]);

				return true;
			},
		});
	});

	it('supports configurable key column name', async () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 2,
			keyName: 'foo',
		});

		collector.add(1);
		await collector.flush();

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);
		expect(spyOnDatabaseQuery).toBeCalledWith({
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('DELETE FROM "account" WHERE "foo" IN ($1)');
				expect(sql.values).toEqual([1]);

				return true;
			},
		});
	});

	it('calculates amount of deleted rows by query result not by added keys', async () => {
		const collector = new BatchDeleteCollector(database, 'account', {
			batchSize: 2,
		});

		collector.add(1);
		collector.add(2);
		collector.add(3);
		collector.add(4);
		collector.add(2); // duplicate item
		await collector.flush();

		// Calling add method 5 times with a row but only 4 rows have been added because of duplicate key
		expect(collector.getDeletedRowCount()).toBe(4);
	});
});
