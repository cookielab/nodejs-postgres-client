import valueListTransformer from '../../src/transformers/valueListTransformer';

describe('value list transformer', () => {
	it('joins values', () => {
		const now = new Date();
		const sql = valueListTransformer([
			'string',
			123,
			true,
			now,
		]);

		expect(sql.text.trim()).toBe('$1, $2, $3, $4');
		expect(sql.values).toEqual([
			'string',
			123,
			true,
			now,
		]);
	});

	it('fails for empty values', () => {
		expect(() => {
			valueListTransformer([]);
		}).toThrow(new Error('Cannot create list of values from empty array.'));
	});
});
