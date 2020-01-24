import {Connection} from '../src';
import {createPool} from './bootstrap';
import Client from '../src/Client';
import QueryError from '../src/errors/QueryError';
import Transaction from '../src/Transaction';

describe('QueryableConnection.debug', () => {
	describe('invalid query in production mode', () => {
		const client: Client = new Client(createPool());
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
		const client: Client = new Client(createPool(), {
			debug: true,
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
				expect(error.stack).toMatch(/QueryableConnection\.debug\.integration\.test/u);
			}
		});

		it('should throw custom error with full stack trace within transaction', async () => {
			const promise = client.transaction(async (connection: Connection) => {
				expect(connection).toBeInstanceOf(Transaction);

				return await connection.query('SELECT foo');
			});

			await expect(promise)
				.rejects
				.toBeInstanceOf(QueryError);

			try {
				await promise;
			} catch (error) {
				expect(error.message).toBe('column "foo" does not exist');
				expect(error.causedBy).toBeInstanceOf(Error);
				expect(error.stack).toMatch(/QueryableConnection\.debug\.integration\.test/u);
			}
		});
	});
});
