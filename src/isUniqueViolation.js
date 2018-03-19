// @flow

import QueryError from './errors/QueryError';

type DatabaseError = Error & {
    code?: string,
};

const isUniqueViolation = (error: Error): boolean => {
    const databaseError: DatabaseError = error instanceof QueryError && error.causedBy instanceof Error
        ? error.causedBy
        : error;

    return databaseError.code != null
        && databaseError.code === '23505';
};

export default isUniqueViolation;
