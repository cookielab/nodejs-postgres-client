import {BatchInsertCollector} from '../src';

const createItem = (id) => ({id});

describe('BatchInsertCollector', () => {
    const database = {
        query: jest.fn(),
    };

    it('does not do anything on flush for no data', async () => {
        const spyOnDatabaseQuery = jest.spyOn(database, 'query');

        const collector = new BatchInsertCollector(database, 'account').setBatchSize(2);
        await collector.flush();

        expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(0);

        spyOnDatabaseQuery.mockReset();
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
    });

    it('calls a query on next tick', async () => {
        const spyOnDatabaseQuery = jest.spyOn(database, 'query');

        const collector = new BatchInsertCollector(database, 'account').setBatchSize(2);

        await collector.add(createItem(1));
        expect(spyOnDatabaseQuery).toHaveBeenCalledTimes(1);

        spyOnDatabaseQuery.mockReset();
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
            asymmetricMatch: (sql) => {
                expect(sql.text).toBe('INSERT INTO "account" ("id") VALUES ($1) ON CONFLICT DO NOTHING');
                expect(sql.values).toEqual([1]);
                return true;
            },
        });

        spyOnDatabaseQuery.mockReset();
    });

    it('use default batch size if less or equal to 0 or greater than MAX', () => {
        const collector = new BatchInsertCollector(database, 'account');

        collector.setBatchSize(0);
        expect(collector.batchSize).toBe(1000);

        collector.setBatchSize(1001);
        expect(collector.batchSize).toBe(1000);
    });
});
