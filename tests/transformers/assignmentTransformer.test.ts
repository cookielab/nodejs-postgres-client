import {SQL} from 'pg-async';
import assignmentTransformer from '../../src/transformers/assignmentTransformer';
import columnNameTransformer from '../../src/transformers/columnNameTransformer';

SQL.registerTransform('columnName', columnNameTransformer);

describe('assignment transformer', () => {
    it('joins and escapes column names and its values', () => {
        const result = assignmentTransformer({
            long_key: 'string value',
            number: 12.4,
            flag: true,
        });

        expect(result.text.trim()).toBe('"long_key" = $1,\n"number" = $2,\n"flag" = $3');
        expect(result.values).toEqual([
            'string value', 12.4, true,
        ]);
    });

    it('does nothing for empty object', () => {
        const result = assignmentTransformer({});

        expect(result.text.trim()).toBe('');
        expect(result.values).toEqual([]);
    });
});
