import {
    Asset,
    Button,
    isValid,
    JsonAsset,
    Node,
    Prefab,
    sp,
    Sprite,
    SpriteFrame,
    TextAsset,
    Texture2D,
    Vec4,
} from 'cc';
import { loadAsset } from "./AssetMgr";
import { CachePrefabMgr } from "./CachePrefabMgr";
import { AssLoaderTag, Macro } from "./Enums";
import { Resource } from "./Resource";

enum EPrafabNdState {
    Destroy = -1,   //被销毁
    isValid = 0,    //无效
    Pool = 1,       //库存中
    Using = 2,      //节点使用中
}

/**
 * @description 资源加载器
 */
export default class ResourceLoader {

    private _name: string = "_Loader"
    constructor(name: string = '') {
        this._name = name + "_Loader"
    }
    get name() { return this._name }
    set name(nm: string) { this._name = nm; }

    /**@description 加载完成后的数据，为了方便释放时精准释放，没加载成功的资源，不在做释放的判断 */
    private _loadedCaches: Map<string, Resource.AssCache> = new Map<string, Resource.AssCache>();

    /**@description 加载完成后的Prefab*/
    private _loadedPrefabs: Array<Resource.Prefab> = new Array<Resource.Prefab>();

    /**@description 是否有效*/
    private _bEnabled: boolean = true

    private _arrCatchRelease: Array<Resource.AssCache> = new Array<Resource.AssCache>();

    getDatakey(rc: Resource.Data) {
        let urlKey = Resource.getKey(rc.url, rc.type!, rc.bundle);
        return urlKey
    }

    init() {
        this._bEnabled = true
        this._arrCatchRelease = []
    }

    /**@description 销毁数据*/
    destroy() {
        this._loadedPrefabs.forEach((ele) => {
            if(isValid(ele.node)){
                this.removePrefabNode(ele.node, false)
            }
        })
        this.clearAllCatches();
        this._loadedPrefabs = []
        this._bEnabled = false
    }

    clearAllCatches(){
        this._arrCatchRelease.forEach((ele, key) => {
            fwk.cacheManager.removeByCache(ele.cache)
        })
        this._arrCatchRelease = []
    }

    removeCache(datakey: string) {
        let asscache = this._loadedCaches.get(datakey)
        if (asscache) {
            asscache.clearRef()
            let ret = this._loadedCaches.delete(datakey)
            if(ret){
                this._arrCatchRelease.push(asscache)
            }
        }
    }

    private getComponentRefKey(refTag: string): string {
        return refTag + this._name
    }

    private removeComponentCacheRef(asscache: Resource.AssCache): void {
        if (asscache?.cache) {
            asscache.cache.delRef(this.getComponentRefKey(asscache.refTag))
        }
    }

    private addComponentCacheRef(asscache: Resource.AssCache, refTag: string): void {
        asscache.cache.addRef(this.getComponentRefKey(refTag))
    }

    /**@description 节点 destroy 时自动清理组件上的资源引用*/
    private bindComponentNodeRelease(node: Node, hookTag: string, releaseHandler: () => void): void {
        const hookKey = hookTag + '_releaseHook';
        if (node[hookKey]) return;
        const handler = () => {
            releaseHandler();
        };
        node[hookKey] = handler;
        node.once('destroy', handler);
    }

    private clearButtonSpriteFrames(button: Button): void {
        const members = ['normalSprite', 'pressedSprite', 'hoverSprite', 'disabledSprite'];
        for (let i = 0; i < members.length; i++) {
            const memberName = members[i];
            const spriteFrame = button[memberName] as SpriteFrame;
            if (!spriteFrame) continue;
            const oldAssCache = spriteFrame[AssLoaderTag.SpFrame] as Resource.AssCache;
            if (oldAssCache) {
                this.removeComponentCacheRef(oldAssCache);
                spriteFrame[AssLoaderTag.SpFrame] = null;
                this.removeCache(oldAssCache.refTag);
            }
            spriteFrame[AssLoaderTag.SpFrame + "_key"] = null;
            button[memberName] = null;
        }
    }

