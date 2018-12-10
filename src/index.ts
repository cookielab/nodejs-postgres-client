import assignmentTransformer from './transformers/assignmentTransformer';
import BatchInsertCollector from './BatchInsertCollector';
import Client from './Client';
import columnNamesTransformer from './transformers/columnNamesTransformer';
import columnNameTransformer from './transformers/columnNameTransformer';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import insertTransformer from './transformers/insertTransformer';
import isUniqueViolation from './isUniqueViolation';
import multiInsertTransformer from './transformers/multiInsertTransformer';
import OneRowExpectedError from './errors/OneRowExpectedError';
import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import TypeNotFoundError from './errors/TypeNotFoundError';
import valueListTransformer from './transformers/valueListTransformer';
import valuesTableTransformer from './transformers/valuesTableTransformer';

SQL.registerTransform('columnName', columnNameTransformer);
SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('assign', assignmentTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

delete SQL._transforms.insert; // eslint-disable-line no-underscore-dangle
delete SQL._transforms.insert_object; // eslint-disable-line no-underscore-dangle
SQL.registerTransform('insert_object', 'insert', insertTransformer);

export {Connection} from './Connection';
export {Row} from './Row';
export {QueryValue} from './QueryValue';

export {
    BatchInsertCollector,
    Client,
    DatabaseInsertStream,
    DatabaseReadStream,
    isUniqueViolation,
    OneRowExpectedError,
    SQL,
    SqlFragment,
    TypeNotFoundError,
};
