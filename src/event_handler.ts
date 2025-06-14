import { launchEventLoop } from "./event_loop";
import { BoundedQueue } from "./bounded_queue";
import { TaskGroup } from "./task_group";

export class EventHandler<E> {
  readonly tg: TaskGroup;
  readonly eventStream: BoundedQueue<E>;
  constructor(
    signal: AbortSignal,
    handleEvent: (signal: AbortSignal, event: E) => Promise<void>,
    bufferSize: number = 10
  ) {
    const tg = new TaskGroup();
    const eventStream = new BoundedQueue<E>(bufferSize);
    // launchEventLoop is intentionally fire-and-forget.
    // The lifecycle is tracked via the provided TaskGroup.
    launchEventLoop(signal, tg, eventStream, handleEvent);
    this.eventStream = eventStream;
    this.tg = tg;
  }

  close = async () => {
    this.eventStream.close();
    // Wait for the event loop to finish processing.
    await this.tg.wait();
  };

  pushEvent = async (event: E): Promise<boolean> => {
    return this.eventStream.push(event);
  };
}
