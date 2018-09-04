import * as prepareJavascriptValue from '../src/prepareJavascriptValue';
import Client from '../src/Client';
import columnNameTransformer from '../src/transformers/columnNameTransformer';
import pgUtils from 'pg/lib/utils';
import {SQL} from 'pg-async';

SQL.registerTransform('columnName', columnNameTransformer);

describe('constructor', () => {
    const pool = jest.fn();

    describe('registerColumnNameMapper', () => {
        const originalTransformer = SQL._transforms.columnname; // eslint-disable-line no-underscore-dangle

        it('does not overwrite the original column name transformer if custom is not defined', () => {
            const client = new Client(pool);
            expect(client).toBeInstanceOf(Client);

            expect(SQL._transforms.columnname).toBe(originalTransformer); // eslint-disable-line no-underscore-dangle
        });

        it('overwrites the original column name transformer if custom is defined', () => {
            const customColumnNameMapper = jest.fn();
            const client = new Client(pool, {
                columnNameMapper: customColumnNameMapper,
            });
            expect(client).toBeInstanceOf(Client);

            expect(SQL._transforms.columnname).not.toBe(originalTransformer); // eslint-disable-line no-underscore-dangle
        });
    });

    describe('registerJavascriptTypes', () => {
        const originalPrepareValue = pgUtils.prepareValue;

        afterEach(() => {
            pgUtils.prepareValue = originalPrepareValue;
        });

        it('does not overwrite the original prepareValue function if custom javascript types are not defined', () => {
            const client = new Client(pool);
            expect(client).toBeInstanceOf(Client);

            expect(pgUtils.prepareValue).toBe(originalPrepareValue);
        });

        it('overwrites the original prepareValue function if custom javascript types defined', () => {
            const client = new Client(pool, {
                javascriptTypes: [],
            });
            expect(client).toBeInstanceOf(Client);

            expect(pgUtils.prepareValue).not.toBe(originalPrepareValue);
        });

        it('uses custom prepareValue function if custom javascript types defined', () => {
            const prepareValueMock = jest.spyOn(prepareJavascriptValue, 'default');

            const client = new Client(pool, {
                javascriptTypes: [],
            });
            expect(client).toBeInstanceOf(Client);

            pgUtils.prepareValue(null);
            expect(prepareValueMock).toHaveBeenCalledTimes(1);

            prepareValueMock.mockReset();
            prepareValueMock.mockRestore();
        });

        it('allows multiple types with the same convert function', () => {
            const returnValue = {};
            const wrappedConvert = jest.fn(() => returnValue);

            const client = new Client(pool, {
                javascriptTypes: [
                    {
                        match: () => true,
                        convert: wrappedConvert,
                    },
                    {
                        match: () => false,
                        convert: wrappedConvert,
                    },
                ],
            });
            expect(client).toBeInstanceOf(Client);

            pgUtils.prepareValue(null);
            expect(wrappedConvert).toHaveBeenCalledTimes(1);
        });
    });
});
