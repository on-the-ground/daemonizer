"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
const event_loop_1 = require("./event_loop");
const bounded_queue_1 = require("./bounded_queue");
const task_group_1 = require("./task_group");
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
class EventHandler {
    constructor(signal, handleEvent, bufferSize = 10) {
        /** * Closes the event handler, stopping it from accepting new events.
         * It waits for the event loop to finish processing all events before resolving.
         */
        this.close = async () => {
            this.eventStream.close();
            // Wait for the event loop to finish processing.
            await this.tg.wait();
        };
        /** * Pushes an event to the event stream.
         * Returns true if the event was successfully pushed, false if the event handler is closed.
         *
         * @param event - The event to push to the event stream.
         */
        this.pushEvent = async (event) => {
            return this.eventStream.push(event);
        };
        const tg = new task_group_1.TaskGroup();
        const eventStream = new bounded_queue_1.BoundedQueue(bufferSize);
        // launchEventLoop is intentionally fire-and-forget.
        // The lifecycle is tracked via the provided TaskGroup.
        (0, event_loop_1.launchEventLoop)(signal, tg, eventStream, handleEvent);
        this.eventStream = eventStream;
        this.tg = tg;
    }
}
exports.EventHandler = EventHandler;
//# sourceMappingURL=event_handler.js.map