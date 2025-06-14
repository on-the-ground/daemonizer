import { ErrAborted, withAbort } from "./abort";
import { MacroTaskYielder } from "./macro_task_yielder";
import { TaskGroup } from "./task_group";

export async function launchEventLoop<T>(
  signal: AbortSignal,
  taskGroup: TaskGroup,
  events: AsyncIterable<T>,
  handle: (signal: AbortSignal, event: T) => Promise<void>
): Promise<void> {
  const yieldScheduler = new MacroTaskYielder();
  const abortable = withAbort(signal);
  const iterator = events[Symbol.asyncIterator]();

  taskGroup.add(1);
  console.log("[daemonize/event_loop] started");

  try {
    while (true) {
      let result: IteratorResult<T>;
      try {
        result = await abortable(iterator.next());
      } catch (err) {
        console.log("[daemonize/event_loop] aborted during next()");
        break;
      }

      if (result.done) break;

      try {
        await abortable(handle(signal, result.value));
      } catch (err) {
        if (err instanceof ErrAborted) {
          console.log("[daemonize/event_loop] aborted during handle()");
          break;
        }
        console.error("[daemonize/event_loop] error in handle:", err);
      }

      // Yield control to allow other macro tasks to run.
      await yieldScheduler.yieldByInterval();
    }
  } finally {
    taskGroup.done();
    console.log("[daemonize/event_loop] exited");
  }
}
