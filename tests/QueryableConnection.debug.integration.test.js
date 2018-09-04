import Client from '../src/Client';
import {createPool} from './bootstrap';
import QueryError from '../src/errors/QueryError';

describe('invalid query in production mode', () => {
    let client = null;

    beforeAll(() => {
        client = new Client(createPool());
    });

    afterAll(async () => {
        await client.end();
    });

    it('should throw only database error', async () => {
        const promise = client.query('SELECT foo');

        await expect(promise)
            .rejects
            .not
            .toBeInstanceOf(QueryError);

        try {
            await promise;

        } catch (error) {
            expect(error.message).toBe('column "foo" does not exist');
        }
    });
});

describe('invalid query in debug mode', () => {
    let client = null;

    beforeAll(() => {
        client = new Client(createPool(), {
            debug: true,
        });
    });

    afterAll(async () => {
        await client.end();
    });

    it('should throw custom error with full stack trace', async () => {
        const promise = client.query('SELECT foo');

        await expect(promise)
            .rejects
            .toBeInstanceOf(QueryError);

        try {
            await promise;

        } catch (error) {
            expect(error.message).toBe('column "foo" does not exist');
            expect(error.causedBy).toBeInstanceOf(Error);
            expect(error.stack).toMatch(/QueryableConnection\.debug\.integration\.test/);
        }
    });

    it('should throw custom error with full stack trace within transaction', async () => {
        const promise = client.transaction((connection) => {
            return connection.query('SELECT foo');
        });

        await expect(promise)
            .rejects
            .toBeInstanceOf(QueryError);

        try {
            await promise;

        } catch (error) {
            expect(error.message).toBe('column "foo" does not exist');
            expect(error.causedBy).toBeInstanceOf(Error);
            expect(error.stack).toMatch(/QueryableConnection\.debug\.integration\.test/);
        }
    });
});
