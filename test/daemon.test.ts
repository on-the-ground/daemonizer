import { describe, it, expect, vi } from "vitest";
import { Daemon } from "../src/daemon";

describe("Daemon", () => {
  it("processes events correctly and shuts down", async () => {
    const handled: number[] = [];
    const controller = new AbortController();

    const handleFn = async (_signal, event: number) => {
      handled.push(event);
    };

    const daemon = new Daemon<number>(controller.signal, handleFn, 3);

    await daemon.pushEvent(1);
    await daemon.pushEvent(2);
    await daemon.pushEvent(3);

    // Give the loop some time to process the events
    await new Promise((r) => setTimeout(r, 10));

    await daemon.close();

    expect(handled).toEqual([1, 2, 3]);
  });

  it("stops accepting new events after close", async () => {
    const abortController = new AbortController();
    const daemon = new Daemon<number>(
      abortController.signal,
      async () => {},
      1
    );

    await daemon.pushEvent(1);
    await daemon.close();

    const result = await daemon.pushEvent(2);
    expect(result).toBe(false);
  });
});
