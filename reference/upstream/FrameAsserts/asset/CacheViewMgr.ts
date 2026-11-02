import { Component, instantiate, isValid, js, Node, Prefab } from 'cc';
import { Defer } from "../../../../Scripts/Lib/baseTs/TSBase";
import { Global } from "../../Global";
import { UIIndex } from "../Def/typeDef";
import { loadAsset } from "./AssetMgr";
import BundleMgr from "./BundleMgr";
import { ViewStatus } from "./Enums";
import { Resource } from "./Resource";

export class CacheViewMgr {
    modelName: string = "【View缓存管理器】"
    private static _instance:CacheViewMgr = null
    static get ins(){
        if(!CacheViewMgr._instance){
            CacheViewMgr._instance = new CacheViewMgr()
        }
        return CacheViewMgr._instance
    }

    /**@description 加载完成后的Prefab*/
    private _VDatas: Map<string, Resource.ViewData> = new Map<string, Resource.ViewData>();
    private _poolUI: Map<string, Resource.ViewData> = new Map<string, Resource.ViewData>();
    private _mapOpenUIEx: Map<string,{lastTime:number,openCount:number}> = new Map<string,{lastTime:number,openCount:number}>();

    /**缓存加载的UI*/
    private _mapPreLoadingUI: Map<string, Defer> = new Map<string, Defer>()

    private mapUiParams: Map<number, Resource.IUIViewParam> = new Map<number, Resource.IUIViewParam>();

    initUiParams(uiParams: Resource.IUIViewParam[]) {
        this.mapUiParams.clear()
        uiParams.forEach(param => {
            this.mapUiParams.set(param.uiId, param)
        })
    }

    getUiParams(uiId: number) {
        return this.mapUiParams.get(uiId)
    }
    getAllUiParams() {
        return this.mapUiParams
    }

    clearUiInfo(){
        this._mapOpenUIEx.clear();
    }

