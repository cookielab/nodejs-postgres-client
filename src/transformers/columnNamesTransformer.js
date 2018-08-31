// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import sqlFragmentMapper from './sqlFragmentMapper';

const columnNamesTransformer = (columns: string[]): SqlFragment => {
    return sqlFragmentMapper(
        columns,
        (column: string) => SQL`$columnName${column}`,
        ', '
    );
};

export default columnNamesTransformer;
