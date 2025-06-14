/**
 * TaskGroup is a utility class that allows managing a group of tasks
 * and waiting for all of them to complete. It is useful for coordinating multiple asynchronous
 * operations and ensuring that all tasks are done before proceeding.
 */
export declare class TaskGroup {
    private count;
    private waiters;
    add(n: number): void;
    done(): void;
    wait(): Promise<void>;
}
