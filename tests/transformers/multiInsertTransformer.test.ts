import {SQL} from 'pg-async';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';
import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import multiInsertTransformer from '../../src/transformers/multiInsertTransformer';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('columnName', columnNameTransformer);
SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);

describe('multi insert transformer', () => {
	it('prepares insert for multiple rows with same keys', () => {
		const sql = multiInsertTransformer([
			{id: 'id1', name: 'name1', integer: 1},
			{id: 'id2', name: 'name2', integer: 2},
			{integer: 3, id: 'id3', name: 'name3'},
		]);

		expect(sql.text.trim()).toBe('("id", "name", "integer") VALUES ($1, $2, $3),\n($4, $5, $6),\n($7, $8, $9)');
		expect(sql.values).toEqual([
			'id1',
			'name1',
			1,
			'id2',
			'name2',
			2,
			'id3',
			'name3',
			3,
		]);
	});

	it('prepares insert for multiple rows with optional keys', () => {
		const sql = multiInsertTransformer([
			{id: 'id1', name: 'name1', integer: 1},
			{},
		]);

		expect(sql.text.trim()).toBe('("id", "name", "integer") VALUES ($1, $2, $3),\n($4, $5, $6)');
		expect(sql.values).toEqual([
			'id1',
			'name1',
			1,
			null,
			null,
			null,
		]);
	});

	it('fails for empty rows', () => {
		expect(() => {
			multiInsertTransformer([]);
		}).toThrow(new Error('Cannot format multi insert for no rows.'));
	});

	it('fails for list of rows with empty object as the first row', () => {
		expect(() => {
			multiInsertTransformer([
				{},
				{id: 'id1', name: 'name1', integer: 1},
			]);
		}).toThrow(new Error('Cannot format insert for rows of empty objects.'));
	});
});
