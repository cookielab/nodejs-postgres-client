import assignmentTransformer from '../../src/transformers/assignmentTransformer';

describe('assignment transformer', () => {
    it('joins and escapes column names and its values', () => {
        const result = assignmentTransformer({
            longKey: 'string value',
            number: 12.4,
            flag: true,
        });

        expect(result.values).toMatchObject([
            'string value', 12.4, true,
        ]);
        expect(result.text.trim()).toMatch('"long_key" = $1,\n"number" = $2,\n"flag" = $3');
    });
});
