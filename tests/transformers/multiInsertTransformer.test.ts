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
    it('prepares insert for multiple rows', () => {
        const sql = multiInsertTransformer([
            {id: 'id1', name: 'name1', integer: 1},
            {id: 'id2', name: 'name2', integer: 2},
        ]);

        expect(sql.text.trim()).toBe('("id", "name", "integer") VALUES ($1, $2, $3),\n($4, $5, $6)');
        expect(sql.values).toEqual([
            'id1', 'name1', 1,
            'id2', 'name2', 2,
        ]);
    });

    it('fails preparation of insert for empty rows', () => {
        expect(() => {
            multiInsertTransformer([]);
        }).toThrow(new Error('Cannot format multi insert for no rows.'));
    });
});
