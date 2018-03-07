// @flow

import SQL, {SqlFragment} from 'pg-async/lib/sql';

type valueType = string | number | boolean;

const valueListTransformer = (values: valueType[]): SqlFragment => {
    const sqlValues = values.map((value: valueType) => SQL`${value}`);

    const parts = sqlValues.map((): string => ', ');
    parts[0] = ''; // there is no comma in front of the first value

    return new SqlFragment(parts, sqlValues);
};

export default valueListTransformer;
