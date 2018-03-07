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

    it('uses a registered parser', async () => {
        const before = await client.query("SELECT '2017-05-29T05:00:00.000Z'::timestamptz AS time");
        expect(before.rows[0].time).toBeInstanceOf(Date);

        await client.registerDatabaseTypes([{
            name: 'timestamptz',
            parser: () => true,
        }]);

        const after = await client.query("SELECT '2017-05-29T05:00:00.000Z'::timestamptz AS time");
        expect(after.rows[0].time).toBe(true);
    });
});
