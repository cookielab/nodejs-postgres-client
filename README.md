# Postgres Client

## Installation

```sh
$ yarn add @cookielab.io/postgres-client pg
```

The library requires *pg* to be its peer dependency and thus it needs to added too. This ensures that both, the root project, and the library use the same *pg* version.

## Usage

## Recommendation
**Every model function** working with the database (put bluntly, everything in your model/ directory) **should require a database connection in its parameters**, which should then be passed from a higher level of the application (routes). This way we can ensure that transactions run correctly if they are nested.

### Connecting

```javascript
import {Client, SQL} from '@cookielab.io/postgres-client';
import config from '/config';
import {Pool} from 'pg';

const pool = new Pool({
    host: config.database.host,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    port: config.database.port,
});

const client = new Client(pool);

export default client;
export {SQL, isUniqueViolation} from '@cookielab.io/postgres-client';
```

The pool is the pool exported by [pg](https://node-postgres.com) and can be [configured as such](https://node-postgres.com/api/pool).

### Querying
```javascript
import database, {SQL} from './connection';

const email = 'jon@snow.com';
database.query(SQL`SELECT * FROM table WHERE email = ${email}`);
```

**Be aware!** Calling any function on the connection exported from `connection.js` may be executed on its own connection. To ensure that queries are called serially on one connection, transactions have to be used.

### Transactions

Transactions can be nested as deeply as needed, savepoints are used automatically. If a transaction throws an error (fails), it is correctly rolled back and the original error is rethrown. **The connection has to be passed around, otherwise the queries would not run in a transaction.** The value returned from the transaction callback is returned from the transaction function.

```javascript
import database, {SQL} from './connection';
import type {Connection} from '@cookielab.io/postgres-client';

const result = await database.transaction(async (transaction: Connection): Promise<number> => {
    await transaction.query(SQL`…`);

    await transaction.transaction(async (nestedTransaction: Connection): Promise<void> => {
        await transaction.query(SQL`…`);
    });

    return 42;
});

// result === 42
```

### SQL modifiers
The option to use the ``` SQL`…` ``` syntax comes from package [pg-async](https://www.npmjs.com/package/pg-async) and is re-exported by this library. The available modifiers are:

For an identifier name (table/column name):

* `id`
* `ident`
* `identifier`
* `name`

```javascript
SQL`SELECT * FROM $name${tableName}`
```

For a list of identifiers separated by a comma:

* `columnNames`

```javascript
SQL`SELECT $columnNames${columns} FROM table`
```

For a literal:

* `(empty)`
* `literal`

```javascript
SQL`SELECT * FROM table WHERE email = ${email}`;
SQL`SELECT * FROM table WHERE email = $literal${email}`;
```

For a raw value
* `!`

```javascript
SQL`SELECT * FROM table WHERE email = $!${thisWillNotBeEscaped}`;
```

For an object:

* `insert_object`

```javascript
const object = {
    column: 'value',
};

SQL`INSERT INTO table $insert_object${object}`; // INSERT INTO table (column) VALUES ('value')
```

For an assignment:

* `assign`

```javascript
const object = {
    column: 'value',
};

SQL`UPDATE table SET $assign${object}`; // UPDATE table SET column = 'value'
```

For a list of values:

* `values`

```javascript
const values = [
    'value',
    1234,
];

SQL`INSERT INTO table (string, number) VALUES ($values${values})`; // INSERT INTO table (string, number) VALUES ('value', 1234)
```

For a multi insert:

* `multiInsert`

```javascript
const values = [
    {
        string: 'value',
        number: 1234,
    },
    {
        string: 'value',
        number: 1234,
    },
];

SQL`INSERT INTO table $multiInsert${values})`; // INSERT INTO table (string, number) VALUES ('value', 1234), ('value', 1234)
```

### Custom types

The library allows to register transformers in both directions:
* database value -> javascript value
* javascript value -> database value

#### Database value -> javascript value
The following code causes every datetime value to be converted to `false`;

```javascript
import database from './connection';

await database.registerDatabaseTypes([
    {
        name: 'datetime', // the database type name, its oid is found automatically
        parser: (value: ?string): ?Date => {
            if (value == null) {
                return null;
            }

            return new Date(value);
        }
    }
]);
```

#### Javascript value -> database value
The following code causes every `TuringMachine` value to be converted into string via its `encode` method.

```javascript
import database from './connection';

database.registerJavascriptTypes([ // does not return a promise
    {
        match: (value: any) => value instanceof TuringMachine,
        convert (value: TuringMachine) => value.encode(),
    }
]);
```

## Api
The api is described using pseudo Flow syntax.

```javascript
import type {Pool} from 'pg';

declare module '@cookielab.io/postgres-client' {
    declare type QueryConfigurationObject = {
        name?: string,
        text: string,
        values?: any[],
        rowMode?: 'array',
    };

    declare class Result {
        rows: any[],
        fields: FieldInfo[],
        rowCount: number,
        command: string,
    };

    declare export function SQL (strings: string[], ...parameters: void[]): QueryConfigurationObject;

    declare export class Client {
        constructor(pool: Pool): void,

        // Returns one row if only one row is found
        // returns null if no row is found
        // throws OneRowExpectedError if more rows are found
        findOne: (text: string, values?: mixed[]) => Promise<?any>
               & (query: QueryConfigurationObject) => Promise<?any>,

        // Returns one row if only one row is found
        // throws given Error if no row is found
        // throws OneRowExpectedError if more rows are found
        getOne: (query: QueryConfigurationObject, errorClass: Class<Error>) => Promise<any>,

        // Inserts values into the given table
        // values are translated as literals
        // column names are changed into snake_case
        insert: (table: string, values: {[key: string]: any}) => Promise<Result>,

        // Runs any query on the first available client in the pool
        // or on the active connection during an active transaction
        query: (text: string, values?: mixed[]) => Promise<Result>
               & (query: QueryConfigurationObject) => Promise<Result>,

        // Returns one row if only one row is found
        // throws OneRowExpectedError if either no row is found or more rows are found
        getRow: (text: string, values?: mixed[]) => Promise<any>
              & (query: QueryConfigurationObject) => Promise<any>,

        // Returns found rows
        getRows: (text: string, values?: mixed[]) => Promise<any[]>
              & (query: QueryConfigurationObject) => Promise<any[]>,

        // the type of transaction is more complicated in real code but this gives the right intuition
        transaction<T>((connection: Client) => Promise<T>): Promise<T>,

        /* Following methods are not available inside of a transaction */

        // This method throws an error if it is called more than once
        registerJavascriptTypes: (javascriptTypes: Array<{|
            match: (any) => boolean;
            convert: (any) => ?string;
        |}>) => void,

        registerDatabaseTypes: (databaseTypes: Array<{|
            name: string,
            parser: (value: string) => ?any,
        |}>) => Promise<void>

        // Ends all connections
        end(): Promise<void>,
    };

    declare export function convertKeys(keys: {[key: string]: any}): {[key: string]: any};
    declare export function isUniqueViolation(error: Error): boolean;

    declare export class OneRowExpectedError;
    declare export class TypeNotFoundError;
}
```
