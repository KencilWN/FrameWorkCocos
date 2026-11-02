
/**
 * @description 层级管理器
 */

import { js, Node, UITransform, Widget } from 'cc';
import { uiTf } from '../../NodeUi';
import { ECtorType } from "../../baseTs/Ctor";
import { CacheViewMgr } from "../asset/CacheViewMgr";
import { UIIndex, ViewZOrder } from "../Def/typeDef";

@ctorRegist("MgrLayer", ECtorType.Instance)
export  class MgrLayer{
    modelName = "【层级管理器】"
    /**@description  */
    private _layers: Map<number, Node> = new Map();
    /**@description ui层*/
    private _uiLayers:Map<number,Node> = new Map();

    /**@description 根节点 */
    private _root: Node = null!;

    clearAll() {    
        this._layers.forEach(v => {
            v.destroy();
        })
        this._layers.clear();
        this._uiLayers.forEach(v => {
            v.destroy();
        })
        this._uiLayers.clear();
        this._root.destroy();
        this._root = null;
    }

    clearUIByIndex(zOrder: UIIndex) {
        CacheViewMgr.ins.clearUIByIndex(zOrder);
    }

    addToLayer(node: Node, zOrder: number) {
        if(node.parent){
            node.removeFromParent()
        }
        let layer = this._layers.get(zOrder);
        if (layer) {
            layer.addChild(node);
        } else {
            console.error(`${this.modelName}未定义的层级`);
        }
    }
    addToUI(node: Node, zOrder: number) {
        if(node.parent){
            node.removeFromParent()
        }
        let layer = this._uiLayers.get(zOrder);
        if (layer) {
            layer.addChild(node);
        } else {
            console.error(`${this.modelName}未定义的层级`);
        }
    }
    getRoot(){
        return this._root
    }

    /**@description 根据layer序号获取节点*/
    getOrderRoot(zOrder: number){
        let layer = this._layers.get(zOrder);
        return layer
    }
    /**@description 根据ui层级获取节点*/
    getUIByOrder(zOrder: UIIndex){
        let layer = this._uiLayers.get(zOrder);
        return layer
    }

    initRoot(node: Node) {
        this._root = node;
        const rootTf = node.getComponent(UITransform) || node.addComponent(UITransform);
        node.getComponent(Widget)?.updateAlignment();
        function setNodeInfo(newnode: Node) {
            const uitf = newnode.getComponent(UITransform) || newnode.addComponent(UITransform);
            uitf.setContentSize(rootTf.contentSize);
            uitf.setAnchorPoint(rootTf.anchorPoint);
            const wdget = newnode.addComponent(Widget);
            wdget.alignMode = Widget.AlignMode.ALWAYS;
            wdget.isAlignLeft = wdget.isAlignRight = true;
            wdget.isAlignTop = wdget.isAlignBottom = true;
            wdget.left = 0; wdget.right = 0; wdget.top = 0; wdget.bottom = 0;
            wdget.updateAlignment();
        }
        //根据当前配置，初始化
        let viewName=["Root","UI","Loading","Toast","Alert","Wait"]
        for(let idx=0;idx<viewName.length;++idx){
            let newnode = new Node()
            newnode.name = viewName[idx];
            newnode.addComponent(UITransform);
            this._root.addChild(newnode);
            setNodeInfo(newnode)
            this._layers.set(idx, newnode);
        }
        let uiNode = this._layers.get(ViewZOrder.UI)
        let uiName=["Root","STACK","TOP","STATIC"]
        for(let idx=0;idx<uiName.length;++idx){
            let newnode = new Node()
            newnode.name = uiName[idx];
            newnode.addComponent(UITransform);
            uiNode.addChild(newnode);
            setNodeInfo(newnode)
            this._uiLayers.set(idx, newnode);
        }
    }

    /**
     * @description 走到这里面，说明游戏结束，或都重启游戏，直接清空,避免double free
     * @param node 
     */
    onDestroy(node: Node) {

    }
    
    destroy?(...args: any[]) {

    }
    clear?(...args: any[]) {

    }

    debug(config: { showChildren?: boolean, showComp?: boolean }): void {
        if ( !config ){
            config = {};
            config.showChildren = true;
            config.showComp = true;
        }
        if (this._root) {
            if (config.showChildren) {
                console.debug(`${this.modelName} 层级信息,注：该层级上无任何节点的不输出信息。`)
                this._layers.forEach(v => {
                    if (v.children.length > 0) {
                        //Log.d(`${v.userData} 层包含节点如下:`);
                        v.children.forEach(c => {
                            console.debug(`${c.name} active : ${c.active}`)
                        })
                    }
                })
            }
            if (config.showComp) {
                console.debug(`${this.modelName} 组件信息`);
                let comps: any[] = (<any>this._root)._components;
                for (let i = 0; i < comps.length; i++) {
                    console.debug(js.getClassName(comps[i]));
                }
            }
        }
    }
}
