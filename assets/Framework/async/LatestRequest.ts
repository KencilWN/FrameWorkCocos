/** New teaching implementation: ignore obsolete results; does not cancel the work. */
export class LatestRequest {
    private revision = 0;

    public begin(): number { return ++this.revision; }
    public isCurrent(ticket: number): boolean { return ticket === this.revision; }
    public invalidate(): void { ++this.revision; }
}
