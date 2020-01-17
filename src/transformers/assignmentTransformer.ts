import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const assignmentTransformer = <T extends Row>(row: T): SqlFragment => {
	return sqlFragmentMapper(
		Object.keys(row),
		(key: keyof T) => SQL`$columnName${key} = ${row[key]}`,
		',\n'
	);
};

export default assignmentTransformer;
