import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import {SQL} from 'pg-async';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);

describe('values table transformer', () => {
    it('prepares values table for multiple rows', () => {
        const sql = valuesTableTransformer([
            {id: 'id1', name: 'name1', integer: 1},
            {id: 'id2', name: 'name2', integer: 2},
        ]);

        expect(sql.values).toMatchObject([
            'id1', 'name1', 1,
            'id2', 'name2', 2,
        ]);
        expect(sql.text.trim()).toMatch('($1, $2, $3),\n($4, $5, $6)');
    });

    it('prepares values table for empty rows', () => {
        const sql = valuesTableTransformer([]);

        expect(sql.values).toMatchObject([]);
        expect(sql.text.trim()).toMatch('');
    });
});
