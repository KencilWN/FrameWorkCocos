import { Asset, resources } from 'cc';
import { DisposableScope } from '../lifecycle/DisposableScope';

export type AssetType<T extends Asset> = new (...args: any[]) => T;

export class ResourceScopeDisposedError extends Error {
    constructor() { super('ResourceScope is disposed'); this.name = 'ResourceScopeDisposedError'; }
}

/** Teaching adaptation of ResourceLoader: local resources only, one ref per successful load. */
export class ResourceScope {
    private readonly held = new DisposableScope();

    public get disposed(): boolean { return this.held.disposed; }

    /** Path is relative to assets/resources, without extension. Owner must outlive consumers. */
    public load<T extends Asset>(path: string, type: AssetType<T>): Promise<T> {
        if (this.disposed) return Promise.reject(new ResourceScopeDisposedError());
        return new Promise<T>((resolve, reject) => {
            resources.load(path, type, (error, asset) => {
                if (error || !asset) {
                    reject(error || new Error('Missing resource: ' + path));
                    return;
                }
                // Retain inside the callback, before handing the asset to a Promise consumer.
                asset.addRef();
                if (this.disposed) {
                    asset.decRef();
                    reject(new ResourceScopeDisposedError());
                    return;
                }
                this.held.add(() => { asset.decRef(); });
                resolve(asset);
            });
        });
    }

    /** Releases only this scope's refs. Clear/destroy all consumers before disposal. */
    public dispose(): void { this.held.dispose(); }
}