    removePrefable(dtPfb: Resource.Prefab, topool: boolean = true) {
        let idx = this._loadedPrefabs.indexOf(dtPfb)
        if (dtPfb && dtPfb.cache)
            dtPfb.cache.delRef(dtPfb.parentName + dtPfb.tag)
        if (idx >= 0) {
            this._loadedPrefabs.splice(idx, 1)
            if (topool) {
                dtPfb.node[AssLoaderTag.Prefab + '_State'] = EPrafabNdState.Pool
                CachePrefabMgr.ins.pushPrefab(dtPfb)
            }
            else {
                dtPfb.node[AssLoaderTag.Prefab + '_State'] = EPrafabNdState.Destroy
                dtPfb.node.destroy()
            }
        } else {
            dtPfb.node[AssLoaderTag.Prefab + '_State'] = EPrafabNdState.Destroy
            dtPfb.node.destroy()
        }
    }

    /**
     * @description 加载Cache资源
     */
    public loadCache(rdata: Resource.Data, complete: (datach: Resource.AssCache) => void, keyname?: string) {
        if (!rdata) {
            console.warn("cache资源设置路径为空")
            return
        }
        let self = this;
        loadAsset(rdata, (data: Resource.Cache) => {
            if (!data){
                return;
            }
            let urlKey = keyname ? keyname : this.getDatakey(rdata);
            let asscache: Resource.AssCache = new Resource.AssCache(data)
            asscache.refTag = urlKey
            self._loadedCaches.set(urlKey, asscache)
            complete(asscache);
        });
    }

    /**@description pool中获取PrefabInstance*/
    public getPrefabInstance(data: Resource.Data, complet?: (pbNode: Node) => void) {
        if (!data) {
            console.warn("预制体资源设置路径为空")
            return
        }
        data.type = Prefab
        loadAsset(data, (cache: Resource.Cache) => {
            if (!cache) return;
            let pbDt = CachePrefabMgr.ins.popPrefab(cache.bundle, cache.url);
            pbDt.node[AssLoaderTag.Prefab] = pbDt;
            pbDt.node[AssLoaderTag.Prefab + '_State'] = EPrafabNdState.Using //instance取出
            complet(pbDt.node)
        })
    }

    /**@description 修改pb的父节点*/
    public changePrefabInstanceToNode(node: Node, parent: Node, autoRelease: boolean = false) {
        let pbDt = node[AssLoaderTag.Prefab] as Resource.Prefab
        if (!pbDt) {
            console.error("changePrefabToNode 参数pb 不是Resourcce.Prefab对象，找不到resPrefab")
            return
        }
        if (isValid(parent) && (this._bEnabled || autoRelease)) {//要被父节点管理的才做限制
            let urlKey = this.getDatakey({ url: pbDt.cache.url, bundle: pbDt.cache.bundle, type: Prefab });
            pbDt.parentName = urlKey + this._name + '_' + parent.uuid
            pbDt.tag = '_child_' + parent.children.length
            pbDt.cache.addRef(pbDt.parentName + pbDt.tag)
            if (!autoRelease) {
                this._loadedPrefabs.push(pbDt)
                node[AssLoaderTag.Prefab + "_Loader"] = this
            }
            parent.addChild(pbDt.node)
            return true
        } else {
            console.warn("changePrefabToNode 添加给父节点是无效值", pbDt.cache.url)
            this.removePrefabNode(node)
            return false
        }
    }

    /**@description 加载prefab资源,autoRelease表示资源被res管理，autoRelease表示资源不被res管理，默认管理*/
    public setPrefabToNode(data: Resource.Data, parent: Node, complet?: (pb: Resource.Prefab) => void, autoRelease: boolean = false) {
        this.getPrefabInstance(data, (pbNode: Node) => {
            let ret = this.changePrefabInstanceToNode(pbNode, parent, autoRelease)
            if (ret && complet) complet(pbNode[AssLoaderTag.Prefab])
        })
    }
    /**@description 加载一个prefab子节点，重复添加会移除之前的节点，autoRelease表示资源不被res管理，默认管理*/
    public setPrefabToNodeOnlyOne(data: Resource.Data, parent: Node, complet?: (pb: Resource.Prefab) => void, autoRelease: boolean = false) {
        if (!data) {
            console.warn("预制体资源设置路径为空")
            return
        }
        if (!isValid(parent)) return;
        if (parent[AssLoaderTag.Prefab + "_key"]) {
            if (parent[AssLoaderTag.Prefab + "_key"] == data.url) {
                // 已加载完成：直接复用；同 URL 加载进行中则继续走 getPrefabInstance，避免吞掉 complet
                if (parent[AssLoaderTag.Prefab + "_RPb"]) {
                    if (complet) complet(parent[AssLoaderTag.Prefab + "_RPb"]);
                    return;
                }
            }
            else {
                this.clearPrefabOnlyOne(parent)
            }
        }

        parent[AssLoaderTag.Prefab + "_key"] = data.url
        this.getPrefabInstance(data, (pbNode: Node) => {
            if (parent[AssLoaderTag.Prefab + "_key"] == data.url && this._bEnabled) {//防止还没有instanche重现设置节点导致问题
                let ret = this.changePrefabInstanceToNode(pbNode, parent, autoRelease)
                parent[AssLoaderTag.Prefab + "_RPb"] = pbNode[AssLoaderTag.Prefab]
                if (ret && complet) complet(pbNode[AssLoaderTag.Prefab])
            } else {
                this.removePrefabNode(pbNode, true)
            }
        })
    }

