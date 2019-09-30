import {Row} from './Row';
import NonExistentColumnIndexError from './errors/NonExistentColumnIndexError';

const mapOneColumn = <T>(rows: readonly Row[], requestedColumnIndex: number): readonly T[] => {
	return rows.map((row: Row) => {
		const rowValues = Object.values(row);
		const maximumAvailableIndex = rowValues.length - 1;

		if (maximumAvailableIndex < requestedColumnIndex) {
			throw new NonExistentColumnIndexError(requestedColumnIndex, maximumAvailableIndex);
		}

		return rowValues[requestedColumnIndex] as T;
	});
};

export default mapOneColumn;
