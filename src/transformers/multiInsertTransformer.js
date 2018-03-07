// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import {snakeCase} from 'lodash';
import type {Row} from '../Row';

const multiInsertTransformer = (rows: Row[]): SqlFragment => {
    const columnNames = Object.keys(rows[0]).map(snakeCase);
    const insertHeader = SQL`($columnNames${columnNames}) VALUES`;

    const rowParts = rows.map((row: Row): string => {
        return SQL`($values${Object.values(row)})`;
    });

    const glue = new Array(rows.length + 2);
    glue.fill(',\n');
    glue[0] = ''; // there is no comma before insert header
    glue[1] = ' '; // there is a space between insert header and the first value list
    glue[glue.length - 1] = ''; // there is no comma after the last value list

    return new SqlFragment(glue, [insertHeader, ...rowParts]);
};

export default multiInsertTransformer;
