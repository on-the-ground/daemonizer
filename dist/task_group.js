"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGroup = void 0;
/**
 * TaskGroup is a utility class that allows managing a group of tasks
 * and waiting for all of them to complete. It is useful for coordinating multiple asynchronous
 * operations and ensuring that all tasks are done before proceeding.
 */
class TaskGroup {
    constructor() {
        this.count = 0;
        this.waiters = [];
    }
    add(n) {
        this.count += n;
    }
    done() {
        this.count -= 1;
        if (this.count === 0) {
            this.waiters.forEach((r) => r());
            this.waiters.length = 0;
        }
    }
    async wait() {
        if (this.count === 0)
            return Promise.resolve();
        return new Promise((resolve) => {
            this.waiters.push(resolve);
        });
    }
}
exports.TaskGroup = TaskGroup;
//# sourceMappingURL=task_group.js.map