// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';
import type {Row} from '../Row';

const insertTransformer = (row: Row): SqlFragment => {
    return SQL`$multiInsert${[row]}`;
};

export default insertTransformer;
