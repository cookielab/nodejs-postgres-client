import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryableConnection from './QueryableConnection';
import {Client, PoolClient, QueryConfig, QueryResult} from 'pg';
import {QueryValue} from './QueryValue';
import {Lock} from 'semaphore-async-await';
import {Connection} from './Connection';

export type TransactionCallback<T> = (connection: Transaction<T>) => Promise<T> | T;

type TransactionOptions = {
    debug?: boolean,
    savepointCounter?: number,
};

const OPTIONS_DEFAULT = {
    debug: false,
    savepointCounter: 0,
};

class Transaction<T> extends QueryableConnection implements Connection {
    protected readonly connection!: Client | PoolClient; // ! - initialized in parent constructor
    private readonly transactionCallback: TransactionCallback<T>;
    private readonly innerTransactionLock: Lock;
    private savepointCounter: number;
    private isReadStreamInProgress: boolean;
    private insertStreamInProgressCount: number;

    constructor(client: Client | PoolClient, transactionCallback: TransactionCallback<T>, options: TransactionOptions = OPTIONS_DEFAULT) {
        super(client, options);
        this.transactionCallback = transactionCallback;
        this.innerTransactionLock = new Lock();
        this.savepointCounter = options.savepointCounter != null ? options.savepointCounter : 0;
        this.isReadStreamInProgress = false;
        this.insertStreamInProgressCount = 0;
    }

    async perform(): Promise<T> {
        return await this.transactionCallback(this);
    }

    async transaction<U>(transactionCallback: TransactionCallback<U>): Promise<U> {
        await this.innerTransactionLock.acquire();
        try {
            const savepointName = `savepoint${++this.savepointCounter}`;

            await this.query(`SAVEPOINT ${savepointName}`);

            try {
                const transaction = new Transaction(this.connection, transactionCallback, {
                    debug: this.debug,
                    savepointCounter: this.savepointCounter,
                });
                const result = await transaction.perform();

                transaction.validateUnfinishedInsertStreams();

                await this.query(`RELEASE SAVEPOINT ${savepointName}`);

                return result;

            } catch (error) {
                await this.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                throw error;
            }
        } finally {
            this.innerTransactionLock.release();
        }
    }

    async query(input: QueryConfig | string, values?: QueryValue[]): Promise<QueryResult> {
        if (this.isReadStreamInProgress) {
            throw new Error('Cannot run another query while one is still in progress. Possibly opened cursor.');
        }

        return await super.query(input, values);
    }

    async streamQuery(input: QueryConfig | string, values?: QueryValue[]): Promise<DatabaseReadStream> {
        if (this.isReadStreamInProgress) {
            throw new Error('Cannot run another query while one is still in progress. Possibly opened cursor.');
        }

        const query = new DatabaseReadStream(
            typeof input === 'string' ? input : input.text,
            typeof input === 'string' ? values : input.values
        );

        const stream = await this.connection.query(query);

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
