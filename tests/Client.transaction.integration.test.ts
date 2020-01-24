import {Connection} from '../src';
import {QueryResult} from 'pg';
import {createPool} from './bootstrap';
import {sleep} from './utils';
import Client from '../src/Client';
import Transaction from '../src/Transaction';

describe('Client.transaction', () => {
	const client: Client = new Client(createPool());
	afterAll(async () => {
		await client.end();
	});

	it('performs a successful transaction', async () => {
		const result = await client.transaction(async (connection: Connection) => {
			return await connection.query('SELECT 42 AS theAnswer');
		});

		expect(result).toEqual(expect.objectContaining({
			rows: [{theanswer: 42}],
		}));
	});

	it('performs a failing transaction', async () => {
		const transaction = client.transaction(async (connection: Connection) => {
			await connection.query('SELECT 42 AS theAnswer');
			await Promise.reject(new Error('Nope.'));
			await connection.query('SELECT 43 AS theAnswer');
		});

		await expect(transaction)
			.rejects.toEqual(new Error('Nope.'));
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

	it('performs nested transactions in sequence using iteration and Promise.all', async () => {
		const iterations = new Array(3).fill(null);

		await client.transaction(async (connection: Transaction<void>) => {
			let counter = 0;
			await Promise.all(iterations.map(async (value: null, index: number) => {
				await connection.transaction(async (nestedConnection: Transaction<void>) => {
					expect(counter).toBe(index);
					// the first nested transaction takes the most time so we can be sure about following assertions
					await sleep(100 - (index * 20));
					// @ts-ignore connection property is defined as protected but we want to test it
					expect(nestedConnection.connection).toBe(connection.connection);
					counter++;
				});
			}));
			expect(counter).toBe(3);
		});
	});
});
