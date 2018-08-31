// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';
import type {Row} from '../Row';

const valuesTableTransformer = (rows: Row[]): SqlFragment => {
    return sqlFragmentMapper(
        rows,
        (row: Row) => SQL`($values${Object.values(row)})`,
        ',\n'
    );
};

export default valuesTableTransformer;
