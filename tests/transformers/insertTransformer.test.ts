import {SQL} from 'pg-async';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';
import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import insertTransformer from '../../src/transformers/insertTransformer';
import multiInsertTransformer from '../../src/transformers/multiInsertTransformer';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('columnName', columnNameTransformer);
SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

describe('insert transformer', () => {
    it('prepares insert for one row', () => {
        const sql = insertTransformer({id: 'id1', name: 'name1', integer: 1});

        expect(sql.text.trim()).toBe('("id", "name", "integer") VALUES ($1, $2, $3)');
        expect(sql.values).toEqual([
            'id1', 'name1', 1,
        ]);
    });
});
