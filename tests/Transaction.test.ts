import Transaction from '../src/Transaction';
import {Client} from 'pg';

describe('transaction', () => {
    it('executes a transaction callback upon perform', async () => {
        const client: jest.Mocked<Client> = new (jest.fn())() as any;
        const transactionCallback = jest.fn();

        const transaction = new Transaction(client, transactionCallback);
        await transaction.perform();

        expect(transactionCallback).toHaveBeenCalledTimes(1);
        expect(transactionCallback).toHaveBeenCalledWith(transaction);
    });

    it('executes a nested transaction callback upon perform', async () => {
        const client: jest.Mocked<Client> = new (jest.fn())() as any;
        client.query = jest.fn();

        const nestedTransactionCallback = jest.fn();

        const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
            await connection.transaction(nestedTransactionCallback);
        });
        await transaction.perform();

        expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
        expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, nestedTransactionCallback, {
            savepointCounter: 1,
        }));

        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
        expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
    });

    it('rollbacks a failing nested transaction callback upon perform', async () => {
        const client: jest.Mocked<Client> = new (jest.fn())() as any;
        client.query = jest.fn();

        const nestedTransactionCallback = jest.fn(() => {
            throw new Error('Failing transaction');
        });

        const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
            await connection.transaction(nestedTransactionCallback);
        });
        await expect(transaction.perform())
            .rejects
            .toEqual(new Error('Failing transaction'));

        expect(nestedTransactionCallback).toHaveBeenCalledTimes(1);
        expect(nestedTransactionCallback).toHaveBeenCalledWith(new Transaction(client, nestedTransactionCallback, {
            savepointCounter: 1,
        }));

        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
        expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
    });

    it('succeeds check for unfinished insert streams from nested transaction', async () => {
        const client: jest.Mocked<Client> = new (jest.fn())() as any;
        client.query = jest.fn();

        const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
            const stream = transaction.insertStream('not_existing_table');
            stream.emit('finish');
        });

        const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
            await connection.transaction(nestedTransactionCallback);
        });
        await transaction.perform();

        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
        expect(client.query).toHaveBeenNthCalledWith(2, 'RELEASE SAVEPOINT savepoint1', undefined);
    });

    it('fails check for unfinished insert streams from nested transaction', async () => {
        const client: jest.Mocked<Client> = new (jest.fn())() as any;
        client.query = jest.fn();

        const nestedTransactionCallback = jest.fn((transaction: Transaction<void>): void => {
            transaction.insertStream('not_existing_table', '', 1000);
        });

        const transaction = new Transaction(client, async (connection: Transaction<void>): Promise<void> => {
            await connection.transaction(nestedTransactionCallback);
        });
        await expect(transaction.perform())
            .rejects
            .toEqual(new Error('Cannot commit transaction (or release savepoint) because there is 1 unfinished insert streams.'));

        expect(client.query).toHaveBeenCalledTimes(2);
        expect(client.query).toHaveBeenNthCalledWith(1, 'SAVEPOINT savepoint1', undefined);
        expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK TO SAVEPOINT savepoint1', undefined);
    });
});
