import {SQL} from 'pg-async';
import {SqlFragment} from 'pg-async/lib/sql';
import BatchInsertCollector from './BatchInsertCollector';
import Client from './Client';
import DatabaseInsertStream from './streams/DatabaseInsertStream';
import DatabaseReadStream from './streams/DatabaseReadStream';
import OneRowExpectedError from './errors/OneRowExpectedError';
import TypeNotFoundError from './errors/TypeNotFoundError';
import assignmentTransformer from './transformers/assignmentTransformer';
import columnNameTransformer from './transformers/columnNameTransformer';
import columnNamesTransformer from './transformers/columnNamesTransformer';
import insertTransformer from './transformers/insertTransformer';
import isUniqueViolation from './isUniqueViolation';
import multiInsertTransformer from './transformers/multiInsertTransformer';
import valueListTransformer from './transformers/valueListTransformer';
import valuesTableTransformer from './transformers/valuesTableTransformer';

SQL.registerTransform('columnName', columnNameTransformer);
SQL.registerTransform('columnNames', columnNamesTransformer);
SQL.registerTransform('values', valueListTransformer);
SQL.registerTransform('valuesTable', valuesTableTransformer);
SQL.registerTransform('assign', assignmentTransformer);
SQL.registerTransform('multiInsert', multiInsertTransformer);

// @ts-ignore we want to replace it here
delete SQL._transforms.insert; // eslint-disable-line no-underscore-dangle
// @ts-ignore we want to replace it here
delete SQL._transforms.insert_object; // eslint-disable-line no-underscore-dangle
SQL.registerTransform('insert_object', 'insert', insertTransformer);

export {Connection} from './Connection';
export {Row} from './Row';

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
