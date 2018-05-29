// @flow

import QueryableConnection from './QueryableConnection';
import type {Client, PoolClient} from 'pg';

export type TransactionCallback<T> = (connection: Transaction<T>) => Promise<T>;
export type NestedTransactionCallback<T, U> = (connection: Transaction<T>) => Promise<U>;

class Transaction<T> extends QueryableConnection {
    transactionCallback: TransactionCallback<T>;
    savepointCounter: number;

    constructor(client: Client | PoolClient, debug: boolean, transactionCallback: TransactionCallback<T>): void {
        super(client, debug);
        this.transactionCallback = transactionCallback;
        this.savepointCounter = 0;
    }

    async perform(): Promise<T> {
        return await this.transactionCallback(this);
    }

    async transaction<U>(transactionCallback: NestedTransactionCallback<T, U>): Promise<U> {
        const savepointName = `savepoint${++this.savepointCounter}`;

        await this.connection.query(`SAVEPOINT ${savepointName}`);

        try {
            const result = await transactionCallback(this);
            await this.connection.query(`RELEASE SAVEPOINT ${savepointName}`);

            return result;

        } catch (error) {
            await this.connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            throw error;
        }
    }
}

export default Transaction;
