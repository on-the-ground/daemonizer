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
export const timeoutError = new DOMException("Timeout", "AbortError");

/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
export const withAbort = <T>(
  promise: Promise<T>,
  signal?: AbortSignal
): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason);

  let onAbort: () => void;

  const abortPromise = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
  });

  return Promise.race([promise, abortPromise]).finally(() => {
    signal.removeEventListener("abort", onAbort);
  });
};

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
export const withTimeout = async <T>(
  callback: (signal: AbortSignal) => Promise<T>,
  timeout: number,
  externalSignal?: AbortSignal
): Promise<T> => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(timeoutError);
  }, timeout);

  try {
    const signal = externalSignal
      ? mergeAbortSignals([externalSignal, timeoutController.signal])
      : timeoutController.signal;
    return await withAbort(callback(signal), signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
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
