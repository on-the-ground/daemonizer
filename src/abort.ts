export class ErrAborted extends Error {
  constructor() {
    super(`signal aborted`);
    this.name = new.target.name;
  }
}
export const errAborted = new ErrAborted();

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
