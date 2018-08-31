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

        expect(result.text.trim()).toBe('"column", "another"');
        expect(result.values).toEqual([]);
    });

    it('does nothing for empty column names', () => {
        const result = columnNamesTransformer([]);

        expect(result.text.trim()).toBe('');
        expect(result.values).toEqual([]);
    });
});
