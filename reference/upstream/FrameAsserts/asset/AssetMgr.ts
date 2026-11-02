import { Asset, assetManager, AssetManager, debug, ImageAsset, JsonAsset, SpriteFrame, TextAsset, Texture2D } from 'cc';
import { dbsTimeOut } from "../../baseTs/TSBase";
import BundleMgr from "./BundleMgr";
import { CacheManager } from "./CacheManager";
import { Macro } from "./Enums";
import { Resource } from "./Resource";

class RemoteLoader {

    private _logTag = `[RemoteLoader] `;

    public loadSpriteFrame(url: string, cacheLv: number,over:(cdt:Resource.Cache)=>void) {
        this.loadRemoteAsset(url, SpriteFrame, cacheLv, over);
    }

    public loadRemoteAsset(url: string, type: typeof Asset, cacheLv: number, over: (cdt: Resource.Cache) => void) {
        if (url == null || url == undefined || url.length <= 0) {
            over(null);
            return;
        }

        this._loadRemoteRes(url, type, cacheLv).then((cache) => {
            let key = Resource.getKey(url, type, Macro.BUNDLE_REMOTE);
            cache = cache && CacheManager.ins.remoteCaches.get(key)!;
            if (cache) {
                if (debug) console.log(`${this._logTag}加载远程资源完成${key}`);
                if (cache.data) (<Asset>cache.data).name = url;
                over(cache)
            } else {
                if (debug) console.warn(`${this._logTag}加载远程资源错误${url}`);
                over(null);
                CacheManager.ins.remoteCaches.remove(url, type, Macro.BUNDLE_REMOTE);
            }
        })
    }

    private extname(url: string) {
        let value = url.match(/(\.[^\.\/\?\\]*)(\?.*)?$/);
        //如果找
        return value ? value[1] : ".png";
    }

    private _loadRemoteRes<T extends Asset>(url: string, type: typeof Asset, cacheLv: number, options: Record<string, any> = {}) {
        return new Promise<Resource.Cache>((resolve) => {
            let key = Resource.getKey(url, type,Macro.BUNDLE_REMOTE);

            //从缓存中取
            let cache = CacheManager.ins.remoteCaches.get(key)!;
            if (cache) {
                //有缓存,查看是否已经加载
                if (cache.isLoaded) {
                    //如果已经加载完成
                    resolve(cache);
                } else {
                    //正在加载中
                    cache.finishCb.push(resolve);
                }
            } else {
                //没有缓存存在,生成加载缓存
                cache = new Resource.Cache(url, type, Macro.BUNDLE_REMOTE,cacheLv);
                cache.resourceType = Resource.Type.Remote;
                CacheManager.ins.remoteCaches.set(cache);
                options["cacheAsset"] = true;
                if (type == Texture2D || type == SpriteFrame || type == JsonAsset || type == TextAsset) {
                    options.ext = this.extname(url);
                }
                assetManager.loadRemote(url, options, (error, data) => {
                    // Creator 3.x downloads images as ImageAsset. A type annotation
                    // does not turn them into the Texture2D required by Spine.
                    let asset: Asset = data;
                    if (!error && (type === Texture2D || type === SpriteFrame)) {
                        if (type === SpriteFrame && data instanceof SpriteFrame) {
                            asset = data;
                        } else {
                            let texture: Texture2D = null;
                            if (data instanceof Texture2D) {
                                texture = data;
                            } else if (data instanceof ImageAsset) {
                                texture = new Texture2D();
                                texture.image = data;
                            }
                            if (texture && type === SpriteFrame) {
                                const frame = new SpriteFrame();
                                frame.texture = texture;
                                asset = frame;
                            } else {
                                asset = texture;
                            }
                        }
                    }
                    if (error || !asset) {
                        console.error(`${this._logTag}加载远程资源异常:${url}`, error || '无效的资源类型');
                        CacheManager.ins.remoteCaches.remove(url, type, Macro.BUNDLE_REMOTE);
                        cache.isLoaded = true;
                        cache.doFinish(null);
                        cache.doGet();
                        resolve(null);
                        return;
                    }
                    cache.isLoaded = true;
                    cache.data = asset;
                    if (debug) console.log(`${this._logTag}加载远程资源完成:${url}`);
                    cache.doFinish(cache);
                    cache.doGet();
                    resolve(cache);
                })
            }
        });
    }

    /**@description 由主游戏控制器驱动，在下载远程资源时，设置一个上限下载任务数据，以免同一时间任务数量过大 */
    update() {

    }
}

export class AssetMgr{
    modelName: string = "【资源管理器】"
    private static _instance:AssetMgr = null
    static get ins(){
        if(!AssetMgr._instance){
            AssetMgr._instance = new AssetMgr()
        }
        return AssetMgr._instance
    }

    isResident?: boolean = true;
    static module: string = "【AssetMgr】";
    private _remote = new RemoteLoader();
    public get remote() { return this._remote; }
    /**
     * @description 获取Bundle
     * @param bundle Bundle名|Bundle
     */
    private getBundle(bundle: string) {
        return BundleMgr.ins.getBundle(bundle);
    }

