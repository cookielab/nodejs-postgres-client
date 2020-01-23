import {SQL} from 'pg-async';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('values', valueListTransformer);

describe('values table transformer', () => {
	it('prepares values table for multiple rows for objects with same ordering of keys/columns', () => {
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

	it('prepares values table for multiple rows for objects with different ordering of keys/columns', () => {
		const sql = valuesTableTransformer([
			{id: 'id1', name: 'name1', integer: 1},
			{integer: 2, id: 'id2', name: 'name2'},
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

	it('prepares values table for multiple rows for objects with extra keys/columns in following objects', () => {
		const sql = valuesTableTransformer([
			{id: 'id1', name: 'name1', integer: 1},
			{id: 'id2', name: 'name2', integer: 2, extra: 'foo'},
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

	it('prepares values table for multiple rows for objects with extra keys/columns in the first object (with missing keys/columns in following objects)', () => {
		const sql = valuesTableTransformer([
			{id: 'id1', name: 'name1', integer: 1, extra: 'bar'},
			{id: 'id2', name: 'name2', integer: 2},
			{},
		]);

		expect(sql.text.trim()).toBe('($1, $2, $3, $4),\n($5, $6, $7, $8),\n($9, $10, $11, $12)');
		expect(sql.values).toEqual([
			'id1',
			'name1',
			1,
			'bar',
			'id2',
			'name2',
			2,
			null,
			null,
			null,
			null,
			null,
		]);
	});

	it('fails for empty rows', () => {
		expect(() => {
			valuesTableTransformer([]);
		}).toThrow(new Error('Cannot format values table for no rows.'));
	});

	it('fails for list of rows with empty object as the first row', () => {
		expect(() => {
			valuesTableTransformer([
				{},
				{id: 'id1', name: 'name1', integer: 1},
			]);
		}).toThrow(new Error('Cannot format values table for rows of empty objects.'));
	});
});
