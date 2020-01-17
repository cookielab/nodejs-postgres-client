import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const valuesTableTransformer = <T extends Row>(rows: readonly T[]): SqlFragment => {
	const keys: ReadonlyArray<keyof T> = rows.length > 0 ? Object.keys(rows[0]) : [];

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
