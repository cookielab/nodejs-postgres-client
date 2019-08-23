import {AsyncQueryable} from '../src/Connection';
import {BatchInsertCollector} from '../src';
import {QueryConfig} from 'pg';

const createItem = (id: number): {readonly id: number} => ({id});

describe('BatchInsertCollector', () => {
	const database: AsyncQueryable = {
		query: () => Promise.resolve({
			rowCount: 4,
			command: '',
			oid: 0,
			fields: [],
			rows: [{}, {}, {}, {}],
		}),
	};

	it('does not do anything on flush for no data', async () => {
		const spyOnDatabaseQuery = jest.spyOn(database, 'query');

		const collector = new BatchInsertCollector(database, 'account').setBatchSize(2);
		await collector.flush();

		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);

		spyOnDatabaseQuery.mockReset();
		spyOnDatabaseQuery.mockRestore();
	});

	it('calls a query every batch size addition or on flush', async () => {
		const spyOnDatabaseQuery = jest.spyOn(database, 'query');

		const collector = new BatchInsertCollector(database, 'account').setBatchSize(2);

		await Promise.all([
			collector.add(createItem(1)),
			collector.add(createItem(2)),
			collector.add(createItem(3)),
			collector.add(createItem(4)),
		]);
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		const promise = collector.add(createItem(5));
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(2);

		await collector.flush();
		await promise;
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(3);

		spyOnDatabaseQuery.mockReset();
		spyOnDatabaseQuery.mockRestore();
	});

	it('calls a query on next tick', async () => {
		const spyOnDatabaseQuery = jest.spyOn(database, 'query');

		const collector = new BatchInsertCollector(database, 'account').setBatchSize(2);

		await collector.add(createItem(1));
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

		spyOnDatabaseQuery.mockReset();
		spyOnDatabaseQuery.mockRestore();
	});

	it('supports query suffix', async () => {
		const spyOnDatabaseQuery = jest.spyOn(database, 'query');

		const collector = new BatchInsertCollector(database, 'account')
			.setBatchSize(2)
			.setQuerySuffix('ON CONFLICT DO NOTHING');

		await collector.add(createItem(1));

		await collector.flush();
		expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);
		expect(spyOnDatabaseQuery).toBeCalledWith({
			asymmetricMatch: (sql: QueryConfig): boolean => {
				expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1) ON CONFLICT DO NOTHING');
				expect(sql.values).toEqual([1]);

				return true;
			},
		});

		spyOnDatabaseQuery.mockReset();
		spyOnDatabaseQuery.mockRestore();
	});

	it('use default batch size if less or equal to 0 or greater than MAX', () => {
		const collector = new BatchInsertCollector(database, 'account');

		collector.setBatchSize(0);
		expect(collector.getBatchSize()).toBe(1000);

		collector.setBatchSize(1001);
		expect(collector.getBatchSize()).toBe(1000);
	});

	it('calculates amount of inserted rows by query result not by added rows', async () => {
		const collector = new BatchInsertCollector(database, 'account')
			.setQuerySuffix('ON CONFLICT DO NOTHING');

		await Promise.all([
			collector.add(createItem(1)),
			collector.add(createItem(2)),
			collector.add(createItem(3)),
			collector.add(createItem(4)),
			collector.add(createItem(2)), // duplicate item
		]);

		// Calling add method 5 times with a row but only 4 rows have been added because of duplicate key
		expect(collector.getInsertedRowCount()).toBe(4);
	});
});
