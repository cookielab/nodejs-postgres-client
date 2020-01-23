import DatabaseReadStream from '../../src/streams/DatabaseReadStream';

import QueryStream = require('pg-query-stream'); // eslint-disable-line @typescript-eslint/no-require-imports

describe('DatabaseReadStream', () => {
	it('inherits pg-query-stream', () => {
		expect(new DatabaseReadStream('SELECT 42 AS theAnswer')).toBeInstanceOf(QueryStream);
	});

	it('emits "close" event on destroy', async () => {
		const stream = new DatabaseReadStream('SELECT 42 AS theAnswer');

		const promise = new Promise((resolve: () => void) => {
			stream.once('close', () => {
				resolve();
			});
		});

		stream.destroy();

		// The promise will not be resolved if the event is not emitted and the test will fail on timeout.
		await promise;
	});
});
