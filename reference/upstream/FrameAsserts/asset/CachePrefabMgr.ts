import { debug, instantiate, isValid, Prefab } from 'cc';
import { loadAsset } from "./AssetMgr";
import BundleMgr from "./BundleMgr";
import { CacheManager } from "./CacheManager";
import { Macro } from "./Enums";
import { Resource } from "./Resource";

export class PrefabNodePool {
    bundle:string = Macro.UNKNOWN
    url:string = ''

    private pool: Array<Resource.Prefab> = [];
       
    constructor(bundle: string,url:string) {
        this.bundle = bundle;
        this.url = url;
    }

    /**@description 当前对象池数据大小 */
    get size() {
        return this.pool.length;
    }

    /**@description 销毁对象池中缓存的所有节点 */
    clear(lv?: number) {
        let count = this.pool.length;
        let clearLv = lv ? lv : 0
        for (let i = 0; i < count; ++i) {
            let rpb = this.pool[i]
            if (rpb && rpb.node && isValid(rpb.node) && rpb.cache.cacheLv < clearLv) {
                rpb.cache.delRef(rpb.parentName+rpb.tag) //移除缓存依赖
                rpb.node.destroy()
                this.pool.splice(i, 1);
                i--;
            }
        }
        return this.pool.length;
    }

    /**
     * @description 向缓冲池中存入一个不需要的节点对象
     * 这个函数会自动将目标节点从父节点移除，但不会进行 cleanup 操作
     * 
     */
    put(obj: Resource.Prefab) {
        if (obj && this.pool.indexOf(obj) === -1) {
            //从父节点移除，但不会对进入 cleanup 操作
            obj.node.removeFromParent();            
            obj.parentName = this.bundle+'_'+this.url+'_'+"PrefabPool"
            obj.tag = '_'+this.pool.length
            obj.cache.addRef(obj.parentName+obj.tag) //添加缓存依赖
            this.pool.push(obj);
        }
    }

    /**
     * @description 从对象池中取缓冲节点
     * */
    get() {
        if (this.pool.length <= 0) {
            let cache = CacheManager.ins.get(this.bundle,this.url,Prefab)
            if (cache) {
                let pnd = new Resource.Prefab()
                pnd.cache = cache
                pnd.node = instantiate(cache.data as Prefab);
                return pnd;
            }else{
                console.warn("缓存中没有可创建的Prefab，获取节点失败")
            }
            return null;
        }
        let last = this.pool.length - 1;
        let obj = this.pool[last];        
        obj.cache.delRef(obj.parentName+obj.tag) //移除缓存依赖
        this.pool.length = last;
        return obj;
    }

}
/**
 * PrefabNode缓存管理器，对重复创建的Prefab节点的缓存管理
 */
export class CachePrefabMgr {
    modelName: string = "【PrefabNode缓存管理器】"

    private static _instance:CachePrefabMgr = null
    static get ins(){
        if(!CachePrefabMgr._instance){
            CachePrefabMgr._instance = new CachePrefabMgr()
        }
        return CachePrefabMgr._instance
    }

    private pools: Map<string, PrefabNodePool> = new Map();

    private getkey(bundle:string,url:string){
        return bundle+'_'+url
    }

    async preloadPrefabIns(url: string, bundle: string, catchLv: number): Promise<Resource.Prefab> {
        let pro = new Promise(async (res, rej) => {
            BundleMgr.ins.loadBundle(bundle, async () => {
                let data: Resource.Data = { url: url, bundle: bundle, type: Prefab, cacheLv: catchLv }
                loadAsset(data, (cache: Resource.Cache) => {
                    if (!cache) {
                        res(null);
                        return;
                    }
                    let pbDt = this.popPrefab(cache.bundle, cache.url);
                    this.pushPrefab(pbDt)
                    res(pbDt)
                })
            })
        })
        return pro as Promise<Resource.Prefab>;
    }
    /**
     * @description 创建对象池
     * @param type 对象池类型
     */
    private createPool(bundle: string,url:string) : PrefabNodePool | null{
        let key  = this.getkey(bundle,url)
        if (!this.pools.has(key)) {
            this.pools.set(key, new PrefabNodePool(bundle,url));
        }
        return this.pools.get(key) as PrefabNodePool;
    }

    /**
     * @description 删除对象池 
     * @param type 对象池类型
     * */
    private deletePool(key: string) {
        if (this.pools.has(key)) {
            let pool = this.pools.get(key);
            //清除对象池数据
            pool && pool.clear();
            //删除对象池
            this.pools.delete(key);
        }
    }

    private getPool(bundle: string,url:string){
        let key  = this.getkey(bundle,url)
        if (this.pools.has(key)) {
            return this.pools.get(key) as PrefabNodePool;
        } else {
            let pool = this.createPool(bundle,url);
            this.pools.set(key,pool)
            return pool
        }
    }

    releaseAll(){
        this.pools.forEach((v,key,mp)=>{
            v.clear()
            this.deletePool(key)
        })
    }

    releaseByLv(lv?: number) {
        this.pools.forEach((v, key, mp) => {
            let count = v.clear(lv)
            if(count <= 0){
                this.deletePool(key)
            }
        })
    }

    /**@description 根据bundle清理节点对象*/
    clearByBundle(bundle:string){
        if(debug)console.log(`清理bundle${bundle}的缓存池中Prefab`)
        this.pools.forEach((v,key,mp)=>{
            if(key.indexOf(bundle)>=0){
                v.clear()
                this.deletePool(key)
            }
        })
    }
    clearPrefab(url:string,bundle:string){
        let key = this.getkey(bundle,url)
        this.deletePool(key)
    }

    /**
     * @description 获取对象池
     * @param bundle 所属bundle
     * @param url prefab路径 
     * */
    popPrefab(bundle: string,url:string) {
        let pool = this.getPool(bundle,url)
        return pool.get();
    }

    pushPrefab(res:Resource.Prefab){
        let bundle = res.cache.bundle
        let url = res.cache.url
        let pool = this.getPool(bundle,url)
        pool.put(res)
    }
}
