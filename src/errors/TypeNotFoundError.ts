class TypeNotFoundError extends Error {
	public constructor(typeName: string) {
		super(`Type "${typeName}" not found.`);
	}
}

export default TypeNotFoundError;
