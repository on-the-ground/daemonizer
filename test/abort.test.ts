import { describe, it, expect } from "vitest";
import { withAbort, errAborted } from "../src/abort";

describe("withAbort", () => {
  it("returns the original promise if no signal is passed", async () => {
    const result = await withAbort()(Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("rejects if signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      withAbort(controller.signal)(Promise.resolve("fail"))
    ).rejects.toBe(errAborted);
  });

  it("rejects if signal aborts while pending", async () => {
    const controller = new AbortController();
    const promise = new Promise((resolve) => setTimeout(resolve, 100));
    const result = withAbort(controller.signal)(promise);
    controller.abort();
    await expect(result).rejects.toBe(errAborted);
  });
});
