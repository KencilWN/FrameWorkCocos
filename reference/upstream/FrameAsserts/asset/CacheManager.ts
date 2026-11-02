import { Asset, assetManager, isValid, SpriteFrame } from 'cc';
import { DebugType } from "../../../Config/GLConfig";
import { Global } from "../../Global";
import { MemUtil } from "../Utils/MemUtil";
import BundleMgr from "./BundleMgr";
import { CachePrefabMgr } from "./CachePrefabMgr";
import { Macro } from "./Enums";
import { Resource, tagCache } from "./Resource";

class BundleCache{
    protected _caches = new Map<string, Resource.Cache>();
    protected name = Macro.UNKNOWN as string;
    constructor(name: string) {
        this.name = name;
    }

    /**@description获取cache*/
    public get(key: string, isCheck?: boolean) {
        if (this._caches.has(key)) {
            let cache = this._caches.get(key);
            if (isCheck && cache && cache.isInvalid) {
                //资源已经释放
                console.warn(`资源加载完成，但已经被释放 , 重新加载资源 : ${key}`);
                console.error("错误的缓存资源会导致js内存泄漏")
                cache.delRef(tagCache+cache.bundle)
                this._caches.delete(key);
                return null;
            }
            return cache
        }
        return null;
    }
    public set(data: Resource.Cache) {
        this._caches.set(data.key, data);
    }

    public get size() {
        return this._caches.size;
    }

    public remove(url: string, type: typeof Asset,bundle:string, force: boolean = false) {
        let key = Resource.getKey(url, type,bundle);
        let cache = this.get(key);
        if(!cache) return;
        const ownerTag = tagCache + cache.bundle;
        // 一个 loader 关闭时，其他 loader / 组件仍可能持有同一资源。
        if (!force && cache.reflists().some(ref => ref !== ownerTag)) return;
        this._caches.delete(key);
        cache.delRef(ownerTag);
        if(cache.data){//加载成功的cache做释放
            cache.status = Resource.CacheStatus.NONE;
            //释放未使用的资源
            console.debug(`[释放资源xxxxxx]: ${cache.bundle}/${cache.url}`);
            // 普通回收由 decRef 交给引擎处理依赖引用；强制释放仅用于 bundle 卸载。
            if (force) assetManager.releaseAsset(cache.data);
        }
    }

    getCaches(){return this._caches}

    /**@description 清理lv等级以下的资源*/
    public clear(lv:number=0){
        this._caches.forEach((cache,key,map)=>{
            if(cache.refCacheCount==1 && cache.cacheLv<=lv){
                this.remove(cache.url,cache.type,cache.bundle)
            }
        })
        return this.size
    }

    /**@description 强制清理当前 bundle 下全部缓存（用于 bundle 被 remove 后的兜底）*/
    public clearAll(){
        const keys = Array.from(this._caches.keys());
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const cache = this._caches.get(key);
            if (!cache) continue;
            this.remove(cache.url, cache.type, cache.bundle, true);
        }
        return this.size;
    }

    public destroy() {
        this._caches.clear();
    }
}

class RemoteCaches extends BundleCache{
    public getSpriteFrame(url: string) {
        let key = Resource.getKey(url, SpriteFrame,Macro.BUNDLE_REMOTE);
        let cacheSpriteFrame = this.get(key);
        if (cacheSpriteFrame) {
            //检查纹理是否还在
            const frame = cacheSpriteFrame.data as SpriteFrame;
            if (isValid(frame) && frame.texture && isValid(frame.texture)) {
                return cacheSpriteFrame;
            } else {
                this.remove(url, SpriteFrame,Macro.BUNDLE_REMOTE);                
                return null;
            }
        }
        return null;
    }
}

export class CacheManager {
    private static _instance:CacheManager = null
    static get ins(){
        if(!CacheManager._instance){
            CacheManager._instance = new CacheManager()
        }
        return CacheManager._instance
    }
    modelName:string = "【CacheManager】"

    isResident?: boolean = true;
    private _bundleCaches = new Map<string, BundleCache>();
    private _remoteCaches = new RemoteCaches("RemoteCaches");
    public get remoteCaches() { return this._remoteCaches; }

    public getBundleName(bundle: string) {
        return BundleMgr.ins.getBundleName(bundle);
    }