    /**@description 清理只有一个子节点的根节点*/
    clearPrefabOnlyOne(parent: Node) {
        if (parent[AssLoaderTag.Prefab + "_key"]) {
            let children = [...parent.children]
            for (let idx = 0; idx < children.length; ++idx) {
                this.removePrefabNode(children[idx], true)
            }
        }
        parent[AssLoaderTag.Prefab + "_RPb"] = null
        parent.removeAllChildren()
        parent[AssLoaderTag.Prefab + "_key"] = null;
    }

    /**移除prefab的node节点,toPool表示还原到pool中*/
    removePrefabNode(nd: Node, toPool: boolean = true) {
        let prefabNd = nd[AssLoaderTag.Prefab]
        let ndState = nd[AssLoaderTag.Prefab + '_State']
        if (!nd.isValid) return;
        nd.removeFromParent()
        if (!prefabNd) {//非Ass缓存预制体
            if (!ndState)
                nd.destroy()
            else {
                console.error("移除过的节点，再次被移除,name=", nd.name)
            }
        }
        else {
            if (ndState == EPrafabNdState.Using)//取出状态
                this.removePrefable(prefabNd, toPool)
            else {
                console.warn("节点非using状态又调用移除,name = ", nd.name)
            }
        }
        nd[AssLoaderTag.Prefab] = null
    }

    /**@description 给图片设置SpriteFrame*/
    public setSpriteFrameToSprite(data: Resource.Data, spr: Sprite, complet?: (pb: Resource.Cache) => void) {
        if (!isValid(spr)) return;
        if (!data) {
            let parentPath = spr.node.parent ? spr.node.parent.name + '/' + spr.node.name : spr.node.name
            console.warn("setSpriteFrameToSprite 图片资源为空，节点路径=", parentPath);
            this.clearSpriteFrame(spr)
            return
        }
        if (!data.url || data.url == '') {
            let parentPath = spr.node.parent ? spr.node.parent.name + '/' + spr.node.name : spr.node.name
            console.warn("setSpriteFrameToSprite 图片路径为空，节点路径=", parentPath);
            this.clearSpriteFrame(spr)
            return
        }

        data.type = SpriteFrame
        // if (data.bundle != Macro.BUNDLE_REMOTE)
        //     data.url = data.url + '/spriteFrame'
        let urlKey = this.getDatakey(data);
        let keyRef = urlKey + this._name + '_' + spr.node.uuid
        let oldCatch = spr[AssLoaderTag.SpFrame]
        if (spr[AssLoaderTag.SpFrame + "_key"] && oldCatch) {
            if (spr[AssLoaderTag.SpFrame + "_key"] == keyRef && spr[AssLoaderTag.SpFrame + "_keyOk"]) {
                if (complet) complet(oldCatch.cache)
                return;
            }
        }
        spr[AssLoaderTag.SpFrame + "_key"] = keyRef
        spr[AssLoaderTag.SpFrame + "_keyOk"] = null
        this.loadCache(data, (asscache: Resource.AssCache) => {
            if (isValid(spr) && spr[AssLoaderTag.SpFrame + "_key"] == keyRef && this._bEnabled) {
                this.clearSpriteFrame(spr)
                spr[AssLoaderTag.SpFrame + "_keyOk"] = true
                spr.spriteFrame = asscache.cache.data as SpriteFrame
                spr[AssLoaderTag.SpFrame] = asscache
                spr.spriteFrame[AssLoaderTag.SpFrame] = asscache
                this.addComponentCacheRef(asscache, keyRef)
                this.bindComponentNodeRelease(spr.node, AssLoaderTag.SpFrame, () => {
                    this.clearSpriteFrame(spr)
                })
                if (complet) complet(asscache.cache)
            } else {
                this.removeCache(asscache.refTag)
            }
        }, keyRef)
    }

