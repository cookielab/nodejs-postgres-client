// @flow

import {mapKeys, snakeCase} from 'lodash';

type ValueObject = {[key: string]: any}; // eslint-disable-line flowtype/no-weak-types

const convertKeys = (values: ValueObject): ValueObject => {
    const mapper = (value: mixed, key: string): string => snakeCase(key);
    return mapKeys(values, mapper);
};

export default convertKeys;
