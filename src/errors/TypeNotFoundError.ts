class TypeNotFoundError extends Error {
	public readonly typeName: string;

	public constructor(typeName: string) {
		super(`Type "${typeName}" not found.`);
		this.typeName = typeName;
	}
}

export default TypeNotFoundError;
