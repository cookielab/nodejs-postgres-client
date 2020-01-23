import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const columnNamesTransformer = (columns: readonly string[]): SqlFragment => {
	if (columns.length < 1) {
		throw new Error('Cannot create list of column names from empty array.');
	}

	return sqlFragmentMapper(
		columns,
		(column: string) => SQL`$columnName${column}`,
		', '
	);
};

export default columnNamesTransformer;
