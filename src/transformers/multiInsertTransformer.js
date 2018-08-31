// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import {snakeCase} from 'lodash';
import type {Row} from '../Row';

const multiInsertTransformer = (rows: Row[]): SqlFragment => {
    if (rows.length <= 0) {
        throw new Error('Cannot format multi insert for no rows.');
    }
    const columnNames = Object.keys(rows[0]).map(snakeCase);

    return SQL`($columnNames${columnNames}) VALUES $valuesTable${rows}`;
};

export default multiInsertTransformer;
