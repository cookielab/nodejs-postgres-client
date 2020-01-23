import {SqlFragment} from 'pg-async/lib/sql';

const sqlFragmentMapper = <T>(input: readonly T[], valueMapper: (value: T) => SqlFragment, glueString: string): SqlFragment => {
	if (input.length < 1) {
		return new SqlFragment([], []);
	}

	const values: readonly SqlFragment[] = input.map((value: T) => valueMapper(value));

	const glues = new Array(values.length)
		.fill('', 0, 1) // there is empty string glue in front of the first value
		.fill(glueString, 1);

	return new SqlFragment(glues, values);
};

export default sqlFragmentMapper;
