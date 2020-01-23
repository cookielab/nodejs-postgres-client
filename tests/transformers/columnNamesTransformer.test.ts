import {SQL} from 'pg-async';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';
import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';

SQL.registerTransform('columnName', columnNameTransformer);

describe('column names transformer', () => {
	it('joins and escapes column names', () => {
		const result = columnNamesTransformer([
			'column',
			'another',
		]);

		expect(result.text.trim()).toBe('"column", "another"');
		expect(result.values).toEqual([]);
	});

	it('fails for empty list of column names', () => {
		expect(() => {
			columnNamesTransformer([]);
		}).toThrow(new Error('Cannot create list of column names from empty array.'));
	});
});
