import { ErrAborted, withAbort } from "./abort";
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
  const yieldScheduler = new MacroTaskYielder();
  const abortable = withAbort(signal);
  const iterator = eventStream[Symbol.asyncIterator]();

  taskGroup.add(1);

  try {
    while (true) {
      let result: IteratorResult<T>;
      try {
        result = await abortable(iterator.next());
      } catch (err) {
        break;
      }

      if (result.done) break;

      try {
        await abortable(handle(signal, result.value));
      } catch (err) {
        if (err instanceof ErrAborted) {
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
