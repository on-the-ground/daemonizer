import { describe, it, expect } from "vitest";
import { TaskGroup } from "../src/task_group";

describe("TaskGroup", () => {
  it("should resolve immediately if count is zero", async () => {
    const tg = new TaskGroup();
    await expect(tg.wait()).resolves.toBeUndefined();
  });

  it("should wait until all tasks are done", async () => {
    const tg = new TaskGroup();
    tg.add(2);

    let resolved = false;
    const p = tg.wait().then(() => {
      resolved = true;
    });

    // Should not resolve yet
    expect(resolved).toBe(false);

    tg.done();
    expect(resolved).toBe(false);

    tg.done();
    await p;
    expect(resolved).toBe(true);
  });

  it("should resolve immediately after all done", async () => {
    const tg = new TaskGroup();
    tg.add(1);
    tg.done();
    await expect(tg.wait()).resolves.toBeUndefined();
  });
});
