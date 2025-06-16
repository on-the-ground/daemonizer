"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundedQueue = exports.errZeroCapacity = exports.ErrZeroCapacity = void 0;
class ErrZeroCapacity extends Error {
    constructor() {
        super("Capacity must be greater than 0");
        this.name = new.target.name;
    }
}
exports.ErrZeroCapacity = ErrZeroCapacity;
exports.errZeroCapacity = new ErrZeroCapacity();
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
            throw exports.errZeroCapacity;
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
exports.BoundedQueue = BoundedQueue;
_a = Symbol.asyncIterator;
//# sourceMappingURL=bounded_queue.js.map