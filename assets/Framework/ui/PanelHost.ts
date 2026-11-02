import { instantiate, isValid, Node, Prefab } from 'cc';

/** Teaching adaptation of view hosting: one explicit root, loaded Prefabs supplied by caller. */
export class PanelHost {
    private readonly panels = new Set<Node>();
    private closed = false;

    constructor(private readonly root: Node) {}

    public open(prefab: Prefab): Node {
        if (this.closed || !isValid(this.root, true)) throw new Error('PanelHost is unavailable');
        const node = instantiate(prefab);
        this.panels.add(node);
        node.once(Node.EventType.NODE_DESTROYED, () => { this.panels.delete(node); });
        try { this.root.addChild(node); }
        catch (error) { this.close(node); throw error; }
        return node;
    }

    /** Only closes nodes created by this host. Does not release Prefab resources. */
    public close(node: Node): void {
        if (!this.panels.delete(node)) return;
        if (isValid(node, true)) { node.active = false; node.destroy(); }
    }

    public dispose(): void {
        if (this.closed) return;
        this.closed = true;
        for (const node of Array.from(this.panels)) this.close(node);
    }
}
