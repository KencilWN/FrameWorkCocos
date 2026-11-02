/**
 * @description 事件处理组件
 */

import { Node } from 'cc';


import { KeyPPath, VMType } from "../dataMV/ViewModel";

export type EventCallback = (...any: any[]) => void;
export interface EventAgrs {
    /**
     * @description 绑定事件类型
     */
    bind: "Dispatcher" | "Game" | "Input" | "Node" | "MVData";
    /**@description 事件类型名 */
    type: string;
    /**
     * @description 绑定事件的节点，bindType 为 NODE,必选参数,其它可以不用
     */
    node?: Object|Node;
    /**@description 绑定回调 */
    cb?: EventCallback;
    /**@description cb参数中的target */
    target?: unknown;
    /**@description 附加的exparam */
    exparam?: any;
    /**@description 回调会在第一时间被触发后删除自身*/
    once?: boolean;
}

export interface IEventProcessor {
    addListener(): void;
    removeListener(): void;

    /**
     * @description 注册绑定到 dbs.dispatcher 的事件
     * @param eventName 
     * @param func 
     */
    onD(eventName: string, func: EventCallback, target?: any): void;
    /**
     * @description 注册绑定到 dbs.dispatcher 只响应一次的事件
     * @param eventName 
     * @param func 
     */
    onceD(eventName: string, func: EventCallback, target?: any): void;
    /**
     * @description 反注册绑定到 dbs.dispatcher 的事件
     * @param eventName 
     * @param func 
     */
    offD(eventName: string, func: EventCallback, target?: any): void;

    /**
     *data:mv数据对象
     *type:关键字 
     */
    onVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void;
    /**
     *data:mv数据对象
     *type:关键字 
     */
    offVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void;
}

export class EventProcessor implements IEventProcessor {

    /**@description Dispatcher 事件 */
    private _eventsD: Map<string, EventAgrs> = new Map();
    /**@description mv数据事件*/
    private _eventsMv: EventAgrs[] = [];


    /**
     * 注册事件 ，在onLoad中注册，在onDestroy自动移除
     * @param name 
     * @param func 
     */
    onD(name: string, func: EventCallback, target: any) {
        this.on({
            bind: "Dispatcher",
            type: name,
            cb: func,
            target: target
        });
    }

    onceD(eventName: string, func: EventCallback, target: any): void {
        this.once({
            bind: "Dispatcher",
            type: eventName,
            cb: func,
            target: target
        });
    }
    offD(eventName: string, func: EventCallback, target: any): void {
        this.off({
            bind: "Dispatcher",
            type: eventName,
            cb: func,
            target: target
        });
    }

    onVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void {
        this.on({
            bind: "MVData",
            type: type,
            cb: cb,
            target: target,
            exparam: data,
        })
    }
    offVM<T extends VMType<any>, P extends KeyPPath<T>>(data: T, type: P, cb: EventCallback, target: any): void {
        this.off({
            bind: "MVData",
            type: type,
            cb: cb,
            target: target,
            exparam: data,
        });
    }

    addListener() {

    }

    removeListener() {
        this._cleanD();
        this._cleanVM();
    }

    on(args: EventAgrs): void {
        switch (args.bind) {
            case "Dispatcher": this._onD(args); break;
            case "MVData": this._onVM(args); break;
            default: break;
        }
    }
    once(args: EventAgrs): void {
        args.once = true;
        this.on(args);
    }

    off(args: EventAgrs): void {
        switch (args.bind) {
            case "Dispatcher": this._offD(args); break;
            case "MVData": this._offVM(args); break;
            default: break;
        }
    }

    private _onD(args: EventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        if (this._eventsD.has(args.type)) {
            console.error(`${args.type} 重复注册`);
            return;
        }
        dispatcher.on(args.type, args.cb!, args.target, args.once);
        this._eventsD.set(args.type, args);
    }

    private _offD(args: EventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        if (this._eventsD.has(args.type)) {
            //事件移除
            dispatcher.off(args.type, args.cb, args.target);
            //删除本地事件
            this._eventsD.delete(args.type);
        }
    }

    private _cleanD() {
        this._eventsD.forEach((ele, key, map) => {
            this._offD(ele);
        })
        this._eventsD.clear();
    }

    private _onVM(args: EventAgrs) {
        if (!args.exparam) {
            return
        }
        let taget = args.exparam as VMType<any>
        taget.on(args.type, args.cb!, args.target)
        this._eventsMv.push(args);
    }

    private _offVM(args: EventAgrs) {
        if (!args.exparam) {
            return
        }
        let taget = args.exparam as VMType<any>
        taget.off(args.type, args.cb, args.target);
        for (let i = 0; i < this._eventsMv.length; i++) {
            const ele = this._eventsMv[i];
            if (ele.type == args.type && ele.cb == args.cb && ele.target == ele.target) {
                this._eventsMv.splice(i, 1);
                break;
            }
        }
    }

    _cleanVM() {
        for (let i = 0; i < this._eventsMv.length; i++) {
            const ele = this._eventsMv[i];
            if (ele.exparam)
                ele.exparam.off(ele.type as unknown as any, ele.cb, ele.target);
        }
        this._eventsMv = [];
    }

    _has(datas: EventAgrs[], args: EventAgrs) {
        for (let i = 0; i < datas.length; i++) {
            const element = datas[i];
            if (element.type == args.type &&
                element.cb == args.cb &&
                element.target == args.target) {
                return true;
            }
        }
        return false;
    }
}
