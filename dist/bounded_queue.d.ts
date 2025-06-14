export declare class ErrZeroCapacity extends Error {
    constructor();
}
export declare const errZeroCapacity: ErrZeroCapacity;
/** * A bounded queue that allows asynchronous producers and consumers to interact.
 * It supports pushing items, closing the queue, and iterating over the items.
 * If the queue is full, producers will wait until space is available or fail fast.
 * If the queue is empty, consumers will wait until items are available.
 * If the queue is closed, consumers will receive a done signal.
 */
export declare class BoundedQueue<T> implements AsyncIterable<T> {
    private readonly capacity;
    private readonly buffer;
    private readonly waitingConsumers;
    private readonly waitingProducers;
    private closed;
    constructor(capacity: number);
    private tryPushIntrenal;
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
