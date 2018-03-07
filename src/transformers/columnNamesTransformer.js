// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';

const columnNameTransformer = (columns: string[]): SqlFragment => {
    const names = columns.map((column: string) => SQL`$identifier${column}`);

    const glue = names.map((): string => ', ');
    glue[0] = ''; // there is no comma in front of the first element

    return new SqlFragment(glue, names);
};

export default columnNameTransformer;
