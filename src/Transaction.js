// @flow

import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryableConnection from './QueryableConnection';
import type {Client, PoolClient, QueryConfig, QuerySubmittableConfig, ResultSet} from 'pg';

export type TransactionCallback<T> = (connection: Transaction<T>) => Promise<T>;

class Transaction<T> extends QueryableConnection {
    +connection: Client | PoolClient;
    +transactionCallback: TransactionCallback<T>;
    savepointCounter: number;
    isReadStreamInProgress: boolean;
    insertStreamInProgressCount: number;

    constructor(client: Client | PoolClient, debug: boolean, transactionCallback: TransactionCallback<T>, savepointCounter: number = 0): void {
        super(client, debug);
        this.transactionCallback = transactionCallback;
        this.savepointCounter = savepointCounter;
        this.isReadStreamInProgress = false;
        this.insertStreamInProgressCount = 0;
    }

    async perform(): Promise<T> {
        return await this.transactionCallback(this);
    }

    async transaction<U>(transactionCallback: TransactionCallback<U>): Promise<U> {
        const savepointName = `savepoint${++this.savepointCounter}`;

        await this.query(`SAVEPOINT ${savepointName}`);

        try {
            const transaction = new Transaction(this.connection, this.debug, transactionCallback, this.savepointCounter);
            const result = await transaction.perform();

            transaction.validateUnfinishedInsertStreams();

            await this.query(`RELEASE SAVEPOINT ${savepointName}`);

            return result;

        } catch (error) {
            await this.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            throw error;
        }
    }

    async query<U: QuerySubmittableConfig>(input: QueryConfig | string | U, values?: mixed[]): Promise<ResultSet | U> {
        if (this.isReadStreamInProgress) {
            throw new Error('Cannot run another query while one is still in progress. Possibly opened cursor.');
        }

        return await super.query(input, values);
    }

    async streamQuery(input: QueryConfig | string, values?: mixed[]): Promise<DatabaseReadStream> {
        const query = new DatabaseReadStream(
            typeof input === 'string' ? input : input.text,
            typeof input === 'string' ? values : input.values
        );

        // $FlowFixMe - Flow does not support polymorphic methods and their resolution based on input parameters
        const stream = await this.query(query);

        this.isReadStreamInProgress = true;
        const resetStreamProgressHandler = (): void => {
            this.isReadStreamInProgress = false;
        };
        stream.once('error', resetStreamProgressHandler);
        stream.once('end', resetStreamProgressHandler);
        stream.once('close', resetStreamProgressHandler);

        return stream;
    }

    validateUnfinishedInsertStreams(): void {
        if (this.insertStreamInProgressCount > 0) {
            throw new Error(`Cannot commit transaction (or release savepoint) because there is ${this.insertStreamInProgressCount} unfinished insert streams.`);
        }
    }

    insertStream(tableName: string, querySuffix?: string, batchSize?: number): DatabaseInsertStream {
        const stream = super.insertStream(tableName, querySuffix, batchSize);

        stream.once('finish', (): void => {
            this.insertStreamInProgressCount--;
        });
        this.insertStreamInProgressCount++;

        return stream;
    }
}

export default Transaction;
