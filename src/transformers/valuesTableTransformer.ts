import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const valuesTableTransformer = (rows: Row[]): SqlFragment => {
	const keys: readonly string[] = rows.length > 0 ? Object.keys(rows[0]) : [];

	return sqlFragmentMapper(
		rows,
		(row: Row): SqlFragment => {
			const data = keys.map((key: string) => row[key] ?? null);

			return SQL`($values${data})`;
		},
		',\n'
	);
};

export default valuesTableTransformer;
