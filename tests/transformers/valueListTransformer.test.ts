import valueListTransformer from '../../src/transformers/valueListTransformer';

describe('value list transformer', () => {
    it('joins values', () => {
        const sql = valueListTransformer([
            'string',
            123,
            true,
        ]);

        expect(sql.text.trim()).toBe('$1, $2, $3');
        expect(sql.values).toEqual([
            'string',
            123,
            true,
        ]);
    });

    it('does nothing for empty values', () => {
        const sql = valueListTransformer([]);

        expect(sql.text.trim()).toBe('');
        expect(sql.values).toEqual([]);
    });
});
