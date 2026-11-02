/** Teaching alternative to TaskQueue: FIFO, one task at a time, errors propagate to caller. */
export class SerialTaskQueue {
    private tail: Promise<void> = Promise.resolve();
    private closed = false;

    public enqueue<T>(task: () => T | Promise<T>): Promise<T> {
        if (this.closed) return Promise.reject(new Error('SerialTaskQueue is closed'));
        const result = this.tail.then(() => {
            if (this.closed) throw new Error('SerialTaskQueue is closed');
            return task();
        });
        // A rejected task must not leave later tasks permanently blocked.
        this.tail = result.then(() => undefined, () => undefined);
        return result;
    }

    /** Prevents not-yet-started tasks; does not interrupt a task already running. */
    public close(): void { this.closed = true; }
}
