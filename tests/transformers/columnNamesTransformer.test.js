import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';
import {SQL} from 'pg-async';

SQL.registerTransform('columnName', columnNameTransformer);

describe('column names transformer', () => {
    it('joins and escapes column names', () => {
        const result = columnNamesTransformer([
            'column',
            'another',
        ]);

        expect(result.toString()).toBe('"column", "another"');
    });

    it('does nothing for empty column names', () => {
        const result = columnNamesTransformer([]);

        expect(result.toString()).toBe('');
    });
});