    private getkey(bundle: string, url: string) {
        return bundle + '_' + url
    }
    private getBundlePrefix(bundle: string) {
        return `${bundle}_`;
    }
    private isViewDataInvalid(viewData: Resource.ViewData) {
        if (!viewData || !viewData.nodePb) return true;
        const cache = viewData.nodePb.cache;
        if (!cache) return true;
        if (cache.isInvalid) return true;
        if (!isValid(viewData.nodePb.node, true)) return true;
        if (this.hasInvalidPrefabRef(viewData.nodePb.node)) return true;
        return false;
    }
    private hasInvalidPrefabRef(root: Node) {
        if (!root || !isValid(root, true)) return true;
        const stack: Node[] = [root];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node || !isValid(node, true)) continue;
            const comps = node.getComponents(Component) || [];
            for (let i = 0; i < comps.length; i++) {
                const comp = comps[i] as any;
                if (!comp) continue;
                for (const key in comp) {
                    if (!Object.prototype.hasOwnProperty.call(comp, key)) continue;
                    const val = comp[key];
                    if (val instanceof Prefab && !isValid(val, true)) {
                        console.warn(`${this.modelName}检测到失效Prefab引用，节点=${node.name}, 组件=${js.getClassName(comp)}, 字段=${key}`);
                        return true;
                    }
                }
            }
            const children = node.children || [];
            for (let i = 0; i < children.length; i++) {
                stack.push(children[i]);
            }
        }
        return false;
    }

    getByBundle(bundle: string) {
        let arr = []
        const bundlePrefix = this.getBundlePrefix(bundle)
        this._VDatas.forEach((v, key, mp) => {
            if (key.indexOf(bundlePrefix) == 0) {
                arr.push(key);
            }
        })
        return arr;
    }
    clearUIByIndex(index: UIIndex) {
        this._VDatas.forEach((v, key, mp) => {
            if (v.zorder == index)
                this.deleteView(key)
        })
    }

    getLastOpenInfo(uiId: number) {
        let param = this.mapUiParams.get(uiId)
        if (!param) return {lastTime:0,openCount:0};
        let bundle = param.bundle
        let url = param.pathUrl
        let key = this.getkey(bundle, url)
        return this._mapOpenUIEx.get(key) || {lastTime:0,openCount:0};
    }
    addOpenUICount(key:string){
        let lastInfo = this._mapOpenUIEx.get(key) || {lastTime:0,openCount:0}
        lastInfo.openCount++;
        lastInfo.lastTime = Date.now();
        this._mapOpenUIEx.set(key,lastInfo);
    }

    /**@description 获取 UI 资源数据 */
    popUI(url: string, bundelName: string) {
        let keys = Resource.getKey(url, Prefab, bundelName)
        let out = this._poolUI.get(keys);
        if (out) {
            if (this.isViewDataInvalid(out)) {
                this._poolUI.delete(keys);
                if (out?.nodePb?.cache) {
                    out.nodePb.cache.delRef(this.modelName + out.nodePb.parentName + out.nodePb.tag);
                }
                if (out?.nodePb?.node && isValid(out.nodePb.node, true)) {
                    out.nodePb.node.destroy();
                }
                return null;
            }
            console.debug(`${this.modelName}获取待释放UI资源 : ${keys}`)
            this._poolUI.delete(keys);
            out.nodePb.cache.addRef(out.nodePb.parentName + out.nodePb.tag)
            out.nodePb.cache.delRef(this.modelName + out.nodePb.parentName + out.nodePb.tag)
        }
        return out;
    }

    pushUI(data: Resource.ViewData) {
        if (data.toRelease()) {
            let keys = Resource.getKey(data.nodePb.cache.url, Prefab, data.nodePb.cache.bundle)
            console.debug(`${this.modelName}加入待释放的UI资源${data.nodePb.cache.url}`);
            data.nodePb.cache.delRef(data.nodePb.parentName + data.nodePb.tag)
            data.nodePb.cache.addRef(this.modelName + data.nodePb.parentName + data.nodePb.tag)
            data.nodePb.cache.stamp = Date.now()
            this._poolUI.set(keys, data);
        }
    }

    private deleteView(key: string) {
        let vd = this._VDatas.get(key)
        if (!vd) return;
        if (vd.state === ViewStatus.LOADING && vd.pendingSolidifyInflight) {
            vd.pendingSolidifyInflight = false
            Global.UIMgr.notifySolidifyPopLoadEnd()
        }
        if (vd.state > ViewStatus.LOADING) {
            this.pushUI(vd)
        }
        this._VDatas.delete(key)
    }

    /**根据bundle销毁View缓存*/
    clearByBundle(bundle: string) {
        let arr = this.getByBundle(bundle)
        arr.forEach((key) => {
            this.deleteView(key)
        })
        // 清理待释放池中的同 bundle UI，避免复用到已被 removeBundle 释放过资源的旧节点
        const poolKeys = [...Array.from(this._poolUI.keys())]
        const bundlePrefix = this.getBundlePrefix(bundle)
        poolKeys.forEach((key) => {
            if (key.indexOf(bundlePrefix) == 0) {
                const viewData = this._poolUI.get(key)
                if (viewData && viewData.nodePb) {
                    const cache = viewData.nodePb.cache
                    if (cache) {
                        cache.delRef(this.modelName + viewData.nodePb.parentName + viewData.nodePb.tag)
                    }
                    if (viewData.nodePb.node && isValid(viewData.nodePb.node, true)) {
                        viewData.nodePb.node.destroy()
                    }
                }
                this._poolUI.delete(key)
            }
        })
        //清除预加载的缓存
        let self = this
        async function delCatch(key: string, v: Defer<Resource.Prefab>) {
            let pnd = await v.promise
            pnd.cache.delRef(pnd.parentName + pnd.tag)
            pnd.node.destroy()
            self._mapPreLoadingUI.delete(key)
        }
        let keycatchs = [...Array.from(self._mapPreLoadingUI.keys())]
        for (let idx = 0; idx < keycatchs.length; ++idx) {//预加载没有绑定view的数据
            if (keycatchs[idx].indexOf(bundle) == 0) {
                delCatch(keycatchs[idx], self._mapPreLoadingUI.get(keycatchs[idx]))
            }
        }
    }
    removeView(view: Resource.IUIView) {
        if (view.viewData?.openPaream) {
            let bagId = view.viewData.openPaream.bundle
            let uiid = view.viewData.openPaream.uiId
            this.removeViewById(uiid)
        }
    }
    removeViewById(uid: number) {
        let param = this.mapUiParams.get(uid)
        if (!param) return;
        let bundle = param.bundle
        let url = param.pathUrl
        let key = this.getkey(bundle, url)
        this.deleteView(key)
    }

    getView(uiid: number) {
        let param = this.mapUiParams.get(uiid)
        if (!param) {
            console.warn(`cfg配置表中没找到UI${uiid}的加载参数`)
            return
        }
        let bundle = param.bundle
        let url = param.pathUrl
        let key = this.getkey(bundle, url)
        let viewData = this._VDatas.get(key)
        return viewData
    }

    isViewOpen(uiid: number) {
        let param = this.mapUiParams.get(uiid)
        if (!param) return false;
        let bundle = param.bundle
        let url = param.pathUrl
        let key = this.getkey(bundle, url)
        return this._VDatas.has(key)
    }

    private destroyPoolUI(data: Resource.ViewData, lv: number = 2) {
        if (data) {            
        
            let uiKey = data.openPaream.bundle + data.openPaream.uiId
            let param = this.getUiParams(data.openPaream.uiId)
            if (!param) {
                return false;
            }
            if (param.catch >= lv) return false;

            let out = this.popUI(data.nodePb.cache.url,data.nodePb.cache.bundle)
            if(out){
                out.nodePb.cache.delRef(out.nodePb.parentName + out.nodePb.tag)
                out.nodePb.node.destroy()
            }
            console.log("释放了ui资源", data.nodePb.cache.url)
            return true;
        }
        return false;
    }

    releaseUselessUI(resLv = 2, bundle?: string) {
        let now = new Date().getTime();
        let arr:Resource.ViewData[] = []
        this._poolUI.forEach((v, k) => {
            arr.push(v)
        })
        arr.forEach((v) => {
            this.destroyPoolUI(v)
        })
    }

    async preloadUIPrefab(url: string, bundle: string, catchLv: number): Promise<Resource.Prefab> {
        let key = this.getkey(bundle, url)
        let self = this
        let keydefer = self._mapPreLoadingUI.get(key)
        if (!keydefer) {
            keydefer = new Defer()
            self._mapPreLoadingUI.set(key, keydefer)
        } else {
            let ndpb = await keydefer.promise;
            return ndpb
        }
        let pro = new Promise(async (res, rej) => {
            BundleMgr.ins.loadBundle(bundle, async () => {
                loadAsset({ url: url, bundle: bundle, type: Prefab, cacheLv: catchLv }, (cache: Resource.Cache) => {
                    if (!cache) {
                        res(null);
                        return;
                    }
                    if (BundleMgr.ins.getBundle(bundle)) {//bundle没有移除
                        let pnd = new Resource.Prefab()
                        pnd.cache = cache
                        pnd.node = instantiate(cache.data as Prefab);
                        pnd.parentName = url
                        pnd.tag = '_view'
                        cache.addRef(pnd.parentName + pnd.tag)
                        keydefer.resolve(pnd)
                        res(pnd);
                    } else {
                        res(null)
                    }
                })
            })
        })
        return pro as Promise<Resource.Prefab>;
    }

    /**显示界面 beforAddWaitFun表示再添加界面之前做一个扩展动画*/
    public openView(uiId:number, fromInfo?:any,data:any = null, complete?: (viewDt?: Resource.ViewData) => void, beforAddWaitFun?: () => void) {

        let option = this.mapUiParams.get(uiId)
        if (!option) {
            console.warn(`cfg配置表中没找到UI${uiId}的加载参数`)
            return
        }
        let bundle = option.bundle
        let url = option.pathUrl
        let key = this.getkey(bundle, url)
        let viewData = this._VDatas.get(key)
        let self = this

        async function loadnewIns(viewDt: Resource.ViewData) {
            let resPb = await self.preloadUIPrefab(url, bundle, option.catch)
            self._mapPreLoadingUI.delete(key)
            if (!resPb) {
                if (option.wait) {//需要等待加载
                    Global.UIMgr.closeWaitLoading()
                }
                if (viewDt.pendingSolidifyInflight) {
                    viewDt.pendingSolidifyInflight = false
                    Global.UIMgr.notifySolidifyPopLoadEnd()
                }
                self._VDatas.delete(key)
                viewDt.loadOverCall.forEach((fun) => {
                    fun(null)
                })
                viewDt.loadOverCall = []
                return;
            }
            let newVDt = self._VDatas.get(key)
            if (!newVDt) {//加载完成后已经被删，放入了release
                if (option.wait) {//需要等待加载
                    Global.UIMgr.closeWaitLoading()
                }
                if (viewDt.pendingSolidifyInflight) {
                    viewDt.pendingSolidifyInflight = false
                    Global.UIMgr.notifySolidifyPopLoadEnd()
                }
                console.error('不允许界面打开过程中，调用打开另外的界面')
                viewDt.loadOverCall.forEach((fun) => {
                    fun(null)
                })
                viewDt.loadOverCall = []
                return;
            }
            viewDt.nodePb = resPb
            // Keep stable UI IDs/enums when a replacement prefab has a new view class.
            const candidate = resPb.node.getComponent(option.eName) || resPb.node.getComponent(resPb.node.name)
            const comp = candidate && ['startView', 'initOpenInfo', 'setModel', 'onClose'].every(
                name => typeof candidate[name] === 'function'
            ) ? candidate as Resource.IUIView : null
            resPb.cache.cacheLv = option.catch
            if (comp) {
                viewDt.view = comp
                comp.viewData = viewDt
                comp.bundleName = option.bundle
            } else {
                console.warn("加载的UI [" + option.eName + "]不是有效的UIView类型")
            }
            if (beforAddWaitFun) await beforAddWaitFun()
            console.log('addToUI', option.eName)
            if (comp){
                comp.initOpenInfo(fromInfo)
            }
            Global.UIMgr.addToUI(resPb.node, option.order)
            if (viewDt.pendingSolidifyInflight) {
                viewDt.pendingSolidifyInflight = false
                Global.UIMgr.notifySolidifyPopLoadEnd()
            }
            if (option.wait) {//需要等待加载
                Global.UIMgr.closeWaitLoading()
            }
            viewDt.loadOverCall.forEach((fun) => {
                fun(viewDt)
            })
            viewDt.loadOverCall = []
            viewDt.state = ViewStatus.SHOWING
            if (comp){
                comp.startView()
                comp.setModel(data)
            }                
            else if (!comp) {
                console.warn(`创建的UI根节点没有${option.eName}的绑定组件`)
                viewDt.loadOverCall.forEach((fun) => {
                    fun(null)
                })
                self._VDatas.delete(key)
            }
        }

        if (!viewData) {
            viewData = this.popUI(url, bundle)
            if (viewData) {
                if (viewData.state == ViewStatus.LOADING) {//没有加载删除的pb,无效
                    console.debug("打开正要删除的未加载成功的界面,忽略后需要重新加载:" + url)
                    viewData = null
                } else {
                    viewData.state = ViewStatus.SHOWING
                    self._VDatas.set(key, viewData)   
                    let uiComp = viewData.view as Resource.IUIView
                    Global.UIMgr.addToUI(uiComp.node, option.order);                 
                }
            }
        }
        if (viewData) {
            if (this.isViewDataInvalid(viewData)) {
                this._VDatas.delete(key);
                viewData = null;
            }
        }
        if (viewData) {
            console.debug("打开缓存界面:" + url)
            this.addOpenUICount(key);
            viewData.openPaream = option
            if (viewData.state == ViewStatus.LOADING) {
                if (complete) viewData.loadOverCall.push(complete)
            }
            else if (viewData.state == ViewStatus.SHOWING && viewData.view) {
                //修改层级                
                let uiComp = viewData.view as Resource.IUIView
                if (complete) complete(viewData)
                uiComp.initOpenInfo(fromInfo)
                uiComp.startView()
                uiComp.setModel(data)
            }
            else if (viewData.state == ViewStatus.SHOWED && viewData.view) {
                let uiComp = viewData.view as Resource.IUIView
                if (complete) complete(viewData)
                uiComp.setModel(data)
            }
            else {
                console.warn(`打开界面${option.eName}状态异常,当前状态${viewData.state}`)
            }
            return;
        }
        else {
            console.debug("加载打开界面:" + url)
            viewData = new Resource.ViewData()
            viewData.openPaream = option
            viewData.zorder = option.order
            viewData.state = ViewStatus.LOADING
            if (option.order !== UIIndex.ROOT) {
                viewData.pendingSolidifyInflight = true
                Global.UIMgr.notifySolidifyPopLoadBegin()
            }
            if (complete) viewData.loadOverCall.push(complete)
            self._VDatas.set(key, viewData)
            this.addOpenUICount(key);
            if (option.wait) {//需要等待加载
                Global.UIMgr.showWaitLoading()
            }
            loadnewIns(viewData)
        }
    }
}
