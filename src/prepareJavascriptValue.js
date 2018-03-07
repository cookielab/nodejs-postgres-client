// @flow
/* eslint-disable flowtype/no-weak-types */

type OriginalPrepareValue = (value: any, seen?: any[]) => any;

type MatchValue = (any) => boolean;
type ConvertValue = (any) => ?string;

export type JavascriptType = {
    match: MatchValue,
    convert: ConvertValue,
};

const prepareJavascriptValue = (
    originalPrepareValue: OriginalPrepareValue,
    customTypes: JavascriptType[],
    value: any,
    seen?: any[]
): any => {
    const types = customTypes.filter(({match}: {match: MatchValue}) => match(value));

    if (types.length === 0) {
        return originalPrepareValue(value, seen);
    }

    if (types.length !== 1) {
        throw new Error(`There are more than one value converters for "${value}".`);
    }

    const [type] = types;
    return type.convert(value);
};

export default prepareJavascriptValue;
