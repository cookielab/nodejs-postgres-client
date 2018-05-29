import Client from '../src/Client';

const createDatabaseClientMock = () => {
    const databaseClient = new (jest.fn())();
    databaseClient.release = jest.fn();
    databaseClient.query = jest.fn();

    return databaseClient;
};

const createPoolMock = (databaseClient) => {
    const pool = new (jest.fn())();
    pool.connect = jest.fn(() => databaseClient);

    return pool;
};

describe('client', () => {
    it('begins and commits a successful transaction', async () => {
        const databaseClient = createDatabaseClientMock();
        const pool = createPoolMock(databaseClient);
        const transactionCallback = async (connection) => {
            await connection.query('SELECT 42');
            return 42;
        };

        const client = new Client(pool);
        const result = await client.transaction(transactionCallback);
        expect(result).toBe(42);

        // Obtains a client from the pool
        expect(pool.connect).toHaveBeenCalledTimes(1);

        // Performs transaction
        expect(databaseClient.query).toHaveBeenCalledTimes(3);
        const queryCalls = databaseClient.query.mock.calls;
        expect(queryCalls[0]).toMatchObject(['BEGIN']);
        expect(queryCalls[1]).toMatchObject([{text: 'SELECT 42', values: undefined}]); // undefined is passed by Connection
        expect(queryCalls[2]).toMatchObject(['COMMIT']);

        // Releases client
        expect(databaseClient.release).toHaveBeenCalledTimes(1);
    });

    it('begins and rollbacks an erroneous transaction', async () => {
        const databaseClient = createDatabaseClientMock();
        const pool = createPoolMock(databaseClient);
        const transactionCallback = () => {
            throw new Error('You shall not pass!');
        };

        const client = new Client(pool);
        await expect(client.transaction(transactionCallback)).rejects.toEqual(new Error('You shall not pass!'));

        // Obtains a client from the pool
        expect(pool.connect).toHaveBeenCalledTimes(1);

        // Performs transaction
        expect(databaseClient.query).toHaveBeenCalledTimes(2);
        const queryCalls = databaseClient.query.mock.calls;
        expect(queryCalls[0]).toMatchObject(['BEGIN']);
        expect(queryCalls[1]).toMatchObject(['ROLLBACK']);

        // Releases client
        expect(databaseClient.release).toHaveBeenCalledTimes(1);
    });

    it('performs a nested transaction on the same connection as the parent-transaction', async () => {
        const databaseClient = createDatabaseClientMock();
        const pool = createPoolMock(databaseClient);
        const nestedTransactionCallback = jest.fn((connection) => {
            expect(connection.connection).toBe(databaseClient);
        });

        const client = new Client(pool);
        await client.transaction(async (connection) => {
            await connection.transaction(nestedTransactionCallback);
        });

        expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);

        // Obtains a client from the pool only once
        expect(pool.connect).toHaveBeenCalledTimes(1);
    });
});
