import {QueryResult} from 'pg';
import {SQL} from 'pg-async';
import {createPool} from './bootstrap';
import Client from '../src/Client';

const expectUltimateResult = (result: QueryResult): void => {
	expect(result.rowCount).toBe(1);

	const row = result.rows[0];
	expect(row.answer).toBe(42);
};

describe('query database integration', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('returns result for a simple query', async () => {
		const result = await client.query('SELECT 42 AS answer');

		expectUltimateResult(result);
	});

	it('returns result for a simple query with values', async () => {
		const result = await client.query('SELECT 42 AS answer WHERE 1=$1', [1]);

		expect(result.rowCount).toBe(1);
	});

	it('returns result for a query configuration object', async () => {
		const result = await client.query({
			text: 'SELECT 42 AS answer',
		});

		expectUltimateResult(result);
	});

	it('returns result for a query configuration object with values', async () => {
		const result = await client.query({
			text: 'SELECT 42 AS answer WHERE 1=$1',
			values: [1],
		});

		expectUltimateResult(result);
	});

	it('returns result for sql tag', async () => {
		const result = await client.query(SQL`
            SELECT 42 AS answer WHERE 1=${1}
        `);

		expectUltimateResult(result);
	});
});
