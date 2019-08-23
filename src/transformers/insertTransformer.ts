import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';

const insertTransformer = (row: Row): SqlFragment => {
	return SQL`$multiInsert${[row]}`;
};

export default insertTransformer;
