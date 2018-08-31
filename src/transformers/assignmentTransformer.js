// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import {snakeCase} from 'lodash';
import sqlFragmentMapper from './sqlFragmentMapper';
import type {Row} from '../Row';

const assignmentTransformer = (row: Row): SqlFragment => {
    return sqlFragmentMapper(
        Object.keys(row),
        (key: string) => SQL`$identifier${snakeCase(key)} = ${row[key]}`,
        ',\n'
    );
};

export default assignmentTransformer;
