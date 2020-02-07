import {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from '../../src/transformers/sqlFragmentMapper';

describe('SQL fragment mapper', () => {
	it('returns empty fragment for empty input without calling mapper at all', () => {
		const mapper = jest.fn((value: {readonly id: number}) => new SqlFragment([''], [value.id]));

		const result = sqlFragmentMapper([], mapper, 'GLUE');

		expect(result).toBeInstanceOf(SqlFragment);
		expect(result).toHaveProperty('text', '');
		expect(result).toHaveProperty('values', []);

		expect(mapper).toHaveBeenCalledTimes(0);
	});

	it('returns fragment for one input value calling mapper once not using glue', () => {
		const mapper = jest.fn((value: {readonly id: number}) => new SqlFragment([''], [value.id]));

		const value = {id: 1};
		const result = sqlFragmentMapper([value], mapper, 'GLUE');

		expect(result).toBeInstanceOf(SqlFragment);
		expect(result).toHaveProperty('text', '$1');
		expect(result).toHaveProperty('values', [1]);

		expect(mapper).toHaveBeenCalledTimes(1);
		expect(mapper).toHaveBeenNthCalledWith(1, value);
	});

	it('returns fragment for multiple input values calling mapper X times using glue', () => {
		const mapper = jest.fn((value: {readonly id: number}) => new SqlFragment([''], [value.id]));

		const value1 = {id: 1};
		const value2 = {id: 2};
		const value3 = {id: 3};
		const result = sqlFragmentMapper([value1, value2, value3], mapper, 'GLUE');

		expect(result).toBeInstanceOf(SqlFragment);
		expect(result).toHaveProperty('text', '$1GLUE$2GLUE$3');
		expect(result).toHaveProperty('values', [1, 2, 3]);

		expect(mapper).toHaveBeenCalledTimes(3);
		expect(mapper).toHaveBeenNthCalledWith(1, value1);
		expect(mapper).toHaveBeenNthCalledWith(2, value2);
		expect(mapper).toHaveBeenNthCalledWith(3, value3);
	});
});
