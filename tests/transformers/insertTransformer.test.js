import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import insertTransformer from '../../src/transformers/insertTransformer';
import multiInsertTransformer from '../../src/transformers/multiInsertTransformer';
import {SQL} from 'pg-async';
import valueListTransformer from '../../src/transformers/valueListTransformer';
import valuesTableTransformer from '../../src/transformers/valuesTableTransformer';

SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

describe('insert transformer', () => {
    it('prepares insert for one row', () => {
        const sql = insertTransformer({id: 'id1', name: 'name1', integer: 1});

        expect(sql.values).toMatchObject([
            'id1', 'name1', 1,
        ]);
        expect(sql.text.trim()).toMatch('("id", "name", "integer") VALUES ($1, $2, $3)');
    });
});
