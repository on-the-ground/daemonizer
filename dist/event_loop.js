"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchEventLoop = launchEventLoop;
const abort_1 = require("./abort");
const macro_task_yielder_1 = require("./macro_task_yielder");
/** * Launches an event loop that processes events from an async iterable.
 * It handles each event using the provided handler function and yields control
 * to allow other macro tasks to run periodically.
 *
 * @param signal - An AbortSignal to allow cancellation of the loop.
 * @param taskGroup - A TaskGroup to manage the lifecycle of the loop.
 * @param eventStream - An async iterable of events to process.
 * @param handle - A function that processes each event.
 */
async function launchEventLoop(signal, taskGroup, eventStream, handle) {
    const yieldScheduler = new macro_task_yielder_1.MacroTaskYielder();
    const abortable = (0, abort_1.withAbort)(signal);
    const iterator = eventStream[Symbol.asyncIterator]();
    taskGroup.add(1);
    try {
        while (true) {
            let result;
            try {
                result = await abortable(iterator.next());
            }
            catch (err) {
                break;
            }
            if (result.done)
                break;
            try {
                await abortable(handle(signal, result.value));
            }
            catch (err) {
                if (err instanceof abort_1.ErrAborted) {
                    break;
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
//# sourceMappingURL=event_loop.js.map