    private getBundleAssetPath(bundle: AssetManager.Bundle, url: string, type: typeof Asset): string {
        // 3.x image imports expose SpriteFrame/Texture2D as named sub-assets.
        // Keep existing paths (including atlas frames) when already addressable.
        if (bundle.getInfoWithPath(url, type)) return url;
        const suffix = type === SpriteFrame ? '/spriteFrame' : type === Texture2D ? '/texture' : '';
        if (suffix && !url.endsWith(suffix)) {
            const path = url + suffix;
            if (bundle.getInfoWithPath(path, type)) return path;
        }
        return url;
    }

    public load(
        bundle: string,
        url: string,
        type: typeof Asset,
        cacheLv:number,
        onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void,
        onComplete: (data: Resource.Cache) => void) {
        let key = Resource.getKey(url, type,bundle);
        cacheLv = cacheLv==null||cacheLv==undefined?0:cacheLv
        if(bundle == Macro.BUNDLE_REMOTE){
            if(type == SpriteFrame || type == Texture2D || type == JsonAsset || type == TextAsset){
                this._remote.loadRemoteAsset(url, type, cacheLv, onComplete)
            }
            return;
        }
        
        async function bdLoaded(){
            let _bundleResult = self.getBundle(bundle);
            const assetPath = self.getBundleAssetPath(_bundleResult, url, type);
            let res = _bundleResult.get(assetPath, type);
            if (res) {
                self._onLoadComplete(cache, onComplete, null, res);
            } else {
                let result = await dbsTimeOut(() => {
                    
                    let pro = new Promise((res,rej)=>{
                        function loadBdRes(rescache:Resource.Cache){
                            onComplete(rescache);
                            res(rescache);
                        }
                        if (onProgress) {
                            _bundleResult.load(assetPath, type, onProgress, self._onLoadComplete.bind(self, cache, loadBdRes));
                        } else {
                            _bundleResult.load(assetPath, type, self._onLoadComplete.bind(self, cache, loadBdRes));
                        }
                    });
                    return pro;
                }, 10000);
                if (!result.success) {
                    console.error(`load res timeout:${bundle}/${url}`);
                    //fwk.toast.show(`load res timeout:${bundle}/${url}"`);
                    onComplete(null);
                }
            }
        }

        let self = this
        let cache = CacheManager.ins.get(bundle, url, type)!;
        if (cache) {
            //存在缓存信息
            if (cache.isLoaded) {
                //已经加载完成
                if (debug && cache.status == Resource.CacheStatus.WAITTING_FOR_RELEASE) {
                    console.warn(this.modelName, `资源:${bundle}/${key} 等待释放，但资源已经加载完成，此时有人又重新加载，不进行释放处理`);
                }
                //加载完成
                onComplete(cache);
            } else {
                if (debug && cache.status == Resource.CacheStatus.WAITTING_FOR_RELEASE) {
                    console.warn(this.modelName, `资源:${bundle}/${key}等待释放，但资源处理加载过程中，此时有人又重新加载，不进行释放处理`);
                }
                cache.finishCb.push(onComplete);
            }
            //重新复位资源状态
            cache.status = Resource.CacheStatus.NONE;
        } else {
            //无缓存信息
            cache = new Resource.Cache(url, type, bundle,cacheLv);
            if(cacheLv>=0)CacheManager.ins.set(cache);
            console.log(`加载资源 : ${bundle}/${key}`);

            
            if (!type) {
                //如果bundle不存在
                let error = new Error(`${this.modelName} ${bundle} ${url} 加载没有指定资源类型`);
                this._onLoadComplete(cache, onComplete, error, null);
                return;
            }

            let _bundle = this.getBundle(bundle);
            if (!_bundle) {
                //如果bundle不存在
                BundleMgr.ins.loadBundle(bundle,bdLoaded)
            }else{
                bdLoaded()
            }
            
            
        }
        return cache
    }
    
    private _onLoadComplete(cache: Resource.Cache, complete: (data: Resource.Cache) => void, err: Error | null, data: Asset | null) {
        cache.isLoaded = true;
        //添加引用关系
        let key = cache.key;
        if (err) {
            let desp = `加载资源失败:${cache.bundle}/${key}`
            console.warn(`${this.modelName}加载资源失败:${cache.bundle}/${key} 原因:${err.message ? err.message : "未知"}`);
            fwk.cacheManager.removeByCache(cache);
            complete(null);
        }
        else {
            if (debug) console.log(`${this.modelName}加载资源成功:${cache.bundle}/${key}`);
            cache.data = data;
            complete(cache);
            //加载过程，有不同地方调用过来加载同一个资源的地方，都回调回去
            cache.doFinish(cache);
            cache.doGet();
        }
        if (cache.status == Resource.CacheStatus.WAITTING_FOR_RELEASE) {
            if (debug) console.warn(this.modelName, `资源:${cache.bundle}/${key}加载完成，但缓存状态为等待销毁，销毁资源`);
            if (cache.data) {
                fwk.cacheManager.removeByCache(cache)
            }
            complete(null);
        }
        cache = null!;
    }
}

/**
 * @description 加载Cache资源
 */
export function loadAsset(data: Resource.Data, complete: (data: Resource.Cache|null) => void) {    
    AssetMgr.ins.load(data.bundle, data.url as string, <any>(data.type), data.cacheLv, <any>null, (data: Resource.Cache) => {
        complete(data);
    });
}
