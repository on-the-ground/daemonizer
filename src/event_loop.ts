import { timeoutError, withAbort, withTimeout } from "./abort";
import { MacroTaskYielder } from "./macro_task_yielder";
import { TaskGroup } from "./task_group";

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
export async function launchEventLoop<T>(
  signal: AbortSignal,
  taskGroup: TaskGroup,
  eventStream: AsyncIterable<T>,
  handleEvent: (signal: AbortSignal, event: T) => Promise<void>,
  loopIntervalMs: number = 8,
  strictInterval: boolean = false
): Promise<void> {
  const yieldScheduler = new MacroTaskYielder(loopIntervalMs);
  const iterator = eventStream[Symbol.asyncIterator]();

  taskGroup.add(1);

  try {
    loop: while (true) {
      let result: IteratorResult<T>;
      try {
        result = await withAbort(iterator.next(), signal);
      } catch (err) {
        if (err instanceof DOMException) break;
        throw err;
      }

      if (result.done) break;

      try {
        await (strictInterval
          ? withTimeout(
              (sig) => handleEvent(sig, result.value),
              loopIntervalMs,
              signal
            )
          : withAbort(handleEvent(signal, result.value), signal));
      } catch (err) {
        if (err === timeoutError) {
          // continue
        } else if (err instanceof DOMException) {
          break loop; // Break the loop iff it is aborted from outside
        } else {
          throw err;
        }
      }

      // Yield control to allow other macro tasks to run.
      await yieldScheduler.yieldByInterval();
    }
  } finally {
    taskGroup.done();
  }
}
