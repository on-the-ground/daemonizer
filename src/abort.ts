export class ErrAborted extends Error {
  constructor() {
    super(`signal aborted`);
    this.name = new.target.name;
  }
}
export const errAborted = new ErrAborted();

/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
export const withAbort =
  (signal?: AbortSignal) =>
  <T>(promise: Promise<T>): Promise<T> => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(errAborted);

    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        signal.addEventListener("abort", () => reject(errAborted), {
          once: true,
        })
      ),
    ]);
  };
