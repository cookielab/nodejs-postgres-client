import Client from '../src/Client';

describe('Client.end', () => {
	it('recalls end on the original pool', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pool: any = new (jest.fn())();
		pool.end = jest.fn(() => Promise.resolve());

		const client = new Client(pool);

		await client.end();

		expect(pool.end).toHaveBeenCalledTimes(1);
	});
});
