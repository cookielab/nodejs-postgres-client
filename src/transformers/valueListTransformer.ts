import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

type BaseType = string | number | boolean | Date | null;
type RowValueType = BaseType | BaseType[];

const valueListTransformer = <T extends RowValueType>(values: readonly T[]): SqlFragment => {
	if (values.length < 1) {
		throw new Error('Cannot create list of values from empty array.');
	}

	return sqlFragmentMapper(
		values,
		(value: T) => SQL`${value}`,
		', '
	);
};

export default valueListTransformer;
