import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';
import {Row} from '../Row';

const assignmentTransformer = (row: Row): SqlFragment => {
    return sqlFragmentMapper(
        Object.keys(row),
        (key: string) => SQL`$columnName${key} = ${row[key]}`,
        ',\n'
    );
};

export default assignmentTransformer;