    /**@description 清除图片sf*/
    public clearSpriteFrame(sp: Sprite) {
        if (!isValid(sp)) return;
        let oldAssCache = sp[AssLoaderTag.SpFrame] as Resource.AssCache
        if (oldAssCache) {
            this.removeComponentCacheRef(oldAssCache)
            sp[AssLoaderTag.SpFrame] = null
            this.removeCache(oldAssCache.refTag)//清除老图片
            if (sp.spriteFrame) {
                sp.spriteFrame[AssLoaderTag.SpFrame] = null
            }
        }
        sp[AssLoaderTag.SpFrame + "_key"] = null
        sp[AssLoaderTag.SpFrame + "_keyOk"] = null
        sp.spriteFrame = null
    }

    /**@description 给节点添加图片*/
    public addSpriteToNode(data: Resource.Data, parent: Node, complet?: (pb: Resource.Cache) => void, sliceInfo?: Vec4) {
        let sprite = parent.getComponent(Sprite)
        if (!sprite) {
            sprite = parent.addComponent(Sprite)
            sprite.spriteFrame = null
        }
        this.setSpriteFrameToSprite(data, sprite, complet)
    }

    /**
     * @description 根据类型设置按钮
     * @param button 
     * @param memberName 成员变量名
     * @param view 
     * @param url 
     * @param complete 
     */
    private _setButtonWithType(data: Resource.Data, button: Button, memberName: string, complet?: (pb: Resource.Cache) => void) {
        if (!data.url) return;
        if (!isValid(button)) return;
        data.type = SpriteFrame
        // data.url = data.url + '/SpriteFrame'
        let urlKey = this.getDatakey(data);
        let keyRef = urlKey + this._name + '_' + button.name + '_' + memberName
        let assOldCache = button[memberName][AssLoaderTag.SpFrame]
        if (button[memberName][AssLoaderTag.SpFrame + "_key"] && assOldCache) {
            if (button[memberName][AssLoaderTag.SpFrame + "_key"] == keyRef) {
                complet(assOldCache.cache);
                return;
            }

        }

        button[memberName][AssLoaderTag.SpFrame + "_key"] = keyRef
        this.loadCache(data, (asscache: Resource.AssCache) => {
            if (isValid(button) && button[memberName][AssLoaderTag.SpFrame + "_key"] == keyRef && this._bEnabled) {
                if (button[memberName]) {
                    let oldAssCache = button[memberName][AssLoaderTag.SpFrame] as Resource.AssCache
                    if (oldAssCache) {
                        this.removeComponentCacheRef(oldAssCache)
                        button[memberName][AssLoaderTag.SpFrame] = null
                        this.removeCache(oldAssCache.refTag)//清除老图片
                    }
                }

                button[memberName] = asscache.cache.data as SpriteFrame
                button[memberName][AssLoaderTag.SpFrame] = asscache
                this.addComponentCacheRef(asscache, keyRef)
                this.bindComponentNodeRelease(button.node, AssLoaderTag.SpFrame, () => {
                    this.clearButtonSpriteFrames(button)
                })
                if (complet) complet(asscache.cache)
            } else {
                this.removeCache(asscache.refTag)
            }
        }, keyRef)
    }

    /**
     * @description 设置按钮精灵
     * @param button 按钮组件
     * @param config 配置信息
     */
    setButtonSpriteFrame(button: Button, config: {
        bundle?: string,
        normalSprite?: string,
        pressedSprite?: string,
        hoverSprite?: string,
        disabledSprite?: string
    }) {
        this._setButtonWithType({ url: config.normalSprite, bundle: config.bundle }, button, "normalSprite");
        this._setButtonWithType({ url: config.pressedSprite, bundle: config.bundle }, button, "pressedSprite");
        this._setButtonWithType({ url: config.hoverSprite, bundle: config.bundle }, button, "hoverSprite");
        this._setButtonWithType({ url: config.disabledSprite, bundle: config.bundle }, button, "disabledSprite");
    }

