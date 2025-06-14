export class ErrZeroCapacity extends Error {
  constructor() {
    super("Capacity must be greater than 0");
    this.name = new.target.name;
  }
}
export const errZeroCapacity = new ErrZeroCapacity();

const Opening = Symbol("Opening");
type Opening = typeof Opening;

/** * A bounded queue that allows asynchronous producers and consumers to interact.
 * It supports pushing items, closing the queue, and iterating over the items.
 * If the queue is full, producers will wait until space is available or fail fast.
 * If the queue is empty, consumers will wait until items are available.
 * If the queue is closed, consumers will receive a done signal.
 */
export class BoundedQueue<T> implements AsyncIterable<T> {
  private readonly buffer: T[] = [];
  private readonly waitingConsumers: ((res: IteratorResult<T>) => void)[] = [];
  private readonly waitingProducers: ((
    res: Opening | PromiseLike<Opening>
  ) => void)[] = [];
  private closed = false;

  constructor(private readonly capacity: number) {
    if (capacity <= 0) throw errZeroCapacity;
  }

  private tryPushIntrenal = (value: T): boolean => {
    if (this.waitingConsumers.length > 0) {
      const resolve = this.waitingConsumers.shift()!;
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
  tryPush = (value: T): boolean => {
    if (this.closed) return false;
    return this.tryPushIntrenal(value);
  };

  /** * Pushes a value into the queue, waiting if necessary until space is available.
   * Returns true if successful, false if the queue is closed.
   */
  push = async (value: T): Promise<boolean> => {
    while (true) {
      if (this.closed) return false;

      if (this.tryPushIntrenal(value)) {
        return true;
      }

      await new Promise<Opening>((resolve) => {
        this.waitingProducers.push(resolve);
      });
    }
  };

  /** * Closes the queue, signaling that no more items will be added.
   * All waiting consumers will be resolved with a done signal.
   * Waiting producers will be resolved with an Opening signal.
   */
  close = () => {
    if (this.closed) return;
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

  private nextInternal = (): Promise<IteratorResult<T>> => {
    if (this.waitingProducers.length > 0) {
      const resolve = this.waitingProducers.shift()!;
      resolve(Opening);
    }

    if (this.buffer.length > 0) {
      return Promise.resolve({ value: this.buffer.shift()!, done: false });
    }

    if (this.closed) {
      return Promise.resolve({ value: undefined, done: true });
    }

    return new Promise<IteratorResult<T>>((resolve) => {
      this.waitingConsumers.push(resolve);
    });
  };

  /** * Returns the next item from the queue, waiting if necessary until an item is available.
   * If the queue is closed, it resolves with a done signal.
   */
  next = async (): Promise<IteratorResult<T>> => {
    return await this.nextInternal();
  };

  /** * Returns an async iterator for the queue, allowing iteration over its items.
   * The iterator will yield items until the queue is closed.
   */
  [Symbol.asyncIterator] = (): AsyncIterator<T> => {
    const boundedqueue = this;
    return {
      async next() {
        return await boundedqueue.nextInternal();
      },
    };
  };

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
