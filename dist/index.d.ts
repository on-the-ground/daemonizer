/**
 * A standard `DOMException` used to signal that an operation was aborted due to a timeout.
 *
 * This error uses the `"AbortError"` name so it integrates cleanly with `AbortSignal`-based cancellation.
 * It is returned by `withTimeout()` when the specified timeout duration elapses.
 *
 * @example
 * try {
 *   await withTimeout(doSomething, 1000);
 * } catch (err) {
 *   if (err === timeoutError) {
 *     console.warn("Operation timed out");
 *   }
 * }
 */
declare const timeoutError: DOMException;
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
declare const withAbort: <T>(promise: Promise<T>, signal?: AbortSignal) => Promise<T>;
/**
 * Runs an async operation with a timeout and optional external AbortSignal.
 *
 * If the operation does not complete within the given timeout,
 * it is aborted with a `timeoutError`. If an external `AbortSignal` is provided
 * and it fires first, the operation is also aborted with that signal's reason.
 *
 * Internally, it merges the external signal (if provided) with an internal timeout-based signal.
 * Then it wraps the callback execution with `withAbort()` to ensure proper cancellation handling.
 *
 * @template T - The type of the resolved value.
 * @param callback - An async function that accepts an `AbortSignal` and returns a `Promise<T>`.
 *                   This function is expected to respect the signal and abort early if triggered.
 * @param timeout - Timeout in milliseconds after which the operation will be aborted.
 * @param externalSignal - Optional `AbortSignal` to combine with the timeout signal.
 *                         Abortion from either will cancel the operation.
 * @returns A `Promise<T>` that resolves if the callback completes within time,
 *          or rejects with `timeoutError` or the external signal's reason.
 */
declare const withTimeout: <T>(callback: (signal: AbortSignal) => Promise<T>, timeout: number, externalSignal?: AbortSignal) => Promise<T>;
declare function mergeAbortSignals(signals: AbortSignal[]): AbortSignal;

declare class ErrZeroCapacity extends Error {
    constructor();
}
declare const errZeroCapacity: ErrZeroCapacity;
/** * A bounded queue that allows asynchronous producers and consumers to interact.
 * It supports pushing items, closing the queue, and iterating over the items.
 * If the queue is full, producers will wait until space is available or fail fast.
 * If the queue is empty, consumers will wait until items are available.
 * If the queue is closed, consumers will receive a done signal.
 */
declare class BoundedQueue<T> implements AsyncIterable<T> {
    private readonly capacity;
    private readonly buffer;
    private readonly waitingConsumers;
    private readonly waitingProducers;
    private closed;
    constructor(capacity: number);
    private tryPushInternal;
    /** * Attempts to push a value into the queue without waiting.
     * Returns true if successful, false if the queue is full or closed.
     */
    tryPush: (value: T) => boolean;
    /** * Pushes a value into the queue, waiting if necessary until space is available.
     * Returns true if successful, false if the queue is closed.
     */
    push: (value: T) => Promise<boolean>;
    /** * Closes the queue, signaling that no more items will be added.
     * All waiting consumers will be resolved with a done signal.
     * Waiting producers will be resolved with an Opening signal.
     */
    close: () => void;
    private nextInternal;
    /** * Returns the next item from the queue, waiting if necessary until an item is available.
     * If the queue is closed, it resolves with a done signal.
     */
    next: () => Promise<IteratorResult<T>>;
    /** * Returns an async iterator for the queue, allowing iteration over its items.
     * The iterator will yield items until the queue is closed.
     */
    [Symbol.asyncIterator]: () => AsyncIterator<T>;
    get isClosed(): boolean;
    get size(): number;
    get isEmpty(): boolean;
}

/**
 * TaskGroup is a utility class that allows managing a group of tasks
 * and waiting for all of them to complete. It is useful for coordinating multiple asynchronous
 * operations and ensuring that all tasks are done before proceeding.
 */
declare class TaskGroup {
    private count;
    private waiters;
    add(n: number): void;
    done(): void;
    wait(): Promise<void>;
}

/** * Daemon is a utility class that manages an event loop processing events
 * from a bounded queue. It allows pushing events to the queue and handles them
 * asynchronously using a provided handler function.
 * It supports graceful shutdown and ensures that all events are processed before closing.
 *
 * @template E - The type of events to handle.
 * @param signal - An AbortSignal to allow cancellation of the event loop.
 * @param handleEvent - A function that processes each event. It should return a
 * Promise that resolves when the event is handled.
 * @param bufferSize - The size of the bounded queue buffer. Defaults to 10.
 * @param loopIntervalMs - Interval in milliseconds used for two purposes:
 *   (1) to periodically yield control to the JS event loop for fairness,
 *   (2) if `strictInterval` is enabled, to enforce a per-event processing timeout.
 *   Defaults to 8ms (roughly 60fps frame budget).
 * @param strictInterval - If true, each event handler must complete within
 *   `loopIntervalMs`, otherwise it is aborted. If false, handlers may take longer
 *   but yielding still happens at the interval. Defaults to false.
 */
declare class Daemon<E> {
    readonly tg: TaskGroup;
    readonly eventStream: BoundedQueue<E>;
    constructor(signal: AbortSignal, handleEvent: (signal: AbortSignal, event: E) => Promise<void>, bufferSize?: number, loopIntervalMs?: number, strictInterval?: boolean);
    /** * Closes the event handler, stopping it from accepting new events.
     * It waits for the event loop to finish processing all events before resolving.
     */
    close: () => Promise<void>;
    /** * Pushes an event to the event stream.
     * Returns true if the event was successfully pushed, false if the event handler is closed.
     *
     * @param event - The event to push to the event stream.
     */
    pushEvent: (event: E) => Promise<boolean>;
}

/**
 * Launches an event loop that processes events from an async iterable.
 * It handles each event using the provided handler function and yields control
 * to allow other macro tasks to run periodically.
 *
 * @param signal - An AbortSignal to allow cancellation of the loop.
 * @param taskGroup - A TaskGroup to manage the lifecycle of the loop.
 * @param eventStream - An async iterable of events to process.
 * @param handleEvent - A function that processes each event.
 * @param loopIntervalMs - Interval in milliseconds used for two purposes:
 *   (1) to periodically yield control to the JS event loop for fairness,
 *   (2) if `strictInterval` is enabled, to enforce a per-event processing timeout.
 *   Defaults to 8ms (roughly 60fps frame budget).
 * @param strictInterval - If true, each event handler must complete within
 *   `loopIntervalMs`, otherwise it is aborted. If false, handlers may take longer
 *   but yielding still happens at the interval. Defaults to false.
 */
declare function launchEventLoop<T>(signal: AbortSignal, taskGroup: TaskGroup, eventStream: AsyncIterable<T>, handleEvent: (signal: AbortSignal, event: T) => Promise<void>, loopIntervalMs?: number, strictInterval?: boolean): Promise<void>;

/**
 * MacroTaskYielder is a utility class that allows yielding control back to the event loop
 * at specified intervals. This is useful in long-running tasks to prevent blocking the event loop
 * and allow other tasks to run.
 */
declare class MacroTaskYielder {
    private readonly interval;
    private lastYield;
    constructor(interval?: number);
    yieldByInterval: () => Promise<void>;
}

export { BoundedQueue, Daemon, ErrZeroCapacity, MacroTaskYielder, TaskGroup, errZeroCapacity, launchEventLoop, mergeAbortSignals, timeoutError, withAbort, withTimeout };
