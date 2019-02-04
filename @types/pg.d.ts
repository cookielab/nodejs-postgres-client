declare module 'pg/lib/utils' {
    export function prepareValue(value: unknown): Buffer | string | null;
}
