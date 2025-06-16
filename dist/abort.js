"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = exports.withAbort = exports.timeoutError = exports.abortError = void 0;
exports.abortError = new DOMException("Aborted", "AbortError");
exports.timeoutError = new DOMException("Timeout", "AbortError");
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
const withAbort = (promise, signal) => {
    if (!signal)
        return promise;
    if (signal.aborted)
        return Promise.reject(signal.reason);
    let onAbort;
    const abortPromise = new Promise((_, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
    });
    return Promise.race([promise, abortPromise]).finally(() => {
        signal.removeEventListener("abort", onAbort);
    });
};
exports.withAbort = withAbort;
const withTimeout = async (callback, timeout, externalSignal) => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort(exports.timeoutError);
    }, timeout);
    try {
        const signal = externalSignal
            ? mergeAbortSignals([externalSignal, timeoutController.signal])
            : timeoutController.signal;
        return await (0, exports.withAbort)(callback(signal), signal);
    }
    finally {
        clearTimeout(timeoutId);
    }
};
exports.withTimeout = withTimeout;
function mergeAbortSignals(signals) {
    const controller = new AbortController();
    const onAbort = () => {
        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                break; // ✅ 첫 번째 aborted signal만 사용
            }
        }
        for (const signal of signals) {
            signal.removeEventListener("abort", onAbort);
        }
    };
    for (const signal of signals) {
        if (signal.aborted) {
            // 이미 aborted된 경우 바로 처리
            controller.abort(signal.reason);
            return controller.signal;
        }
        signal.addEventListener("abort", onAbort);
    }
    return controller.signal;
}
//# sourceMappingURL=abort.js.map