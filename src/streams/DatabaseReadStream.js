// @flow

import QueryStream from 'pg-query-stream';

type CallbackResult = void | Promise<void>;
type Callback = () => CallbackResult;

const processCallback = async (callback: ?Callback): Promise<void> => {
    if (callback != null) {
        await callback();
    }
};

export default class DatabaseReadStream extends QueryStream {
    close(callback?: Callback): Promise<void> {
        return new Promise((resolve: () => void, reject: (Error) => void): void => {
            try {
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
