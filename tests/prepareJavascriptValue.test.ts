import prepareJavascriptValue from '../src/prepareJavascriptValue';

describe('prepareJavascriptValue', () => {
	it('calls the original prepareValue function when there are no custom types', () => {
		const value: readonly unknown[] = [];

		const originalPrepareValueMock = jest.fn();

		prepareJavascriptValue(
			originalPrepareValueMock,
			[],
			value,
		);

		expect(originalPrepareValueMock).toHaveBeenCalledTimes(1);
		expect(originalPrepareValueMock).toHaveBeenCalledWith(value);
	});

	it('calls the original prepareValue function when no custom type matches the value', () => {
		const value: readonly unknown[] = [];

		const originalPrepareValueMock = jest.fn();
		const match = jest.fn(() => false);
		const convert = jest.fn();

		prepareJavascriptValue(
			originalPrepareValueMock,
			[
				{match, convert},
			],
			value,
		);

		expect(match).toHaveBeenCalledTimes(1);
		expect(match).toHaveBeenCalledWith(value);
		expect(convert).not.toHaveBeenCalled();

		expect(originalPrepareValueMock).toHaveBeenCalledTimes(1);
		expect(originalPrepareValueMock).toHaveBeenCalledWith(value);
	});

	it('calls a custom type converter if the type matches the value', () => {
		const value: readonly unknown[] = [];
		const returnValue: string = '';

		const originalPrepareValueMock = jest.fn();
		const match = jest.fn(() => true);
		const convert = jest.fn(() => returnValue);

		const result = prepareJavascriptValue(
			originalPrepareValueMock,
			[
				{match, convert},
			],
			value,
		);
		expect(result).toBe(returnValue);

		expect(match).toHaveBeenCalledTimes(1);
		expect(match).toHaveBeenCalledWith(value);

		expect(convert).toHaveBeenCalledTimes(1);
		expect(convert).toHaveBeenCalledWith(value);

		expect(originalPrepareValueMock).not.toHaveBeenCalled();
	});

	it('throws an error if more than one custom type match the value (simple type)', () => {
		const originalPrepareValueMock = jest.fn();
		const match = jest.fn(() => true);
		const convert = jest.fn();

		expect(() => prepareJavascriptValue(
			originalPrepareValueMock,
			[
				{match, convert},
				{match, convert},
			],
			42,
		)).toThrow('There are more than one value converters for "42".');
	});

	it('throws an error if more than one custom type match the value (complex type)', () => {
		const originalPrepareValueMock = jest.fn();
		const match = jest.fn(() => true);
		const convert = jest.fn();

		expect(() => prepareJavascriptValue(
			originalPrepareValueMock,
			[
				{match, convert},
				{match, convert},
			],
			{foo: 'bar'} as const,
		)).toThrow('There are more than one value converters for "{"foo":"bar"}".');
	});
});
