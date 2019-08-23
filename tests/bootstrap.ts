import {Pool, PoolConfig} from 'pg';

const variable = (name: string, defaultValue: string): string => {
	const value = process.env[name]; // eslint-disable-line no-process-env

	return value != null ? value : defaultValue;
};

const connectionConfig: PoolConfig = {
	host: variable('DATABASE_HOST', '127.0.0.1'),
	user: variable('DATABASE_USER', 'postgres_client'),
	password: variable('DATABASE_PASSWORD', ''),
	database: variable('DATABASE_NAME', 'postgres_client'),
	port: Number.parseInt(variable('DATABASE_PORT', '5432'), 10),
};

const createPool = (options: PoolConfig = {}): Pool => new Pool(Object.assign({}, connectionConfig, options));

export {
	createPool,
};
