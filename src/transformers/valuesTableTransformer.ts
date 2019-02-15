import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const valuesTableTransformer = (rows: Row[]): SqlFragment => {
    return sqlFragmentMapper(
        rows,
        (row: Row) => SQL`($values${Object.values(row)})`,
        ',\n'
    );
};

export default valuesTableTransformer;
