import { describe, it, expect, vi } from "vitest";
import { Daemon } from "../src/daemon";

describe("Daemon", () => {
  it("processes events correctly and shuts down", async () => {
    const handled: number[] = [];
    const abortController = new AbortController();

    const handler = new Daemon<number>(
      abortController.signal,
      async (_signal, event) => {
        handled.push(event);
      },
      3
    );

    await handler.pushEvent(1);
    await handler.pushEvent(2);
    await handler.pushEvent(3);

    // Give the loop some time to process the events
    await new Promise((r) => setTimeout(r, 10));

    await handler.close();

    expect(handled).toEqual([1, 2, 3]);
  });

  it("stops accepting new events after close", async () => {
    const abortController = new AbortController();
    const handler = new Daemon<number>(
      abortController.signal,
      async () => {},
      1
    );

    await handler.pushEvent(1);
    await handler.close();

    const result = await handler.pushEvent(2);
    expect(result).toBe(false);
  });
});
