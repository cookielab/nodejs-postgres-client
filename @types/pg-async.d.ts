declare module 'pg-async/lib/sql' {
    import {QueryConfig} from 'pg';

    export class SqlFragment implements QueryConfig {
        name?: string;
        text: string;
        values: any[];
        constructor(templateParts: string[], templateValues: any[]);
        toString(): string;
    }

    namespace SQL {
        type Transformer = (value: any) => any;

        const _transforms: {[key: string]: Transformer};
        function registerTransform(name1: string, transform: Transformer): undefined;
        function registerTransform(name1: string, name2: string, transform: Transformer): undefined;
    }

    function SQL(parts: TemplateStringsArray | SqlFragment, ...values: any[]): SqlFragment;

    export default SQL;
}

declare module 'pg-async' {
    import SQL from 'pg-async/lib/sql';

    export {SQL};
}
