declare module 'pg-async/lib/sql' {
    import {QueryConfig} from 'pg';

    export class SqlFragment implements QueryConfig {
        readonly name?: string;
		readonly text: string;
		readonly values: any[];
        constructor(templateParts: readonly string[], templateValues: readonly any[]);
        toString(): string;
    }

    namespace SQL {
        type Transformer = (value: any) => any;

        const _transforms: {readonly [key: string]: Transformer};
        function registerTransform(name1: string, transform: Transformer): undefined;
        function registerTransform(name1: string, name2: string, transform: Transformer): undefined;
    }

    function SQL(parts: TemplateStringsArray | SqlFragment, ...values: readonly any[]): SqlFragment;

    export default SQL;
}

declare module 'pg-async' {
    import SQL from 'pg-async/lib/sql';

    export {SQL};
}
