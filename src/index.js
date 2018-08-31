// @flow

import assignmentTransformer from './transformers/assignmentTransformer';
import BatchInsertCollector from './BatchInsertCollector';
import Client from './Client';
import columnNamesTransformer from './transformers/columnNamesTransformer';
import convertKeys from './convertKeys';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import insertTransformer from './transformers/insertTransformer';
import isUniqueViolation from './isUniqueViolation';
import multiInsertTransformer from './transformers/multiInsertTransformer';
import OneRowExpectedError from './errors/OneRowExpectedError';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import TypeNotFoundError from './errors/TypeNotFoundError';
import valueListTransformer from './transformers/valueListTransformer';
import valuesTableTransformer from './transformers/valuesTableTransformer';

SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('assign', assignmentTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

delete SQL._transforms.insert; // eslint-disable-line no-underscore-dangle
delete SQL._transforms.insert_object; // eslint-disable-line no-underscore-dangle
SQL.registerTransform('insert_object', 'insert', insertTransformer);

export type {Connection} from './Connection';
export type {Row} from './Row';

export {
    BatchInsertCollector,
    Client,
    convertKeys,
    DatabaseInsertStream,
    isUniqueViolation,
    OneRowExpectedError,
    SQL,
    SqlFragment,
    TypeNotFoundError,
};
