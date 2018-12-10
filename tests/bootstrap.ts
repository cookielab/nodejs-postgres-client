import {Pool, PoolConfig} from 'pg';

const connectionConfig: PoolConfig = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER || 'postgres_client',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'postgres_client',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10) || 5432,
};

const createPool = (options: PoolConfig = {}) => new Pool(Object.assign({}, connectionConfig, options));

export {
    createPool,
};
