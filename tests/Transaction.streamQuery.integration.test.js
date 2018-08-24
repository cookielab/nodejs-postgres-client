import * as bootstrap from './bootstrap';
import Client from '../src/Client';
import DatabaseReadStream from '../src/streams/DatabaseReadStream';
import {ReadableStreamAsyncReader} from '@cookielab.io/stream-async-wrappers';
import Result from 'pg/lib/result';

describe('transaction database integration', () => {
    let client = null;
    beforeAll(() => {
        client = new Client(bootstrap.createPool());
    });
    afterAll(async () => {
        await client.end();
    });

    it('performs a successful query stream by string query', async () => {
        await client.transaction(async (transaction) => {
            const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

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
    });

    it('performs a successful query stream by query config', async () => {
        await client.transaction(async (transaction) => {
            const stream = await transaction.streamQuery({text: 'SELECT 42 AS theAnswer'});

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
    });

    it('performs a failing query stream', async () => {
        await client.transaction(async (transaction) => {
            const stream = await transaction.streamQuery('SELECT 42 AS theAnswer FROM unknown_table');

            expect(stream).toBeInstanceOf(DatabaseReadStream);
            const reader = new ReadableStreamAsyncReader(stream);
            await expect(reader.read())
                .rejects
                .toEqual(new Error('relation "unknown_table" does not exist'));
        });
    });

    it('fails trying to run another query in transaction with open stream', async () => {
        await client.transaction(async (transaction) => {
            const stream = await transaction.streamQuery('SELECT 42 AS theAnswer');

            expect(stream).toBeInstanceOf(DatabaseReadStream);
            await expect(transaction.query('SELECT 41 AS theAnswer'))
                .rejects
                .toEqual(new Error('Cannot run another query while one is still in progress. Possibly opened cursor.'));
            await stream.close();

            const result = await transaction.query('SELECT 41 AS theAnswer');
            expect(result).toBeInstanceOf(Result);
            expect(result.rowCount).toBe(1);

            const row = result.rows[0];
            expect(row.theanswer).toBe(41);
        });
    });
});
