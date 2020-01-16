import DatabaseReadStream from '../../src/streams/DatabaseReadStream';

import QueryStream = require('pg-query-stream'); // eslint-disable-line @typescript-eslint/no-require-imports

describe('DatabaseReadStream', () => {
	it('inherits pg-query-stream', () => {
		expect(new DatabaseReadStream('SELECT 42 AS theAnswer')).toBeInstanceOf(QueryStream);
	});
});
