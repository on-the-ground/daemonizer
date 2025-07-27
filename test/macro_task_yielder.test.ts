import { describe, it, expect } from "@jest/globals";
import { MacroTaskYielder } from "../src/macro_task_yielder";

describe("MacroTaskYielder", () => {
  it("should not yield if interval has not passed", async () => {
    const yielder = new MacroTaskYielder(50); // 50ms interval
    const before = performance.now();
    await yielder.yieldByInterval();
    const after = performance.now();
    expect(after - before).toBeLessThan(50); // Should not yield
  });

  it("should skip yield if interval has not passed", async () => {
    const yielder = new MacroTaskYielder(1000); // 1s
    const before = performance.now();
    await yielder.yieldByInterval();
    const after = performance.now();
    expect(after - before).toBeLessThan(10); // No real delay
  });

  it("should yield if interval has passed (observe behavior)", async () => {
    const yielder = new MacroTaskYielder(10);
    await new Promise((r) => setTimeout(r, 15)); // Ensure interval passed
    let flag = false;
    const promise = yielder.yieldByInterval().then(() => {
      flag = true;
    });
    expect(flag).toBe(false); // Should not be resolved yet
    await promise;
    expect(flag).toBe(true);
  });

  it("should reset lastYield after yielding", async () => {
    const yielder = new MacroTaskYielder(5);
    const originalLastYield = yielder["lastYield"];
    await new Promise((r) => setTimeout(r, 10));
    await yielder.yieldByInterval();
    const newLastYield = yielder["lastYield"];
    expect(newLastYield).toBeGreaterThan(originalLastYield);
  });
});
