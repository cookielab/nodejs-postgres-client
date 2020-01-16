import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';

const multiInsertTransformer = (rows: readonly Row[]): SqlFragment => {
	if (rows.length <= 0) {
		throw new Error('Cannot format multi insert for no rows.');
	}
	const columnNames = Object.keys(rows[0]);

	return SQL`($columnNames${columnNames}) VALUES $valuesTable${rows}`;
};

export default multiInsertTransformer;
