import {SQL} from 'pg-async';
import columnNameTransformer from '../src/transformers/columnNameTransformer';
import registerColumnNameMapper from '../src/registerColumnNameMapper';

import snakeCase = require('lodash.snakecase'); // eslint-disable-line @typescript-eslint/no-require-imports

SQL.registerTransform('columnName', columnNameTransformer);

describe('registerColumnNameMapper', () => {
	it('changes column name transformer using mapper', () => {
		const columnName = 'loremIpsum';

		const fragmentBefore = SQL`$columnName${columnName}`;
		expect(fragmentBefore.text.trim()).toBe('"loremIpsum"');
		expect(fragmentBefore.values).toEqual([]);

		registerColumnNameMapper(snakeCase);

		const fragmentAfter = SQL`$columnName${columnName}`;
		expect(fragmentAfter.text.trim()).toBe('"lorem_ipsum"');
		expect(fragmentAfter.values).toEqual([]);
	});
});
