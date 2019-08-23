import {SQL} from 'pg-async';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('values', valueListTransformer);

describe('values table transformer', () => {
	it('prepares values table for multiple rows', () => {
		const sql = valuesTableTransformer([
			{id: 'id1', name: 'name1', integer: 1},
			{id: 'id2', name: 'name2', integer: 2},
		]);

		expect(sql.text.trim()).toBe('($1, $2, $3),\n($4, $5, $6)');
		expect(sql.values).toEqual([
			'id1',
			'name1',
			1,
			'id2',
			'name2',
			2,
		]);
	});

	it('prepares values table for empty rows', () => {
		const sql = valuesTableTransformer([]);

		expect(sql.text.trim()).toBe('');
		expect(sql.values).toEqual([]);
	});
});
