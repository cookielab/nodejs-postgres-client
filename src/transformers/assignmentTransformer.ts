import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const assignmentTransformer = <T extends Row>(row: T): SqlFragment => {
	const keys: ReadonlyArray<keyof T> = Object.keys(row);
	if (keys.length < 1) {
		throw new Error('Cannot create list of assignments from empty object.');
	}

	return sqlFragmentMapper(
		keys,
		(key: keyof T) => SQL`$columnName${key} = ${row[key]}`,
		',\n'
	);
};

export default assignmentTransformer;
