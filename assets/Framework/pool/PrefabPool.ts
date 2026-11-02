import { instantiate, isValid, Node, Prefab } from 'cc';

/** Teaching adaptation of prefab pooling: one prefab, explicit ownership, bounded idle cache. */
export class PrefabPool {
    private readonly idle: Node[] = [];
    private readonly borrowed = new Set<Node>();
    private closed = false;

    constructor(private readonly prefab: Prefab, private readonly maxIdle = 16) {
        if (!Number.isInteger(maxIdle) || maxIdle < 0) throw new Error('Invalid maxIdle');
    }

    /** Returned inactive; parent, reset data/listeners, then activate it. */
    public acquire(): Node {
        if (this.closed) throw new Error('PrefabPool is disposed');
        let node: Node | undefined;
        while (this.idle.length && !node) {
            const candidate = this.idle.pop()!;
            if (isValid(candidate, true)) node = candidate;
        }
        if (!node) node = instantiate(this.prefab);
        node.active = false;
        this.borrowed.add(node);
        return node;
    }

    /** Caller clears item-specific callbacks/selection/animations before release. */
    public release(node: Node): void {
        if (!this.borrowed.delete(node)) throw new Error('Node not borrowed from this pool');
        if (!isValid(node, true)) return;
        node.active = false;
        node.removeFromParent();
        if (this.closed || this.idle.length >= this.maxIdle) node.destroy();
        else this.idle.push(node);
    }

    /** Destroys both idle and borrowed nodes; caller must stop using them first. */
    public dispose(): void {
        if (this.closed) return;
        this.closed = true;
        for (const node of [...this.idle, ...Array.from(this.borrowed)]) {
            if (isValid(node, true)) { node.active = false; node.destroy(); }
        }
        this.idle.length = 0;
        this.borrowed.clear();
    }
}
