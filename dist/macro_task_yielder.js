"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroTaskYielder = void 0;
/**
 * MacroTaskYielder is a utility class that allows yielding control back to the event loop
 * at specified intervals. This is useful in long-running tasks to prevent blocking the event loop
 * and allow other tasks to run.
 */
class MacroTaskYielder {
    constructor(interval = 8) {
        this.interval = interval;
        this.yieldByInterval = async () => {
            const now = performance.now();
            if (now - this.lastYield < this.interval)
                return;
            await new Promise((resolve) => setTimeout(() => {
                this.lastYield = performance.now();
                resolve();
            }));
        };
        this.lastYield = performance.now();
    }
}
exports.MacroTaskYielder = MacroTaskYielder;
//# sourceMappingURL=macro_task_yielder.js.map