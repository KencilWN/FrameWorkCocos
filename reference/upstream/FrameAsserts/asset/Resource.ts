import {
    Asset,
    AudioClip,
    Component,
    Font,
    isValid,
    js,
    JsonAsset,
    Node,
    ParticleAsset,
    Prefab as CCPrefab,
    sp,
    SpriteAtlas,
    SpriteFrame,
    Texture2D,
} from 'cc';
import { PrefabComponent } from "../widget/CompBase/PrefabComponent";
import { ViewStatus } from "./Enums";

export const tagCache = "TagBundleCache"
/**@description 资源相关 */
export namespace Resource {
    export function getKey(url: string, type: typeof Asset | Asset,bundle:string) {
        if(!url){
            console.error("ddsssssssssssssssss")
        }
        if (url.indexOf(js.getClassName(type)) >= 0) {
            return url;
        }
        return `${bundle}_${url}(${js.getClassName(type)})`;
    }

    /**@description 资源加载器错误 */
    export enum LoaderError {
        /**@description 完美加载 */
        SUCCESS,
        /**@description 加载中 */
        LOADING,
        /** @description 未找到或设置加载资源*/
        NO_FOUND_LOAD_RESOURCE,        
    }
    /**@description 资源缓存类型 */
    export enum CacheStatus {
        /**@description 无状态 */
        NONE,
        /**@description 等待释放 */
        WAITTING_FOR_RELEASE,
    }
    /**@description 资源类型 */
    export enum Type {
        /**@description 本地 */
        Local,
        /**@description 远程资源 */
        Remote,
    }
    export interface Data {
        /**@description resources 目录url 与 type 必须成对出现*/
        url?: string,        
        bundle?: string,
        /**@description 资源类型 与 url 必须成对出现*/
        type?: typeof Asset,
        /**@description 默认为true*/
        cacheLv?:number
    }

    export class Cache implements Data{

        /**@description 资源url */
        url: string = "";
        /**@description 资源类型 */
        type: typeof Asset = null!;
        /**@description 资源所在bundle */
        bundle: string = null!;
        /**@description 缓存级别，0低，1中，2高*/
        cacheLv:number = 0

        constructor(url: string, type: typeof Asset, bundle: string,clv?:number) {
            this.url = url;
            this.type = type;
            this.bundle = bundle;
            this.cacheLv = clv?clv:0
        }

        /**@description 缓存的key值 */
        get key() {
            return getKey(this.url, this.type,this.bundle);
        }

        /**@description 描述 */
        get description() {
            let typeStr = js.getClassName(this.type);
            if (this.resourceType == Resource.Type.Local) {
                return `本地 : [${typeStr}]${this.fullUrl}`;
            }
            return `远程 : [${typeStr}]${this.fullUrl}`;
        }

        /**@description 资源全路径 */
        get fullUrl() {
            if (this.resourceType == Resource.Type.Local) {
                return `${this.bundle}/${this.url}`;
            } else {
                return this.url;
            }
        }
        
        
        /**@description 资源引用添加，针对每次取缓存数据的时候使用*/
        public addRef(key:string) {
            if (!this.isLoaded) return;
            if(this._refSet.has(key))return;
            this._refSet.add(key)
            if(this.refCacheCount==1 && this.data )
                this.data.addRef();
        }
        /**@description 资源引用减少，针对每次资源取消使用的时候*/
        public delRef(key:string) {
            if (!this.isLoaded) return;
            if (!this._refSet.delete(key)) return;
            if(this.refCacheCount==0 && this.data )
                this.data.decRef();
        }
        

        /**@description 加载完成数据 
         * CCPrefab 
         * SpriteAtlas 
         * SpriteFrame 
         * AudioClip 
         * Font 
         * sp.SkeletonData 
         * ParticleAsset 
         * Texture2D
         * JsonAsset
         * */
        private _data: Asset = null!;
        set data(dt:Asset){
            //设置的对象添加一次计数器，防止释放     
            if(this._data){
                console.error(`${this.fullUrl}已经存在资源数据，不能重复设置`);
                return;
            }       
            this._data = dt
            this.addRef(tagCache+this.bundle)
        }
        get data(){return this._data}

