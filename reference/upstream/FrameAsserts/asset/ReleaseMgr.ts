
/**
 * 资源释放管理
 */

import { assetManager } from 'cc';
import BundleMgr from "./BundleMgr";
import { CacheAudioMgr } from "./CacheAudioMgr";
import { CacheManager } from "./CacheManager";
import { CachePrefabMgr } from "./CachePrefabMgr";
import { CacheViewMgr } from "./CacheViewMgr";
import { Global } from "../../Global";
import { Resource } from "./Resource";

const LOG_TAG = "【释放管理器】:";

export class ReleaseMgr {
    private static _instance:ReleaseMgr = null
    static get ins(){
        if(!ReleaseMgr._instance){
            ReleaseMgr._instance = new ReleaseMgr()
        }
        return ReleaseMgr._instance
    }
    modelName = "【释放管理器】";

    isResident?: boolean = true;

    private releaseTimer = null

    private getBundle(bundle: string) {
        return BundleMgr.ins.getBundle(bundle);
    }

    removeBundle(bundle: string) {
        let temp = this.getBundle(bundle);
        this.removeBundleImediate(bundle)
    }

    private removeBundleImediate(bundle: string, reslv: number = 10) {
        let temp = this.getBundle(bundle);
        CacheViewMgr.ins.clearByBundle(bundle)
        CacheViewMgr.ins.releaseUselessUI(reslv, bundle)
        let cacheLeft = CacheManager.ins.removeByBundle(bundle);
        if (cacheLeft == 0) {
            BundleMgr.ins.removeLoadedBundle([bundle])
            console.log(`${LOG_TAG}释放Bundle : ${temp?.name}`);
            temp?.releaseAll();
            if (temp) assetManager.removeBundle(temp);
        } else {
            //console.debug(`${LOG_TAG}释放${bundle}错误，还有不可释放的资源个数 : ${cacheLeft}`);
        }
    }

    /**
     * @description 释放无用的bundle 
     * @param isTimout true , 只释放超时的bundle ，并返回释放的 bundle名
     */
    private releaseUselessBundles(resLv: number = 2) {
        console.log(`${LOG_TAG}-------------释放无用bundle-------------`);
        let now = new Date().getTime();
        let mapbundles = BundleMgr.ins.getMapBundles();
        mapbundles.forEach((bundle, key) => {
            if (bundle) {
                if (BundleMgr.ins.isEngineBundle(key)) {
                    console.debug(`${bundle} : 引擎bundle，跳过处理`)
                    return;
                }
                this.removeBundleImediate(key, resLv)
            }
        });
    }

    

    releaseCatch(lv: number) {
        const externalScene = Global.glConfig.sceneName.ExternalGame;
        console.log(`${LOG_TAG}释放缓存等级小等于${lv}的资源`);
        //先释放UI资源
        CacheViewMgr.ins.releaseUselessUI(lv);
        //释放无用 bundle
        //this.releaseUselessBundles(lv);

        if (lv > 0) {
            //释放缓存音效
            CacheAudioMgr.ins.clearCacheAudio()
            //缓存prefab
            CachePrefabMgr.ins.releaseByLv(lv)
        }
        CacheManager.ins.remoteCaches.clear()
        //释放cache
        //因为释放ui后，destroy的调用是下一帧，所以缓存释放做延迟
        if (this.releaseTimer) {
            globalThis.clearTimeout(this.releaseTimer)
        }
        let self = this
        this.releaseTimer = globalThis.setTimeout(() => {
            self.releaseTimer = null
            CacheManager.ins.releaseUnusedRes(lv)
        }, 200)
    }

    onLowMemory() {
        console.log(`${LOG_TAG}------------收到内存警告，释放无用资源------------`);
        this.releaseCatch(2)
    }

    onAutoReleaseUnuseResources() {
        console.log(`${LOG_TAG}------------释放长时间未使用资源开始------------`);
        this.releaseCatch(1)
    }

}
