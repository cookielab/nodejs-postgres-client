import {Row} from '../src';
import NonExistentColumnIndexError from '../src/errors/NonExistentColumnIndexError';
import mapOneColumn from '../src/mapOneColumn';

describe('mapOneColumn', () => {
	it('returns values of requested column index', () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
			date: 'now',
		}, {
			id: 666,
			name: 'row 666',
			date: 'now',
		}];

		const result = mapOneColumn<string>(queryRows, 1);

		expect(result).toStrictEqual(['row 42', 'row 666']);
	});

	it('returns empty array when no values are present in rows', () => {
		const queryRows: Row[] = [];

		const result = mapOneColumn<number>(queryRows, 0);

		expect(result).toStrictEqual([]);
	});

	it('throws error when non existent column index requested', () => {
		const queryRows: Row[] = [{
			id: 42,
			name: 'row 42',
			date: 'now',
		}, {
			id: 666,
			name: 'row 666',
			date: 'now',
		}];

		expect(() => mapOneColumn<string>(queryRows, 3)).toThrow(new NonExistentColumnIndexError(3, 2));
	});
});
