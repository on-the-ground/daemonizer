/**
 * MacroTaskYielder is a utility class that allows yielding control back to the event loop
 * at specified intervals. This is useful in long-running tasks to prevent blocking the event loop
 * and allow other tasks to run.
 */
export declare class MacroTaskYielder {
    private readonly interval;
    private lastYield;
    constructor(interval?: number);
    yieldByInterval: () => Promise<void>;
}
