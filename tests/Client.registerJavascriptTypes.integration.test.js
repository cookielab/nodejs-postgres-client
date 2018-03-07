import * as prepareJavascriptValue from '../src/prepareJavascriptValue';
import Client from '../src/Client';
import pgUtils from 'pg/lib/utils';

describe('registerJavascriptTypes', () => {
    const prepareValue = pgUtils.prepareValue;

    afterEach(() => {
        pgUtils.prepareValue = prepareValue;
    });

    it('overwrites the original prepareValue function', () => {
        const client = new Client();
        const originalPrepareValue = pgUtils.prepareValue;

        client.registerJavascriptTypes([]);

        expect(pgUtils.prepareValue).not.toBe(originalPrepareValue);
    });

    it('uses custom prepareValue function', () => {
        const client = new Client();
        const prepareValueMock = jest.spyOn(prepareJavascriptValue, 'default');

        client.registerJavascriptTypes([]);
        pgUtils.prepareValue(null);

        expect(prepareValueMock).toHaveBeenCalledTimes(1);

        prepareValueMock.mockReset();
        prepareValueMock.mockRestore();
    });

    it('allows multiple call of the function', () => {
        const client = new Client();
        const returnValue = {};
        const wrappedConvert = jest.fn(() => returnValue);

        client.registerJavascriptTypes([
            {
                match: () => true,
                convert: wrappedConvert,
            },
            {
                match: () => false,
                convert: wrappedConvert,
            },
        ]);

        pgUtils.prepareValue(null);
        expect(wrappedConvert).toHaveBeenCalledTimes(1);
    });

    it('throws an error on more than one registration of JavaScript types', () => {
        const client = new Client();

        client.registerJavascriptTypes([]);

        expect(() => {
            client.registerJavascriptTypes([]);
        }).toThrowError('Javascript types should be registered only once.');
    });
});
