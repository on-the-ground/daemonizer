import { describe, it, expect } from "@jest/globals";
import { BoundedQueue, errZeroCapacity } from "../src/bounded_queue";

describe("BoundedQueue", () => {
  it("throws on zero capacity", () => {
    expect(() => new BoundedQueue(0)).toThrow(errZeroCapacity);
  });

  it("pushes and pulls values", async () => {
    const boundedqueue = new BoundedQueue<number>(2);
    boundedqueue.tryPush(1);
    boundedqueue.tryPush(2);

    const it = boundedqueue[Symbol.asyncIterator]();
    expect((await it.next()).value).toBe(1);
    expect((await it.next()).value).toBe(2);
  });

  it("waits for future value", async () => {
    const boundedqueue = new BoundedQueue<number>(1);
    const it = boundedqueue[Symbol.asyncIterator]();
    const promise = it.next();
    boundedqueue.tryPush(42);
    const result = await promise;
    expect(result.value).toBe(42);
  });

  it("handles close properly", async () => {
    const boundedqueue = new BoundedQueue<number>(1);
    boundedqueue.tryPush(42);
    boundedqueue.close();
    const it = boundedqueue[Symbol.asyncIterator]();
    const result = await it.next();
    expect(result.value).toBe(42);
    const result2 = await it.next();
    expect(result2.done).toBe(true);
  });
});
