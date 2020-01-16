import {SqlFragment} from 'pg-async/lib/sql';

const sqlFragmentMapper = <T>(input: readonly T[], valueMapper: (value: T) => SqlFragment, glueString: string): SqlFragment => {
	const values: readonly SqlFragment[] = input.map((value: T) => valueMapper(value));

	const glue = values.map(() => glueString);
	glue[0] = ''; // there is no glue in front of the first value

	return new SqlFragment(glue, values);
};

export default sqlFragmentMapper;
