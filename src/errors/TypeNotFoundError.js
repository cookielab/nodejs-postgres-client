// @flow

class TypeNotFoundError extends Error {
    constructor(typeName: string): void {
        super(`Type "${typeName}" not found.`);
    }
}

export default TypeNotFoundError;
