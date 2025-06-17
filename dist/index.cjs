'use strict';

const abortError = new DOMException("Aborted", "AbortError");
const timeoutError = new DOMException("Timeout", "AbortError");
/** * Wraps a promise with an AbortSignal to allow it to be aborted.
 * If the signal is already aborted, it rejects immediately.
 * If the signal aborts while the promise is pending, it rejects with an ErrAborted error.
 *
 * @param signal - An AbortSignal to monitor for abortion.
 * @returns A function that takes a promise and returns a new promise that can be aborted.
 */
const withAbort = (promise, signal) => {
    if (!signal)
        return promise;
    if (signal.aborted)
        return Promise.reject(signal.reason);
    let onAbort;
    const abortPromise = new Promise((_, reject) => {
        onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
    });
    return Promise.race([promise, abortPromise]).finally(() => {
        signal.removeEventListener("abort", onAbort);
    });
};
const withTimeout = async (callback, timeout, externalSignal) => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
        timeoutController.abort(timeoutError);
    }, timeout);
    try {
        const signal = externalSignal
            ? mergeAbortSignals([externalSignal, timeoutController.signal])
            : timeoutController.signal;
        return await withAbort(callback(signal), signal);
    }
    finally {
        clearTimeout(timeoutId);
    }
};
function mergeAbortSignals(signals) {
    const controller = new AbortController();
    const onAbort = () => {
        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                break; // ✅ 첫 번째 aborted signal만 사용
            }
        }
        for (const signal of signals) {
            signal.removeEventListener("abort", onAbort);
        }
    };
    for (const signal of signals) {
        if (signal.aborted) {
            // 이미 aborted된 경우 바로 처리
            controller.abort(signal.reason);
            return controller.signal;
        }
        signal.addEventListener("abort", onAbort);
    }
    return controller.signal;
}

var _a;
class ErrZeroCapacity extends Error {
    constructor() {
        super("Capacity must be greater than 0");
        this.name = new.target.name;
    }
}
const errZeroCapacity = new ErrZeroCapacity();
const Opening = Symbol("Opening");
/** * A bounded queue that allows asynchronous producers and consumers to interact.
 * It supports pushing items, closing the queue, and iterating over the items.
 * If the queue is full, producers will wait until space is available or fail fast.
 * If the queue is empty, consumers will wait until items are available.
 * If the queue is closed, consumers will receive a done signal.
 */
