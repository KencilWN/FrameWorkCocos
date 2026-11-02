import { Cleanup } from '../lifecycle/DisposableScope';

export type ValueListener<T> = (value: T, previous: T) => void;

/** Teaching alternative to ViewModel/JsonOb: explicit replacement, no deep observation. */
export class ObservableValue<T> {
    private listeners = new Set<ValueListener<T>>();
    constructor(private current: T) {}

    public get value(): T { return this.current; }

    public set(value: T): void {
        if (Object.is(this.current, value)) return;
        const previous = this.current;
        this.current = value;
        // Added listeners wait for the next change; removed listeners are skipped.
        for (const listener of Array.from(this.listeners)) {
            if (!this.listeners.has(listener)) continue;
            listener(value, previous);
        }
    }

    /** Subscribe is silent: caller explicitly performs its initial UI refresh. */
    public subscribe(listener: ValueListener<T>): Cleanup {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
}
