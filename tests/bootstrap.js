import {Client, Pool} from 'pg';

/* istanbul ignore next */
const connectionConfig = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'postgres_client',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'postgres_client',
    port: process.env.DATABASE_PORT || 5432,
};

const createClient = () => new Client(connectionConfig);

const createPool = (options = {}) => new Pool(Object.assign({}, connectionConfig, options));

export {
    createClient,
    createPool,
};
