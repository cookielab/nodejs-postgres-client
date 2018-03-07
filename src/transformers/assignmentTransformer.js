// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import {snakeCase} from 'lodash';
import type {Row} from '../Row';

const assignmentTransformer = (row: Row): SqlFragment => {
    const values = [];
    for (const key of Object.keys(row)) {
        values.push(SQL`$identifier${snakeCase(key)} = ${row[key]}`);
    }

    const glue = values.map((): string => ',\n');
    glue[0] = ''; // there is no comma in front of the first value

    return new SqlFragment(glue, values);
};

export default assignmentTransformer;
