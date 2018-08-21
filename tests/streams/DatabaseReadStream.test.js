import {createPool} from '../bootstrap';
import DatabaseReadStream from '../../src/streams/DatabaseReadStream';
import QueryStream from 'pg-query-stream';

describe('DatabaseInsertStream', () => {
    let pool = null;
    let client = null;
    let stream = null;
    beforeAll(() => {
        pool = createPool();
    });
    afterAll(async () => {
        await pool.end();
        pool = null;
    });

    beforeEach(async () => {
        client = await pool.connect();
        stream = await client.query(new DatabaseReadStream('SELECT 42 AS theAnswer'));
    });
    afterEach(async () => {
        if (stream != null) {
            await stream.close();
            stream = null;
        }
        if (client != null) {
            client.release();
            client = null;
        }
    });

    it('inherits pg-query-stream', async () => {
        expect(stream).toBeInstanceOf(QueryStream);
        await stream.close();
    });

    it('returns Promise for closing', async () => {
        const closeResult = stream.close();
        expect(closeResult).toBeInstanceOf(Promise);
        await closeResult;
    });

    it('accepts a callback to be run after success closing as it is in original PgQueryStream', async () => {
        const spyOnCallback = jest.fn().mockImplementationOnce(() => Promise.resolve());
        await stream.close(spyOnCallback);
        expect(spyOnCallback).toHaveBeenCalledTimes(1);
    });

    it('rejects closing promise if given callback throws an error', async () => {
        const spyOnCallback = jest.fn().mockImplementationOnce(() => {
            throw new Error('TEST');
        });
        await expect(stream.close(spyOnCallback))
            .rejects
            .toEqual(new Error('TEST'));
        expect(spyOnCallback).toHaveBeenCalledTimes(1);
    });

    it('rejects closing promise if an error occurs', async () => {
        const uninitializedStream = new DatabaseReadStream('SELECT 42 AS theAnswer');
        await expect(uninitializedStream.close())
            .rejects
            .toEqual(new TypeError('Cannot read property \'close\' of null'));
    });
});
