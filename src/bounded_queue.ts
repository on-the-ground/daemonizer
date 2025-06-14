export class ErrZeroCapacity extends Error {
  constructor() {
    super("Capacity must be greater than 0");
    this.name = new.target.name;
  }
}
export const errZeroCapacity = new ErrZeroCapacity();

const Opening = Symbol("Opening");
type Opening = typeof Opening;

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

  tryPush = (value: T): boolean => {
    if (this.closed) return false;
    return this.tryPushIntrenal(value);
  };

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
