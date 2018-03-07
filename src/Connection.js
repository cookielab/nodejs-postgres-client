// @flow

import QueryableConnection from './QueryableConnection';

export type Connection = QueryableConnection & {
    transaction<T>((connection: Connection) => Promise<T>): Promise<T>,
};
