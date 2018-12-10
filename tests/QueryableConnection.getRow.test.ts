import OneRowExpectedError from '../src/errors/OneRowExpectedError';
import {Pool} from 'pg';
import Client from '../src/Client';

describe('getRow', () => {
    it('returns only one row when found', async () => {
        const resultRow = {};

        const pool: jest.Mocked<Pool> = new (jest.fn())() as any;
        pool.query = jest.fn();
        jest.spyOn(pool, 'query').mockImplementation(() => ({
            rows: [resultRow],
        }));

        const connection = new Client(pool);

        const result = await connection.getRow('');
        expect(result).toBe(resultRow);
    });

    it('throws an exception when no row is found', async () => {
        const pool: jest.Mocked<Pool> = new (jest.fn())() as any;
        pool.query = jest.fn();
        jest.spyOn(pool, 'query').mockImplementation(() => ({
            rows: [],
        }));

        const connection = new Client(pool);

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(0));
    });

    it('throws an exception when too many rows are found', async () => {
        const pool: jest.Mocked<Pool> = new (jest.fn())() as any;
        pool.query = jest.fn();
        jest.spyOn(pool, 'query').mockImplementation(() => ({
            rows: [
                {},
                {},
            ],
        }));

        const connection = new Client(pool);

        await expect(connection.getRow('')).rejects.toEqual(new OneRowExpectedError(2));
    });
});
