/**
 * @description bundle管理器
 */

import { assetManager, AssetManager, game } from 'cc';
import { Macro } from "./Enums"
import { resolveEngineBundleName } from "../../ResourceBundleUtil"

interface BundleLoadSt{
      listOverFun:Function[],
      listProgressFun:Function[]
}
export default class BundleMgr {
   modelName: string = "【bundle管理器】"
   private static _instance:BundleMgr = null
   static get ins(){
        if(!BundleMgr._instance){
         BundleMgr._instance = new BundleMgr()
        }
        return BundleMgr._instance
    }

   private mapLoader: Map<string, BundleLoadSt> = new Map()
   private mapBundles:Map<string,AssetManager.Bundle> = new Map()

   getMapBundles(){
      return this.mapBundles;
   }

   isEngineBundle(key: string): boolean {
      if (!key) return false;
      return key === 'main'
         || key === 'resources'
         || key === 'internal'
         || key === 'start-scene'
         || key === 'hall_main'
         || key === 'hall_resources'
         || key === 'hall_internal';
   }

   /**@description 删除已经加载的bundle */
   public removeLoadedBundle(cludeBundles: string[]) {
      let loaded: string[] = [];
      this.mapBundles.forEach((bundle, key,map) => {
         if (cludeBundles.indexOf(key)>=0) {            
            this.mapBundles.delete(key) 
         }
      });
   }

   /**
    * @description 获取Bundle
    * @param bundle Bundle名|Bundle
    **/
   public getBundle(bundle: string) {
      if (this.isEngineBundle(bundle)) {
         return assetManager.getBundle(resolveEngineBundleName(bundle));
      }
      else {
         let bd = this.mapBundles.get(bundle)
         return bd;
      }
   }

   public getBundleName(bundle: string): string {
      if (bundle) {
         if (typeof bundle == "string") {
            return bundle;
         } else {
            return "resources";
         }
      }
      console.error(`输入参数错误 : ${bundle}`);
      return Macro.UNKNOWN;
   }

   public loadBundle(bundelName: string, overBackTo?: ()=>void,progressCallback?:(pro:number)=>void) {
      let self = this
      let overBack = ()=>{
         self.mapBundles.set(bundelName, assetManager.getBundle(resolveEngineBundleName(bundelName)))
         if(overBackTo)overBackTo()
      }
      let loaderbd = this.mapLoader.get(bundelName)
      if(loaderbd){//加载过程中
         loaderbd.listOverFun.push(overBack)
         if(progressCallback)loaderbd.listProgressFun.push(progressCallback)
         return;
      }
      let bdloader = this.getBundle(bundelName)
      if(bdloader){
         overBack()
      }
      else{//需要加载         
         let loadingparam:BundleLoadSt={
            listOverFun:[],
            listProgressFun:[],
         }
         this.mapLoader.set(bundelName,loadingparam)
         loadingparam.listOverFun.push(overBack)
         if(progressCallback)loadingparam.listProgressFun.push(progressCallback)
         this._loadBundle(bundelName)
      }
   }

   private _loadBundle(bundelName:string){
      let loadPro = 0
      let self = this
      const loadName = resolveEngineBundleName(bundelName)
      assetManager.loadBundle(loadName, {
         onFileProgress: function (e:any) {
             if(loadPro != e.progress){
                 loadPro = e.progress //0-100
                 if(loadPro==100)
                     console.log(bundelName+"loadBound-progress:",loadPro)
             }         
             let pronum = Math.floor(e.progress)
             let loadingSt = self.mapLoader.get(bundelName)
             if(!loadingSt)return
             for(let idx=0;idx<loadingSt.listProgressFun.length;++idx){
                 loadingSt.listProgressFun[idx](pronum);
             }
         }
     },(err, item: AssetManager.Bundle) => {
         let loadingSt = self.mapLoader.get(bundelName)
         if(!loadingSt)return;
         self.mapLoader.delete(bundelName)
         if (err) {
             let errDesp = bundelName+"加载bundle后异常:"+err.message
             console.error(errDesp) 
             //@ts-ignore                 
             if(!sys.isBrowser && assetManager.cacheManager.outOfStorage){//缓存空间不足 
               assetManager.cacheManager.clearCache()                               
               game.restart()
            }
         }         
         else{
            for(let idx=0;idx<loadingSt.listOverFun.length;++idx){
               loadingSt.listOverFun[idx]();
             }
         }
     })
   }
}
