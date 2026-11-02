import { Component, Node, NodeEventType } from 'cc';

/**
 * @description 事件处理组件
 */

import { KeyPPath, VMType } from "../../dataMV/ViewModel";
import { EventAgrs, EventCallback, IEventProcessor } from "../../event/EventProcessor";
import { EventProcessorEx, ICCEventAgrs } from "./EventProcessorEx";

export class EventComponent extends Component implements IEventProcessor {

    /**@description 全局的事件分发*/
    private _globalProcessor = new EventProcessorEx();
    private _globalGE: Map<string, number> = new Map();
    private _globalGEOnce: Map<string, number> = new Map();


    private _onDef(args: ICCEventAgrs): void {
        if (!args.target) args.target = this;
        this._globalProcessor.on(args);
    }
    private _onceDef(args: ICCEventAgrs): void {
        if (!args.target) args.target = this;
        this._globalProcessor.once(args as EventAgrs);
    }
    private _offDef(args: ICCEventAgrs): void {
        if (!args.target) args.target = this;
        this._globalProcessor.off(args);
    }

    onD(eventName: string, func: EventCallback): void {
        this._onDef({
            bind: "Dispatcher",
            type: eventName,
            cb: func,
        });
    }

    onceD(eventName: string, func: EventCallback): void {
        this._onceDef({
            bind: "Dispatcher",
            type: eventName,
            cb: func,
        });
    }

    offD(eventName: string, func: EventCallback): void {
        if (!func) {
            console.error("清除Dispath事件的回调函数为空");
            return
        }
        this._offDef({
            bind: "Dispatcher",
            type: eventName,
            cb: func,
        });
    }

    onG(type: string, cb: EventCallback): void {
        this._onDef({
            bind: "Game",
            type: type,
            cb: cb
        })
    }

    
    onceG(type: string, cb: EventCallback): void {
        this._onceDef({
            bind: "Game",
            type: type,
            cb: cb
        });
    }
    offG(type: string, cb: EventCallback): void {
        this._offDef({
            bind: "Game",
            type: type,
            cb: cb
        });
    }

    onI<K extends string>(eventType: K, cb: EventCallback): void {
        this._onDef({
            bind: "Input",
            type: eventType,
            cb: cb
        })
    }
    onceI<K extends string>(eventType: K, cb: EventCallback): void {
        this._onceDef({
            bind: "Input",
            type: eventType,
            cb: cb
        })
    }
    offI<K extends string>(eventType: K, cb: EventCallback): void {
        this._offDef({
            bind: "Input",
            type: eventType,
            cb: cb
        })
    }

    onN(node: Node, type: string | NodeEventType, cb: EventCallback, target?: unknown): void {
        this._onDef({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node
        })
    }
    onceN(node: Node, type: string | NodeEventType, cb: EventCallback, target?: unknown): void {
        this._onceDef({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node
        })
    }
    offN(node: Node, type: string | NodeEventType, cb: EventCallback, target?: unknown): void {
        this._offDef({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node
        })
    }

    onGE(type: string, cb: EventCallback): void {  
        let hased = this._globalGE.get(type)
        if(hased){
            console.error("register repeated by name :",type)
            return;
        }      
        let index = fwk.eventCustom.on(type, cb, this.node);
        this._globalGE.set(type, index);
    }
    onceGE(type: string, cb: EventCallback): void {
        let hased = this._globalGE.get(type)
        if(hased){
            console.error("register repeated by name :",type)
            return;
        }
        let index = fwk.eventCustom.once(type, cb, this.node);
        this._globalGEOnce.set(type, index);
    }
    offGE(type: string, cb: EventCallback): void {
        let index = this._globalGE.get(type)
        if(typeof index === 'number'){
            fwk.eventCustom.off(type, index);
            this._globalGE.delete(type);
        }
        index = this._globalGEOnce.get(type)
        if(typeof index === 'number'){
            fwk.eventCustom.off(type, index);
            this._globalGEOnce.delete(type);
        }
    }
    offGEAll(): void {
        this._globalGE.forEach((index, type) => {
            fwk.eventCustom.off(type, index);
        });
        this._globalGEOnce.forEach((index, type) => {
            fwk.eventCustom.off(type, index);
        });
        this._globalGE.clear();
        this._globalGEOnce.clear();
    }

    onVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void {
        this._onDef({
            bind: "MVData",
            type: type,
            cb: cb,
            target: target,
            exparam: data,
        })
    }
    offVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void {
        this._offDef({
            bind: "MVData",
            type: type,
            cb: cb,
            target: target,
            exparam: data,
        });
    }

    offVMAll() {
        this._globalProcessor._cleanVM();
    }

    addListener() {
        this._globalProcessor.addListener()
    }

    removeListener() {
        this._globalProcessor.removeListener()
        this.offGEAll()
    }
    onEnable() {
        this.addListener();
    }
    onDisable() {
        this.removeListener();
    }
}
