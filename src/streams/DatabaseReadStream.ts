import QueryStream = require('pg-query-stream'); // eslint-disable-line @typescript-eslint/no-require-imports

export default class DatabaseReadStream extends QueryStream {
	public _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
		// eslint-disable-next-line no-underscore-dangle
		super._destroy(error, (callbackError?: Error | null): void => {
			this.emit('close');
			callback(callbackError);
		});
	}
}
