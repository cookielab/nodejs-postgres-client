import Client from '../src/Client';
import {createPool} from './bootstrap';
import {QueryResult} from 'pg';
import {Connection} from '../src';
import Transaction from '../src/Transaction';

describe('client database integration', () => {
    const client: Client = new Client(createPool());
    afterAll(async () => {
        await client.end();
    });

    it('performs a successful transaction', async () => {
        const result = await client.transaction(async (connection) => {
            return await connection.query('SELECT 42 AS theAnswer');
        });

        expect(result).toEqual(expect.objectContaining({
            rows: [{theanswer: 42}],
        }));
    });

    it('performs a failing transaction', async () => {
        const transaction = client.transaction(() => {
            throw new Error('Nope.');
        });

        await expect(transaction).rejects.toEqual(new Error('Nope.'));
    });

    it('performs a nested transaction', async () => {
        const [first, second] = await client.transaction(async (connection: Connection): Promise<[QueryResult, QueryResult]> => {
            const theAnswer = await connection.query('SELECT 42 AS theAnswer');

            const pi = await connection.transaction(async (nestedConnection: Connection): Promise<QueryResult> => {
                return await nestedConnection.query('SELECT 3.14 AS pi');
            });

            return [theAnswer, pi];
        });

        expect(first).toEqual(expect.objectContaining({
            rows: [{theanswer: 42}],
        }));
        expect(second).toEqual(expect.objectContaining({
            rows: [{pi: '3.14'}],
        }));
    });

    it('performs a nested transaction on the same connection as the parent-transaction', async (done) => {
        await client.transaction(async (connection: Transaction<void>) => {
            await connection.transaction((nestedConnection: Transaction<void>) => {
                // @ts-ignore connection property is defined as protected but we want to test it
                expect(nestedConnection.connection).toBe(connection.connection);

                done();
            });
        });
    });

    it('performs a nested transaction in sequence using iteration and Promise.all', async () => {
        const iterations = new Array(3).fill(null);

        await client.transaction(async (connection: Transaction<void>) => {
            await Promise.all(iterations.map(async () => {
                await connection.transaction((nestedConnection: Transaction<void>) => {
                    // @ts-ignore connection property is defined as protected but we want to test it
                    expect(nestedConnection.connection).toBe(connection.connection);
                });
            }));
        });
    });
});
