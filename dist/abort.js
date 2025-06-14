"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAbort = exports.errAborted = exports.ErrAborted = void 0;
class ErrAborted extends Error {
    constructor() {
        super(`signal aborted`);
        this.name = new.target.name;
    }
}
exports.ErrAborted = ErrAborted;
exports.errAborted = new ErrAborted();
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
const withAbort = (signal) => (promise) => {
    if (!signal)
        return promise;
    if (signal.aborted)
        return Promise.reject(exports.errAborted);
    return Promise.race([
        promise,
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(exports.errAborted), {
            once: true,
        })),
    ]);
};
exports.withAbort = withAbort;
//# sourceMappingURL=abort.js.map