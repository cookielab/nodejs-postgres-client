import {Connection} from './Connection';
import {Pool, QueryConfig, types} from 'pg';
import {SQL} from 'pg-async';
import DatabaseReadStream from './streams/DatabaseReadStream';
import QueryableConnection from './QueryableConnection';
import Transaction, {TransactionCallback} from './Transaction';
import TypeNotFoundError from './errors/TypeNotFoundError';
import pgUtils from 'pg/lib/utils';
import prepareJavascriptValue, {JavascriptType} from './prepareJavascriptValue';
import registerColumnNameMapper, {ColumnNameMapper} from './registerColumnNameMapper';

type TypeParserFunction = (value: string) => unknown;

export interface DatabaseType {
	readonly name: string;
	readonly parser: TypeParserFunction;
}

interface ClientOptions {
	readonly debug?: boolean;
	readonly javascriptTypes?: JavascriptType[];
	readonly columnNameMapper?: ColumnNameMapper;
}

const OPTIONS_DEFAULT = {
	debug: false,
};

const parseArray = (value: string, itemParser: TypeParserFunction): unknown[] | null => {
	// @ts-ignore https://github.com/brianc/node-pg-types/issues/98
	const parser = types.arrayParser.create(value, itemParser);

	return parser.parse();
};

class Client extends QueryableConnection implements Connection {
	private readonly pool: Pool;

	public constructor(pool: Pool, options: ClientOptions = OPTIONS_DEFAULT) {
		super(pool, options);
		this.pool = pool;

		if (options.javascriptTypes != null) {
			const originalPrepareValue = pgUtils.prepareValue;
			pgUtils.prepareValue = prepareJavascriptValue.bind(null, originalPrepareValue, options.javascriptTypes);
		}
		if (options.columnNameMapper != null) {
			registerColumnNameMapper(options.columnNameMapper);
		}
	}

	public async transaction<T>(transactionCallback: TransactionCallback<T>): Promise<T> {
		const client = await this.pool.connect();

		try {
			await client.query('BEGIN');

			const transaction = new Transaction(client, transactionCallback, {
				debug: this.debug,
			});
			const result = await transaction.perform();

			transaction.validateUnfinishedInsertStreams();

			await client.query('COMMIT');
			client.release();

			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			client.release(error);
			throw error;
		}
	}

	public async streamQuery(input: QueryConfig | string, values?: any[]): Promise<DatabaseReadStream> { // eslint-disable-line @typescript-eslint/no-explicit-any
		const query = new DatabaseReadStream(
			typeof input === 'string' ? input : input.text,
			typeof input === 'string' ? values : input.values,
		);

		const client = await this.pool.connect();
		const stream = client.query(query);

		const clientReleaseListener = (error?: Error): void => {
			stream.removeListener('error', clientReleaseListener);
			stream.removeListener('end', clientReleaseListener);
			stream.removeListener('close', clientReleaseListener);
			client.release(error);
		};
		stream.once('error', clientReleaseListener);
		stream.once('end', clientReleaseListener);
		stream.once('close', clientReleaseListener);

		return stream;
	}

	public async registerDatabaseTypes(databaseTypes: DatabaseType[]): Promise<void> {
		const promises = databaseTypes.map(async (type: DatabaseType): Promise<void> => {
			const {oid, typarray} = await this.getOne(SQL`
                SELECT oid, typarray FROM pg_type WHERE typname = ${type.name}
            `, TypeNotFoundError);

			types.setTypeParser(oid, type.parser);
			if (typarray > 0) {
				types.setTypeParser(typarray, (value: string) => parseArray(value, type.parser));
			}
		});

		await Promise.all(promises);
	}

	public async end(): Promise<void> {
		await this.pool.end();
	}
}

export default Client;
