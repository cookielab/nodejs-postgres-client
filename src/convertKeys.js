// @flow

import {mapKeys, snakeCase} from 'lodash';
import type {Row} from './Row';

const convertKeys = (values: Row): Row => {
    const mapper = (value: mixed, key: string): string => snakeCase(key);
    return mapKeys(values, mapper);
};

export default convertKeys;
