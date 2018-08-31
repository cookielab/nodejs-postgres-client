import columnNamesTransformer from '../../src/transformers/columnNamesTransformer';

describe('column name transformer', () => {
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
