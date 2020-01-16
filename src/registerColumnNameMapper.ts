import {SQL} from 'pg-async';
import columnNameTransformer from './transformers/columnNameTransformer';

export type ColumnNameMapper = (column: string) => string;

const registerColumnNameMapper = (mapper: ColumnNameMapper): void => {
	// @ts-ignore we want to replace it here
	delete SQL._transforms.columnname; // eslint-disable-line no-underscore-dangle
	SQL.registerTransform('columnName', (column: string) => columnNameTransformer(mapper(column)));
};

export default registerColumnNameMapper;
