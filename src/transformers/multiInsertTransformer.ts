import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';

const multiInsertTransformer = <T extends Row>(rows: readonly T[]): SqlFragment => {
	if (rows.length < 1) {
		throw new Error('Cannot format multi insert for no rows.');
	}
	const columnNames: ReadonlyArray<keyof T> = Object.keys(rows[0]);
	if (columnNames.length < 1) {
		throw new Error('Cannot format insert for rows of empty objects.');
	}

	return SQL`($columnNames${columnNames}) VALUES $valuesTable${rows}`;
};

export default multiInsertTransformer;
