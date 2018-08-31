// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';

const columnNameTransformer = (column: string): SqlFragment => {
    return SQL`$identifier${column}`;
};

export default columnNameTransformer;
