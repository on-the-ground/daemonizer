export const abortError = new DOMException("Aborted", "AbortError");
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

export const withTimeout = async <T>(
  handle: (signal: AbortSignal) => Promise<T>,
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
    return await withAbort(handle(signal), signal);
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
