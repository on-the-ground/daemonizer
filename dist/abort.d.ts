/**
 * A standard `DOMException` used to signal that an operation was aborted due to a timeout.
 *
 * This error uses the `"AbortError"` name so it integrates cleanly with `AbortSignal`-based cancellation.
 * It is returned by `withTimeout()` when the specified timeout duration elapses.
 *
 * @example
 * try {
 *   await withTimeout(doSomething, 1000);
 * } catch (err) {
 *   if (err === timeoutError) {
 *     console.warn("Operation timed out");
 *   }
 * }
 */
export declare const timeoutError: DOMException;
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
export declare const withAbort: <T>(promise: Promise<T>, signal?: AbortSignal) => Promise<T>;
/**
 * Runs an async operation with a timeout and optional external AbortSignal.
 *
 * If the operation does not complete within the given timeout,
 * it is aborted with a `timeoutError`. If an external `AbortSignal` is provided
 * and it fires first, the operation is also aborted with that signal's reason.
 *
 * Internally, it merges the external signal (if provided) with an internal timeout-based signal.
 * Then it wraps the callback execution with `withAbort()` to ensure proper cancellation handling.
 *
 * @template T - The type of the resolved value.
 * @param callback - An async function that accepts an `AbortSignal` and returns a `Promise<T>`.
 *                   This function is expected to respect the signal and abort early if triggered.
 * @param timeout - Timeout in milliseconds after which the operation will be aborted.
 * @param externalSignal - Optional `AbortSignal` to combine with the timeout signal.
 *                         Abortion from either will cancel the operation.
 * @returns A `Promise<T>` that resolves if the callback completes within time,
 *          or rejects with `timeoutError` or the external signal's reason.
 */
export declare const withTimeout: <T>(callback: (signal: AbortSignal) => Promise<T>, timeout: number, externalSignal?: AbortSignal) => Promise<T>;
export declare function mergeAbortSignals(signals: AbortSignal[]): AbortSignal;
