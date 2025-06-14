import { BoundedQueue } from "./bounded_queue";
import { TaskGroup } from "./task_group";
/** * EventHandler is a utility class that manages an event loop processing events
 * from a bounded queue. It allows pushing events to the queue and handles them
 * asynchronously using a provided handler function.
 * It supports graceful shutdown and ensures that all events are processed before closing.
 *
 * @template E - The type of events to handle.
 * @param signal - An AbortSignal to allow cancellation of the event loop.
 * @param handleEvent - A function that processes each event. It should return a
 * Promise that resolves when the event is handled.
 * @param bufferSize - The size of the bounded queue buffer. Defaults to 10.
 */
export declare class EventHandler<E> {
    readonly tg: TaskGroup;
    readonly eventStream: BoundedQueue<E>;
    constructor(signal: AbortSignal, handleEvent: (signal: AbortSignal, event: E) => Promise<void>, bufferSize?: number);
    /** * Closes the event handler, stopping it from accepting new events.
     * It waits for the event loop to finish processing all events before resolving.
     */
    close: () => Promise<void>;
    /** * Pushes an event to the event stream.
     * Returns true if the event was successfully pushed, false if the event handler is closed.
     *
     * @param event - The event to push to the event stream.
     */
    pushEvent: (event: E) => Promise<boolean>;
}