    /**
     * @description 设置spine动画数据
     */
    setSkeletonSkeletonData(data: Resource.Data, component: sp.Skeleton, complet?: (pb: Resource.Cache) => void) {
        data.type = sp.SkeletonData
        let urlKey = this.getDatakey(data);
        let keyRef = urlKey + this._name + '_' + component.name
        if (!isValid(component)) return;
        let oldData = component.skeletonData ? component.skeletonData[AssLoaderTag.SpSkeData] : null
        if (component[AssLoaderTag.SpSkeData + "_key"] && oldData) {
            if (component[AssLoaderTag.SpSkeData + "_key"] == keyRef) {
                if (complet) complet(oldData.cache)
                return;
            }
        }

        component[AssLoaderTag.SpSkeData + "_key"] = keyRef
        this.loadCache(data, (asscache: Resource.AssCache) => {
            let oldData = component.skeletonData
            if (isValid(component) && this._bEnabled && component[AssLoaderTag.SpSkeData + "_key"] == keyRef) {//特效切换
                if (oldData) {
                    let oldAssCache = oldData[AssLoaderTag.SpSkeData] as Resource.AssCache
                    if (oldAssCache) {
                        this.removeComponentCacheRef(oldAssCache)
                        oldData[AssLoaderTag.SpSkeData] = null
                        this.removeCache(oldAssCache.refTag)//清除老特效
                    }
                }
                component.skeletonData = asscache.cache.data as sp.SkeletonData;
                component.skeletonData[AssLoaderTag.SpSkeData] = asscache
                this.addComponentCacheRef(asscache, keyRef)
                this.bindComponentNodeRelease(component.node, AssLoaderTag.SpSkeData, () => {
                    this.clearSkeletonData(component)
                })
                if (complet) complet(asscache.cache)
            } else {
                this.removeCache(asscache.refTag)
            }
        }, keyRef)
    }

    /**@description 清除 spine skeletonData */
    clearSkeletonData(component: sp.Skeleton): void {
        if (!isValid(component)) return;
        const oldData = component.skeletonData;
        if (oldData) {
            const parts = oldData[AssLoaderTag.SpSkeData + '_parts'] as {
                texture: Resource.AssCache,
                json: Resource.AssCache,
                atlas: Resource.AssCache,
            };
            if (parts) {
                const list = [parts.texture, parts.json, parts.atlas];
                for (let i = 0; i < list.length; i++) {
                    const asscache = list[i];
                    if (asscache) {
                        this.removeComponentCacheRef(asscache);
                        this.removeCache(asscache.refTag);
                    }
                }
                oldData[AssLoaderTag.SpSkeData + '_parts'] = null;
            } else {
                const oldAssCache = oldData[AssLoaderTag.SpSkeData] as Resource.AssCache;
                if (oldAssCache) {
                    this.removeComponentCacheRef(oldAssCache);
                    oldData[AssLoaderTag.SpSkeData] = null;
                    this.removeCache(oldAssCache.refTag);
                }
            }
        }
        component[AssLoaderTag.SpSkeData + "_key"] = null;
        component.skeletonData = null;
        this.clearRemoteSkeletonPending(component);
    }

    /**@description 清除远程 spine 加载中的临时缓存*/
    private clearRemoteSkeletonPending(component: sp.Skeleton): void {
        const pendingKey = AssLoaderTag.SpSkeData + '_pendingParts';
        const pending = component[pendingKey] as string[];
        if (pending) {
            for (let i = 0; i < pending.length; i++) {
                this.removeCache(pending[i]);
            }
        }
        component[pendingKey] = null;
    }

    private trackRemoteSkeletonPending(component: sp.Skeleton, refTag: string): void {
        const pendingKey = AssLoaderTag.SpSkeData + '_pendingParts';
        if (!component[pendingKey]) {
            component[pendingKey] = [];
        }
        component[pendingKey].push(refTag);
    }

