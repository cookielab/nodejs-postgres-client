import {Pool, PoolClient} from 'pg';
import {createPool} from '../bootstrap';
import DatabaseReadStream from '../../src/streams/DatabaseReadStream';

import QueryStream = require('pg-query-stream'); // eslint-disable-line @typescript-eslint/no-require-imports

describe('DatabaseReadStream', () => {
	const pool: Pool = createPool();
	afterAll(async () => {
		await pool.end();
	});

	let client: PoolClient = jest.fn() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
	let stream: DatabaseReadStream = jest.fn() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
	beforeEach(async () => {
		client = await pool.connect();
		stream = client.query(new DatabaseReadStream('SELECT 42 AS theAnswer'));
	});
	afterEach(async () => {
		await stream.close();
		client.release();
	});

	it('inherits pg-query-stream', async () => {
		expect(stream).toBeInstanceOf(QueryStream);
		await stream.close();
	});

	it('returns Promise for closing', async () => {
		const closeResult = stream.close();
		expect(closeResult).toBeInstanceOf(Promise); // eslint-disable-line @typescript-eslint/no-floating-promises
		await closeResult;
	});

	it('accepts a callback to be run after success closing as it is in original PgQueryStream', async () => {
		const spyOnCallback = jest.fn().mockImplementationOnce(() => Promise.resolve());
		await stream.close(spyOnCallback);
		expect(spyOnCallback).toHaveBeenCalledTimes(1);
	});

	it('rejects closing promise if given callback throws an error', async () => {
		const spyOnCallback = jest.fn().mockImplementationOnce(() => {
			throw new Error('TEST');
		});
		await expect(stream.close(spyOnCallback))
			.rejects
			.toEqual(new Error('TEST'));
		expect(spyOnCallback).toHaveBeenCalledTimes(1);
	});

	it('rejects closing promise if an error occurs', async () => {
		const uninitializedStream = new DatabaseReadStream('SELECT 42 AS theAnswer');
		await expect(uninitializedStream.close())
			.resolves
			.toEqual(undefined);
	});
});
