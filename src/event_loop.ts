import { ErrAborted, withAbort, withTimeout } from "./abort";
import { MacroTaskYielder } from "./macro_task_yielder";
import { TaskGroup } from "./task_group";

/** * Launches an event loop that processes events from an async iterable.
 * It handles each event using the provided handler function and yields control
 * to allow other macro tasks to run periodically.
 *
 * @param signal - An AbortSignal to allow cancellation of the loop.
 * @param taskGroup - A TaskGroup to manage the lifecycle of the loop.
 * @param eventStream - An async iterable of events to process.
 * @param handle - A function that processes each event.
 */
export async function launchEventLoop<T>(
  signal: AbortSignal,
  taskGroup: TaskGroup,
  eventStream: AsyncIterable<T>,
  handle: (signal: AbortSignal, event: T) => Promise<void>
): Promise<void> {
  const timeout = 8; // ms
  const yieldScheduler = new MacroTaskYielder(timeout);
  const iterator = eventStream[Symbol.asyncIterator]();

  taskGroup.add(1);

  try {
    while (true) {
      let result: IteratorResult<T>;
      try {
        result = await withAbort(iterator.next(), signal);
      } catch (err) {
        break;
      }

      if (result.done) break;

      try {
        await withTimeout((sig) => handle(sig, result.value), timeout, signal);
      } catch (err) {
        if (err.reason instanceof ErrAborted) {
          break;
        }
      }

      // Yield control to allow other macro tasks to run.
      await yieldScheduler.yieldByInterval();
    }
  } finally {
    taskGroup.done();
  }
}