class BoundedQueue {
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = [];
        this.waitingConsumers = [];
        this.waitingProducers = [];
        this.closed = false;
        this.tryPushInternal = (value) => {
            if (this.waitingConsumers.length > 0) {
                const resolve = this.waitingConsumers.shift();
                resolve({ value, done: false });
                return true;
            }
            if (this.buffer.length < this.capacity) {
                this.buffer.push(value);
                return true;
            }
            return false; // overflow
        };
        /** * Attempts to push a value into the queue without waiting.
         * Returns true if successful, false if the queue is full or closed.
         */
        this.tryPush = (value) => {
            if (this.closed)
                return false;
            return this.tryPushInternal(value);
        };
        /** * Pushes a value into the queue, waiting if necessary until space is available.
         * Returns true if successful, false if the queue is closed.
         */
        this.push = async (value) => {
            while (true) {
                if (this.closed)
                    return false;
                if (this.tryPushInternal(value)) {
                    return true;
                }
                await new Promise((resolve) => {
                    this.waitingProducers.push(resolve);
                });
            }
        };
        /** * Closes the queue, signaling that no more items will be added.
         * All waiting consumers will be resolved with a done signal.
         * Waiting producers will be resolved with an Opening signal.
         */
        this.close = () => {
            if (this.closed)
                return;
            this.closed = true;
            for (const resolve of this.waitingConsumers) {
                resolve({ value: undefined, done: true });
            }
            this.waitingConsumers.length = 0;
            for (const resolve of this.waitingProducers) {
                resolve(Opening);
            }
            this.waitingProducers.length = 0;
        };
        this.nextInternal = () => {
            if (this.waitingProducers.length > 0) {
                const resolve = this.waitingProducers.shift();
                resolve(Opening);
            }
            if (this.buffer.length > 0) {
                return Promise.resolve({ value: this.buffer.shift(), done: false });
            }
            if (this.closed) {
                return Promise.resolve({ value: undefined, done: true });
            }
            return new Promise((resolve) => {
                this.waitingConsumers.push(resolve);
            });
        };
        /** * Returns the next item from the queue, waiting if necessary until an item is available.
         * If the queue is closed, it resolves with a done signal.
         */
        this.next = async () => {
            return await this.nextInternal();
        };
        /** * Returns an async iterator for the queue, allowing iteration over its items.
         * The iterator will yield items until the queue is closed.
         */
        this[_a] = () => {
            const boundedqueue = this;
            return {
                async next() {
                    return await boundedqueue.nextInternal();
                },
            };
        };
        if (capacity <= 0)
            throw errZeroCapacity;
    }
    get isClosed() {
        return this.closed;
    }
    get size() {
        return this.buffer.length;
    }
    get isEmpty() {
        return this.buffer.length === 0;
    }
}
_a = Symbol.asyncIterator;

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
async function launchEventLoop(signal, taskGroup, eventStream, handleEvent, loopIntervalMs = 8, strictInterval = false) {
    const yieldScheduler = new MacroTaskYielder(loopIntervalMs);
    const iterator = eventStream[Symbol.asyncIterator]();
    taskGroup.add(1);
    try {
        loop: while (true) {
            let result;
            try {
                result = await withAbort(iterator.next(), signal);
            }
            catch (err) {
                if (err instanceof DOMException)
                    break;
                throw err;
            }
            if (result.done)
                break;
            try {
                await (strictInterval
                    ? withTimeout((sig) => handleEvent(sig, result.value), loopIntervalMs, signal)
                    : withAbort(handleEvent(signal, result.value), signal));
            }
            catch (err) {
                if (err === timeoutError) {
                    // continue
                }
                else if (err instanceof DOMException) {
                    break loop; // Break the loop iff it is aborted from outside
                }
                else {
                    throw err;
                }
            }
            // Yield control to allow other macro tasks to run.
            await yieldScheduler.yieldByInterval();
        }
    }
    finally {
        taskGroup.done();
    }
}

/**
 * TaskGroup is a utility class that allows managing a group of tasks
 * and waiting for all of them to complete. It is useful for coordinating multiple asynchronous
 * operations and ensuring that all tasks are done before proceeding.
 */
class TaskGroup {
    constructor() {
        this.count = 0;
        this.waiters = [];
    }
    add(n) {
        this.count += n;
    }
    done() {
        this.count -= 1;
        if (this.count === 0) {
            this.waiters.forEach((r) => r());
            this.waiters.length = 0;
        }
    }
    async wait() {
        if (this.count === 0)
            return Promise.resolve();
        return new Promise((resolve) => {
            this.waiters.push(resolve);
        });
    }
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
 */
class Daemon {
    constructor(signal, handleEvent, bufferSize = 10) {
        /** * Closes the event handler, stopping it from accepting new events.
         * It waits for the event loop to finish processing all events before resolving.
         */
        this.close = async () => {
            this.eventStream.close();
            // Wait for the event loop to finish processing.
            await this.tg.wait();
        };
        /** * Pushes an event to the event stream.
         * Returns true if the event was successfully pushed, false if the event handler is closed.
         *
         * @param event - The event to push to the event stream.
         */
        this.pushEvent = async (event) => {
            return this.eventStream.push(event);
        };
        const tg = new TaskGroup();
        const eventStream = new BoundedQueue(bufferSize);
        // launchEventLoop is intentionally fire-and-forget.
        // The lifecycle is tracked via the provided TaskGroup.
        launchEventLoop(signal, tg, eventStream, handleEvent);
        this.eventStream = eventStream;
        this.tg = tg;
    }
}

exports.BoundedQueue = BoundedQueue;
exports.Daemon = Daemon;
exports.ErrZeroCapacity = ErrZeroCapacity;
exports.MacroTaskYielder = MacroTaskYielder;
exports.TaskGroup = TaskGroup;
exports.abortError = abortError;
exports.errZeroCapacity = errZeroCapacity;
exports.launchEventLoop = launchEventLoop;
exports.timeoutError = timeoutError;
exports.withAbort = withAbort;
exports.withTimeout = withTimeout;
//# sourceMappingURL=index.cjs.map
