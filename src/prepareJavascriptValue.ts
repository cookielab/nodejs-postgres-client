type OriginalPrepareValue = (value: unknown) => Buffer | string | null;

type MatchValue = (value: unknown) => boolean;
type ConvertValue = (value: unknown) => Buffer | string | null;

export interface JavascriptType {
	readonly match: MatchValue;
	readonly convert: ConvertValue;
}

const prepareJavascriptValue = (
	originalPrepareValue: OriginalPrepareValue,
	customTypes: readonly JavascriptType[],
	value: unknown
): Buffer | string | null => {
	const types: readonly JavascriptType[] = customTypes.filter((type: JavascriptType) => type.match(value));

	if (types.length === 0) {
		return originalPrepareValue(value);
	}

	if (types.length !== 1) {
		const valueString: string | number = typeof value !== 'string' && typeof value !== 'number' ? JSON.stringify(value) : value;
		throw new Error(`There are more than one value converters for "${valueString}".`);
	}

	const [type] = types;

	return type.convert(value);
};

export default prepareJavascriptValue;
