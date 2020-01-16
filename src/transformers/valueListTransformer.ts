import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

type BaseType = string | number | boolean | Date | null;
type RowValueType = BaseType | BaseType[];

const valueListTransformer = (values: readonly RowValueType[]): SqlFragment => {
	return sqlFragmentMapper(
		values,
		(value: RowValueType) => SQL`${value}`,
		', '
	);
};

export default valueListTransformer;
