export declare class ErrAborted extends Error {
    constructor();
}
export declare const errAborted: ErrAborted;
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
export declare const withAbort: (signal?: AbortSignal) => <T>(promise: Promise<T>) => Promise<T>;
