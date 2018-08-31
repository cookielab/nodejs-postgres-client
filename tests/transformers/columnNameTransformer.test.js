import columnNameTransformer from '../../src/transformers/columnNameTransformer';

describe('column name transformer', () => {
    it('escapes column name', () => {
        const result = columnNameTransformer('column');

        expect(result.toString()).toBe('"column"');
    });
});
