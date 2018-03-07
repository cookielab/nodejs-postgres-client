import valueListTransformer from '../../src/transformers/valueListTransformer';

describe('value list transformer', () => {
    it('joins values', () => {
        const sql = valueListTransformer([
            'string',
            123,
            true,
        ]);

        expect(sql.values).toMatchObject([
            'string',
            123,
            true,
        ]);
        expect(sql.text.trim()).toMatch('$1, $2, $3');
    });
});
