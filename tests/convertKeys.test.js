import convertKeys from '../src/convertKeys';

describe('convertKeys', () => {
    it('converts camelCase to snakeCase', () => {
        const before = {
            some: 'value',
            rainbowUnicorn: 42,
        };

        const after = convertKeys(before);
        expect(after).toMatchObject({
            some: 'value',
            rainbow_unicorn: 42,
        });
    });
});