        /**@description 引用路径*/
        private _refSet:Set<string> = new Set()
        /**@description 被动态引用的次数 */
        get refCacheCount(){return this._refSet.size};
        reflists(){
            const listRef:string[] = Array.from(this._refSet);
            return listRef
        }
        /**@description 默认为本地资源 */
        resourceType: Type = Type.Local;
        /**@description 加入释放资源的時間戳 */
        stamp: number | null = null;

        /**@description 是否已经加载完成 */
        _isLoaded: boolean = false;
        get isLoaded(){
            return this._isLoaded;
        }
        set isLoaded(bl:boolean){
            this._isLoaded = bl;
        }

        status: CacheStatus = CacheStatus.NONE;

        /**@description 在加载过程中有地方获取,加载完成后再回调 */
        getCb: ((data: any) => void)[] = [];

        /**@description 完成回调，在资源正在加载过程中，又有其它地方调用加载同一个资源，此时需要等待资源加载完成，统一回调 */
        finishCb: ((data: any) => void)[] = [];

        public doGet() {
            for (let i = 0; i < this.getCb.length; i++) {
                if (this.getCb[i]) this.getCb[i]([this, this.data]);
            }
            this.getCb = [];
        }

        public doFinish(data: any) {
            for (let i = 0; i < this.finishCb.length; i++) {
                if (this.finishCb[i]) this.finishCb[i](data);
            }
            this.finishCb = [];
        }

        public get isInvalid() {
            return this.isLoaded && this.data && !isValid(this.data);
        }
    }

    export class AssCache{
        constructor(cache:Resource.Cache){
            this.cache = cache;
        }        
        private _refTag:string = '';
        get refTag(){return this._refTag}
        set refTag(name:string){
            this._refTag = name
            if(this.cache)this.cache.addRef(name)
        }
        clearRef(){
            if(this.cache){
                this.cache.delRef(this._refTag)
            }
        }
        /**@description 资源缓存信息 如果是场景中节点创建，那么就没有cache*/
        cache: Cache = null!;
    }

    
    export class Prefab {
        parentName:string = ''
        /**@description 名字*/
        tag:string = '';
        /**@description 资源缓存信息 如果是场景中节点创建，那么就没有cache*/
        cache: Cache = null!;
        node: Node = null!;
    }

    

    export interface IUIView extends Component{
        name: string
        bundleName: string;
        viewData: ViewData;
        onClose(): void
        /** 旧大厅 popupList 关闭通知（由 ViewData.toRelease 统一调用） */
        notifyLobbyPopupClosed?(): void;
        startView();
        initOpenInfo(openInfo:any);
        setModel(data: any): void
    }
    export interface IUIViewParam {
        bundle: string
        uiId: number
        eName: string
        pathUrl:string
        order:number
        catch:number
        wait:number
        data?: any
    }

    export class ViewData {
        /**@description 实际显示界面,uiView用于打开关闭通用处理入口，也可以没有这类组件 */
        view?: IUIView = null!;
        /**@description 层级*/
        zorder: number = 0
        //pb节点
        nodePb: Resource.Prefab = null!;
        /**@description 状态*/
        state: ViewStatus = ViewStatus.NONE
        /**打开ui的参数*/
        openPaream: IUIViewParam= null
        /***/
        loadOverCall: Function[] = []
        /** CacheViewMgr：非 root 层级异步加载中，已计入 UIMgr 的 solidify 加载计数，尚未 addToUI */
        pendingSolidifyInflight: boolean = false

        toRelease() {
            if (this.view && isValid(this.view)) {
                this.view.onClose();
                this.view.notifyLobbyPopupClosed?.();
            } else {
                console.warn("释放的UI" + this.openPaream.uiId + " 不是UIView类型")
            }
            if (isValid(this.nodePb.node))
                this.nodePb.node.removeFromParent();
            return true;
        }

        destroy() {
            if (isValid(this.nodePb.node)) {
                this.nodePb.cache.delRef(this.nodePb.parentName + this.nodePb.tag)
                this.nodePb.node.destroy();
                let uiName = this.view ? this.view.name : this.openPaream.uiId
                console.debug(`销毁UI : ${uiName}`);
            }
        }
    }
    

    export class Audio{
        parentName:string = ''
        /**@description 名字*/
        tag:string = '';
        /**@description 资源缓存信息 如果是场景中节点创建，那么就没有cache*/
        cache: Cache = null!;
        node: Node = null!;
        audioType:number;//audioType=0表示music,1表示sound
    }

}
