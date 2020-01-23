import columnNameTransformer from '../../src/transformers/columnNameTransformer';

describe('column name transformer', () => {
	it('escapes column name', () => {
		const result = columnNameTransformer('column');

		expect(result.text.trim()).toBe('"column"');
		expect(result.values).toEqual([]);
	});

	it('fails for empty string as column name', () => {
		expect(() => {
			columnNameTransformer('');
		}).toThrow(new Error('Expected nonempty string, got \'\''));
	});
});
