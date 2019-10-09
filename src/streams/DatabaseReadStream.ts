import QueryStream = require('pg-query-stream'); // eslint-disable-line @typescript-eslint/no-require-imports

type Callback = () => Promise<void> | void;

const processCallback = async (callback: Callback | undefined): Promise<void> => {
	if (callback != null) {
		await callback();
	}
};

export default class DatabaseReadStream extends QueryStream {
	public close(callback?: Callback): Promise<void> {
		return new Promise((resolve: () => void, reject: (error: Error) => void): void => {
			try {
				// @ts-ignore pg-query-stream types does not contain close method
				super.close((): void => {
					this.emit('close');
					processCallback(callback)
						.then(resolve)
						.catch(reject);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
}
