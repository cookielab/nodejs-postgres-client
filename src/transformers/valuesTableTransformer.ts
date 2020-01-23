import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const valuesTableTransformer = <T extends Row>(rows: readonly T[]): SqlFragment => {
	if (rows.length < 1) {
		throw new Error('Cannot format values table for no rows.');
	}
	const keys: ReadonlyArray<keyof T> = Object.keys(rows[0]);
	if (keys.length < 1) {
		throw new Error('Cannot format values table for rows of empty objects.');
	}

	return sqlFragmentMapper(
		rows,
		(row: T): SqlFragment => {
			const data = keys.map((key: keyof T) => row[key] ?? null);

			return SQL`($values${data})`;
		},
		',\n'
	);
};

export default valuesTableTransformer;
