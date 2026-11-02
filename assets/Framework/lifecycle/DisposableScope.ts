/** New teaching implementation. Owns cleanup actions, not the resources themselves. */
export type Cleanup = () => void;

export class DisposableScope {
    private actions: Cleanup[] = [];
    private closed = false;

    public get disposed(): boolean { return this.closed; }

    /** Registers an action; returned function executes it at most once. */
    public add(cleanup: Cleanup): Cleanup {
        let pending = true;
        const release = () => {
            if (!pending) return;
            pending = false;
            const index = this.actions.indexOf(release);
            if (index >= 0) this.actions.splice(index, 1);
            cleanup();
        };
        if (this.closed) release();
        else this.actions.push(release);
        return release;
    }

    /** Reverse order, idempotent; one failure does not skip remaining cleanup. */
    public dispose(): void {
        if (this.closed) return;
        this.closed = true;
        const actions = this.actions.slice().reverse();
        for (const release of actions) {
            try { release(); }
            catch (error) { console.error('DisposableScope cleanup failed', error); }
        }
    }
}
