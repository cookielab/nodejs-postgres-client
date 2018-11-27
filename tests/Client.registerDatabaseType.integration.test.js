import Client from '../src/Client';
import {createPool} from './bootstrap';
import TypeNotFoundError from '../src/errors/TypeNotFoundError';

describe('query database integration', () => {
    let client = null;

    beforeEach(() => {
        client = new Client(createPool());
    });

    afterEach(async () => {
        await client.end();
    });

    it('throws an error when the type does not exist', async () => {
        await expect(client.registerDatabaseTypes([{
            name: 'Time machine',
            parser: () => true,
        }]))
            .rejects
            .toBeInstanceOf(TypeNotFoundError);
    });

    it('registers a parser based on an existing name', async () => {
        await client.registerDatabaseTypes([{
            name: 'timestamp',
            parser: (value) => value,
        }]);
    });

    describe('custom data type parser', () => {
        it('is used for a single value', async () => {
            const before = await client.query("SELECT '2017-05-29T05:00:00.000Z'::timestamptz AS time");
            expect(before.rows[0].time).toBeInstanceOf(Date);

            await client.registerDatabaseTypes([{
                name: 'timestamptz',
                parser: () => true,
            }]);

            const after = await client.query("SELECT '2017-05-29T05:00:00.000Z'::timestamptz AS time");
            expect(after.rows[0].time).toBe(true);
        });

        it('is used for array of values', async () => {
            const before = await client.query("SELECT ARRAY['2017-05-29T05:00:00.000Z'::timestamptz, '2017-05-30T05:00:00.000Z'::timestamptz, NULL] AS times");
            expect(before.rows[0].times).toEqual([true, true, null]);

            await client.registerDatabaseTypes([{
                name: 'timestamptz',
                parser: () => false,
            }]);

            const after = await client.query("SELECT ARRAY['2017-05-29T05:00:00.000Z'::timestamptz, '2017-05-30T05:00:00.000Z'::timestamptz, null] AS times");
            expect(after.rows[0].times).toEqual([false, false, null]);
        });

        it('parses null as possible array value', async () => {
            const nullableArray = await client.query('SELECT NULL::timestamptz[] AS times');
            expect(nullableArray.rows[0].times).toBe(null);
        });

        it('registers custom type parser for internal types too', async () => {
            await client.registerDatabaseTypes([{
                name: 'pg_class',
                parser: () => false,
            }]);
        });
    });
});
