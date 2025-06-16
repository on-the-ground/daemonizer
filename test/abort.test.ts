import { describe, it, expect } from "vitest";
import { timeoutError, withAbort, withTimeout } from "../src/abort";

const customException = new DOMException("haha", "haha");

describe("withAbort", () => {
  it("returns the original promise if no signal is passed", async () => {
    const result = await withAbort(Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("rejects if signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort(customException);
    await expect(
      withAbort(Promise.resolve("fail"), controller.signal)
    ).rejects.toBe(customException);
  });

  it("rejects if signal aborts while pending", async () => {
    const controller = new AbortController();
    const promise = new Promise((resolve) => setTimeout(resolve, 100));
    const result = withAbort(promise, controller.signal);
    controller.abort(customException);
    await expect(result).rejects.toBe(customException);
  });
});

describe("withTimeout", () => {
  it("should resolve before timeout", async () => {
    const result = await withTimeout(async (signal) => {
      await sleep(50, signal);
      return "success";
    }, 100);
    expect(result).toBe("success");
  });

  it("should reject after timeout", async () => {
    try {
      await withTimeout(async (signal) => {
        await sleep(100, signal);
        return "fail";
      }, 50);
      throw new Error("should not reach here");
    } catch (err) {
      expect(err).toBe(timeoutError);
    }
  });

  it("should respect external abort signal", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(customException), 30);

    try {
      await withTimeout(
        async (signal) => {
          await sleep(150, signal); // longer than both
          return "fail";
        },
        100, // longer than external abort
        controller.signal
      );
      throw new Error("should not reach here");
    } catch (err) {
      expect(err).toBe(customException);
    }
  });
});

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException());
        },
        { once: true }
      );
    }
  });
}
