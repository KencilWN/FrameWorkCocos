import { Component } from 'cc';
import { DisposableScope } from '../lifecycle/DisposableScope';
import { LatestRequest } from '../async/LatestRequest';

/** Teaching adaptation of EventComponent/PrefabComponent responsibilities, not API compatible. */
export class ScopedComponent extends Component {
    protected readonly lifetime = new DisposableScope();
    protected readonly requests = new LatestRequest();
    protected activeScope: DisposableScope | null = null;

    protected onEnable(): void {
        this.activeScope?.dispose();
        const scope = new DisposableScope();
        this.activeScope = scope;
        this.onActivated(scope);
    }

    protected onDisable(): void {
        this.requests.invalidate();
        this.activeScope?.dispose();
        this.activeScope = null;
    }

    protected onDestroy(): void {
        this.onDisable();
        this.lifetime.dispose();
    }

    /** Override this hook for subscriptions that exist only while visible/enabled. */
    protected onActivated(_scope: DisposableScope): void {}
}
