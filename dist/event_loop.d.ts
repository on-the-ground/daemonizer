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
export declare function launchEventLoop<T>(signal: AbortSignal, taskGroup: TaskGroup, eventStream: AsyncIterable<T>, handle: (signal: AbortSignal, event: T) => Promise<void>): Promise<void>;
