import QueryError from '../../src/errors/QueryError';

describe('QueryError', () => {
	it('accepts query config input with text only', () => {
		const error = new QueryError({
			text: 'SELECT 1',
		});

		expect(error).toHaveProperty('query', 'SELECT 1');
		expect(error).toHaveProperty('values', undefined);
		expect(error.causedBy).toBeUndefined();
	});

	it('accepts query config input with text and values', () => {
		const error = new QueryError({
			text: 'SELECT $1',
			values: [1],
		});

		expect(error).toHaveProperty('query', 'SELECT $1');
		expect(error).toHaveProperty('values', [1]);
		expect(error.causedBy).toBeUndefined();
	});

	it('accepts query as string only', () => {
		const error = new QueryError('SELECT 1');

		expect(error).toHaveProperty('query', 'SELECT 1');
		expect(error).toHaveProperty('values', undefined);
		expect(error.causedBy).toBeUndefined();
	});

	it('accepts query as string with extra values', () => {
		const error = new QueryError('SELECT $1', [1]);

		expect(error).toHaveProperty('query', 'SELECT $1');
		expect(error).toHaveProperty('values', [1]);
		expect(error.causedBy).toBeUndefined();
	});

	it('allows causedBy setup', () => {
		const error = new QueryError('');
		const causedByError = new Error('TEST');
		error.causedBy = causedByError;

		expect(error.causedBy).toBe(causedByError);
	});

	it('allows causedBy setup once only', () => {
		const error = new QueryError('');
		const causedByError = new Error('TEST');
		error.causedBy = causedByError;

		expect(error.causedBy).toBe(causedByError);

		expect(() => {
			error.causedBy = new Error('TEST2');
		}).toThrow();

		expect(error.causedBy).toBe(causedByError);
	});
});