    /**@description 远程 spine 三件套组装并设置到组件*/
    public setRemoteSkeletonData(
        imageUrl: string,
        skeUrl: string,
        atlasUrl: string,
        fileName: string,
        component: sp.Skeleton,
        complet?: () => void,
        cacheLv: number = 0
    ): void {
        if (!isValid(component)) return;
        const keyRef = Resource.getKey(skeUrl, sp.SkeletonData, Macro.BUNDLE_REMOTE) + this._name + '_' + component.node.uuid;
        const oldData = component.skeletonData;
        if (component[AssLoaderTag.SpSkeData + "_key"] === keyRef && oldData?.[AssLoaderTag.SpSkeData + '_parts']) {
            complet?.();
            return;
        }

        // 资源不同，先清理之前已加载/已绑定的 spine 资源
        this.clearRemoteSkeletonPending(component);
        this.clearSkeletonData(component);
        component[AssLoaderTag.SpSkeData + "_key"] = keyRef;
        let texAss: Resource.AssCache = null;
        let skeAss: Resource.AssCache = null;
        let atlasAss: Resource.AssCache = null;
        const partKey = (url: string, type: typeof Asset) =>
            Resource.getKey(url, type, Macro.BUNDLE_REMOTE) + this._name + '_' + component.node.uuid;

        const releasePending = () => {
            if (texAss) this.removeCache(texAss.refTag);
            if (skeAss) this.removeCache(skeAss.refTag);
            if (atlasAss) this.removeCache(atlasAss.refTag);
        };

        const tryApply = () => {
            if (!texAss || !skeAss || !atlasAss) return;
            if (!isValid(component) || !this._bEnabled || component[AssLoaderTag.SpSkeData + "_key"] !== keyRef) {
                releasePending();
                return;
            }
            const texture = texAss.cache?.data as Texture2D;
            const skeletonJson = skeAss.cache?.data as JsonAsset;
            const atlasText = atlasAss.cache?.data as TextAsset;
            if (!(texture instanceof Texture2D) || !skeletonJson || !atlasText) {
                releasePending();
                return;
            }

            const asset = new sp.SkeletonData();
            asset.skeletonJson = skeletonJson.json as any;
            asset.atlasText = atlasText.text;
            asset.textures = [texture];
            asset['textureNames'] = [fileName + '.png'];
            asset[AssLoaderTag.SpSkeData + '_parts'] = {
                texture: texAss,
                json: skeAss,
                atlas: atlasAss,
            };

            component.skeletonData = asset;
            this.addComponentCacheRef(texAss, texAss.refTag);
            this.addComponentCacheRef(skeAss, skeAss.refTag);
            this.addComponentCacheRef(atlasAss, atlasAss.refTag);
            component[AssLoaderTag.SpSkeData + '_pendingParts'] = null;
            this.bindComponentNodeRelease(component.node, AssLoaderTag.SpSkeData, () => {
                this.clearSkeletonData(component);
            });
            complet?.();
        };

        this.loadCache({ url: imageUrl, type: Texture2D, bundle: Macro.BUNDLE_REMOTE, cacheLv }, (asscache) => {
            if (!asscache || component[AssLoaderTag.SpSkeData + "_key"] !== keyRef) {
                asscache && this.removeCache(asscache.refTag);
                return;
            }
            texAss = asscache;
            this.trackRemoteSkeletonPending(component, asscache.refTag);
            tryApply();
        }, partKey(imageUrl, Texture2D));

        this.loadCache({ url: skeUrl, type: JsonAsset, bundle: Macro.BUNDLE_REMOTE, cacheLv }, (asscache) => {
            if (!asscache || component[AssLoaderTag.SpSkeData + "_key"] !== keyRef) {
                asscache && this.removeCache(asscache.refTag);
                return;
            }
            skeAss = asscache;
            this.trackRemoteSkeletonPending(component, asscache.refTag);
            tryApply();
        }, partKey(skeUrl, JsonAsset));

        this.loadCache({ url: atlasUrl, type: TextAsset, bundle: Macro.BUNDLE_REMOTE, cacheLv }, (asscache) => {
            if (!asscache || component[AssLoaderTag.SpSkeData + "_key"] !== keyRef) {
                asscache && this.removeCache(asscache.refTag);
                return;
            }
            atlasAss = asscache;
            this.trackRemoteSkeletonPending(component, asscache.refTag);
            tryApply();
        }, partKey(atlasUrl, TextAsset));
    }

    
}