    public clear() {
        this._bundleCaches.clear();
        this._remoteCaches.destroy();
    }

    /**
     * @description 同步获取资源缓存，此接口不会检查资源的状态，只要建立了缓存，就会立即返回
     * @param bundle bundle名
     * @param url 资源url
     * @param isCheck 是否检查资源有效性，当为ture时，会检查资源是否有效，如果有效直接返回，如果无效，则返回nll
     * @returns Resource.Cache|null
     */
    public get(bundle: string, url: string, type: typeof Asset, isCheck: boolean = true) {
        let bundleName = this.getBundleName(bundle);
        if (bundleName && this._bundleCaches.has(bundleName)) {
            return (this._bundleCaches.get(bundleName) as BundleCache).get(Resource.getKey(url, type,bundleName), isCheck);
        }
        return null;
    }

    public set(cache: Resource.Cache) {
        cache.status = Resource.CacheStatus.NONE;
        let bundleName = this.getBundleName(cache.bundle);
        if (bundleName) {
            let bundleCache
            if (!this._bundleCaches.has(bundleName)) {
                bundleCache = new BundleCache(bundleName);
                this._bundleCaches.set(bundleName, bundleCache);
            } else {
                bundleCache = this._bundleCaches.get(bundleName)
            }
            bundleCache.set(cache);
        }
    }

    /**
     * @description 缓存的移除，
     * @param cache 缓存信息
     */
    public removeByCache(cache: Resource.Cache) {
        if (!cache)return;

        if (cache.isLoaded) {            
            let bundleName = this.getBundleName(cache.bundle);
            if (bundleName && this._bundleCaches.has(bundleName)) {
                let bc = this._bundleCaches.get(bundleName) as BundleCache
                bc?.remove(cache.key,cache.type,bundleName);
            }else if(bundleName == Macro.BUNDLE_REMOTE){
                this._remoteCaches.remove(cache.key,cache.type,bundleName);
            }
        } else {
            cache.status = Resource.CacheStatus.WAITTING_FOR_RELEASE;
        }
    }

    public removeByBundle(bundle: string) {
        let bundleName = this.getBundleName(bundle);
        CachePrefabMgr.ins.clearByBundle(bundle);
        BundleMgr.ins.removeLoadedBundle([bundleName]);
        if (bundleName && this._bundleCaches.has(bundleName)) {
            let bc = this._bundleCaches.get(bundleName)
            // bundle 已经被移除时，必须把该 bundle 的缓存映射全部剔除，避免残留失效 cache 再次命中
            let size = bc.clearAll()
            return size
        }
        
    }

    private getTotalCacheCount(): number {
        let count = 0;
        this._bundleCaches.forEach((bc) => {
            count += bc.size;
        });
        return count;
    }

    private getTotalCacheMemSize(): number {
        const caches: Resource.Cache[] = [];
        this._bundleCaches.forEach((bc) => {
            bc.getCaches().forEach((cache) => {
                caches.push(cache);
            });
        });
        return MemUtil.calcCachesMemSize(caches);
    }

    /**@description 清理缓存等级小等于lv的资源*/
    public releaseUnusedRes(Lv: number) {
        let beforeCount = 0
        let beforeMem = 0
        if(Global.glConfig.game_debug_state == DebugType.DEBUG){
            beforeCount = this.getTotalCacheCount();
            beforeMem = this.getTotalCacheMemSize();
        }
        let releaseNum = 0;
        this._bundleCaches.forEach((bc, key, map) => {
            let oldSize = bc.size;
            let leftsize = bc.clear(Lv);
            releaseNum += oldSize - leftsize;
        });
        if(Global.glConfig.game_debug_state == DebugType.DEBUG){
            const afterCount = this.getTotalCacheCount();
            const afterMem = this.getTotalCacheMemSize();
            console.log(
                `${this.modelName}清理缓存等级小等于${Lv}的资源，` +
                `清理前: ${beforeCount}个/${MemUtil.formatMemSize(beforeMem)}, ` +
                `清理后: ${afterCount}个/${MemUtil.formatMemSize(afterMem)}, ` +
                `释放了${releaseNum}个资源`
            );
        }
    }

    public getCachesByBundle(bundle:string){
        let mapbc = this._bundleCaches.get(bundle)
        return mapbc
    }
}
