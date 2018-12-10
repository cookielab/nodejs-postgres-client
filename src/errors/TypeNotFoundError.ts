class TypeNotFoundError extends Error {
    constructor(typeName: string) {
        super(`Type "${typeName}" not found.`);
    }
}

export default TypeNotFoundError;
