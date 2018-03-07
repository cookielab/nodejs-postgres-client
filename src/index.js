// @flow

import assignmentTransformer from './transformers/assignmentTransformer';
import BatchInsertCollector from './BatchInsertCollector';
import Client from './Client';
import columnNamesTransformer from './transformers/columnNamesTransformer';
import convertKeys from './convertKeys';
import isUniqueViolation from './isUniqueViolation';
import multiInsertTransformer from './transformers/multiInsertTransformer';
import OneRowExpectedError from './errors/OneRowExpectedError';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import TypeNotFoundError from './errors/TypeNotFoundError';
import valueListTransformer from './transformers/valueListTransformer';

SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('assign', assignmentTransformer);

export type {Connection} from './Connection';
export type {Row} from './Row';

export {
    BatchInsertCollector,
    Client,
    convertKeys,
    isUniqueViolation,
    OneRowExpectedError,
    SQL,
    SqlFragment,
    TypeNotFoundError,
};
