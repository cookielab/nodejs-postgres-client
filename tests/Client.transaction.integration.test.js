import * as bootstrap from './bootstrap';
import Client from '../src/Client';
import Result from 'pg/lib/result';

describe('client database integration', () => {
    let client = null;

    beforeAll(() => {
        client = new Client(bootstrap.createPool());
    });

    afterAll(async () => {
        await client.end();
    });

    it('performs a successful transaction', async () => {
        const result = await client.transaction(async (connection) => {
            return await connection.query('SELECT 42 AS theAnswer');
        });

        expect(result).toBeInstanceOf(Result);
    });

    it('performs a failing transaction', async () => {
        const transaction = client.transaction(() => {
            throw new Error('Nope.');
        });

        await expect(transaction).rejects.toEqual(new Error('Nope.'));
    });

    it('performs a nested transaction', async () => {
        const [first, second] = await client.transaction(async (connection) => {
            const theAnswer = await connection.query('SELECT 42 AS theAnswer');

            const pi = await connection.transaction(async (nestedConnection) => {
                return await nestedConnection.query('SELECT 3.14 AS pi');
            });

            return [theAnswer, pi];
        });

        expect(first).toBeInstanceOf(Result);
        expect(second).toBeInstanceOf(Result);
    });

    it('performs a nested transaction on the same connection as the parent-transaction', async (done) => {
        await client.transaction(async (connection) => {
            await connection.transaction((nestedConnection) => {
                expect(nestedConnection.connection).toBe(connection.connection);

                done();
            });
        });
    });
});
