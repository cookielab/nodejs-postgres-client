// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const columnNameTransformer = (columns: string[]): SqlFragment => {
    return sqlFragmentMapper(
        columns,
        (column: string) => SQL`$identifier${column}`,
        ', '
    );
};

export default columnNameTransformer;
