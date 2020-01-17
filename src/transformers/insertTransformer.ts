import {Row} from '../Row';
import SQL, {SqlFragment} from 'pg-async/lib/sql';

const insertTransformer = <T extends Row>(row: T): SqlFragment => {
	return SQL`$multiInsert${[row]}`;
};

export default insertTransformer;
