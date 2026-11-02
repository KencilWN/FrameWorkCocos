import { game, isValid, Node, NodeEventType } from 'cc';
import { EventAgrs, EventCallback, EventProcessor } from "../../event/EventProcessor";

export interface ICCEventAgrs{
    /**
	     * @description 绑定事件类型
	     */
    bind: "Dispatcher" | "Game" | "Input" | "Node" | "MVData";
    /**@description 事件类型名 */
    type: string | NodeEventType;
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

export class EventProcessorEx extends EventProcessor {

    /**@description game 事件 */
    private _eventsG: ICCEventAgrs[] = [];
    /**@description node 事件 */
    private _eventsN: ICCEventAgrs[] = [];
    /**@description  输入事件*/
    private _eventsI: ICCEventAgrs[] = [];

    onG(type: string, cb: EventCallback, target:any): void {
        this.on({
            bind: "Game",
            type: type,
            cb: cb,
            target:target
        })
    }
    onceG(type: string, cb: EventCallback, target:any): void {
        this.once({
            bind: "Game",
            type: type,
            cb: cb,
            target:target
        });
    }
    offG(type: string, cb: EventCallback, target:any): void {
        this.off({
            bind: "Game",
            type: type,
            cb: cb,
            target:target
        });
    }
    onN(node: Node, type: string | NodeEventType, cb: EventCallback, target?: unknown, useCapture?: any): void {
        this.on({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node,
        });
    }
    onceN(node: Node, type: string, cb: EventCallback, target?: unknown, useCapture?: any): void {
        this.once({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node
        })
    }
    offN(node: Node, type: string | NodeEventType, cb: EventCallback, target?: unknown, useCapture?: any): void {
        this.off({
            bind: "Node",
            type: type,
            cb: cb,
            target: target,
            node: node
        });
    }

    addListener() {
        super.addListener()
    }

    removeListener(){
        super.removeListener()
        this._cleanG();
        this._cleanN();
    }

    on(args: ICCEventAgrs): void {
        // 转换为 EventAgrs 类型，确保 type 是 string
        // Node.EventType 是枚举，可以安全转换为字符串
        const eventArgs: EventAgrs = {
            ...args,
            type: String(args.type)
        } as EventAgrs;
        super.on(eventArgs);
        switch (args.bind) {
            case "Game": this._onG(args); break;
            case "Node": this._onN(args); break;            
        }
    }
    off(args: ICCEventAgrs): void {
        // 转换为 EventAgrs 类型，确保 type 是 string
        // Node.EventType 是枚举，可以安全转换为字符串
        const eventArgs: EventAgrs = {
            ...args,
            type: String(args.type)
        } as EventAgrs;
        super.off(eventArgs);
        switch (args.bind) {
            case "Game": this._offG(args); break;
            case "Node": this._offN(args); break;
        }
    }

    private _onG(args: ICCEventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        if (game.hasEventListener(args.type as string)) {
            return;
        }
        game.on(args.type as string, args.cb!, args.target, args.once);
        this._eventsG.push(args);
    }

    private _offG(args: ICCEventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        game.off(args.type as string, args.cb, args.target);
        for (let i = 0; i < this._eventsG.length; i++) {
            const ele = this._eventsG[i];
            if (ele.type == args.type && ele.cb == args.cb && ele.target == ele.target) {
                this._eventsG.splice(i, 1);
                break;
            }
        }
    }

    private _cleanG() {
        for (let i = 0; i < this._eventsG.length; i++) {
            const ele = this._eventsG[i];
            game.off(ele.type as string, ele.cb, ele.target);
        }
        this._eventsG = [];
    }

    private _hasEventN(args: ICCEventAgrs): boolean {
        for (let i = 0; i < this._eventsN.length; i++) {
            const ele = this._eventsN[i];
            if (ele.node === args.node && ele.type === args.type && ele.cb === args.cb && ele.target === args.target) {
                return true;
            }
        }
        return false;
    }

    private _onN(args: ICCEventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        if (!isValid(args.node)) {
            return;
        }
        if (this._hasEventN(args)) {
            return;
        }
        const eventType = args.type as string;
        if (args.once) {
            (args.node as Node)?.once(eventType, args.cb!, args.target);
        } else {
            (args.node as Node)?.on(eventType, args.cb!, args.target);
        }
        this._eventsN.push(args);
    }

    private _offN(args: ICCEventAgrs) {
        if (!args.target) {
            args.target = this;
        }
        const eventNode = args.node as Node;
        if (isValid(eventNode)) {
            const eventType = args.type as string;
            if (!eventNode.hasEventListener || !eventNode.hasEventListener(eventType)) {
                // 节点上可能已被 once 消费，仍继续从本地列表移除
            } else {
                try {
                    eventNode.off(eventType, args.cb, args.target);
                } catch (error) {
                    console.warn(`[EventProcessorEx] off node event failed: ${eventType}`, error);
                }
            }
        }
        for (let i = 0; i < this._eventsN.length; i++) {
            const ele = this._eventsN[i];
            if (ele.node === args.node && ele.type === args.type && ele.cb === args.cb && ele.target === args.target) {
                this._eventsN.splice(i, 1);
                break;
            }
        }
    }

    private _cleanN() {
        for (let i = 0; i < this._eventsN.length; i++) {
            const ele = this._eventsN[i];
            const eventNode = ele.node as Node;
            if (!isValid(eventNode)) {
                continue;
            }
            const eventType = ele.type as string;
            try {
                if (!eventNode.hasEventListener || eventNode.hasEventListener(eventType)) {
                    eventNode.off(eventType, ele.cb, ele.target);
                }
            } catch (error) {
                console.warn(`[EventProcessorEx] clean node event failed: ${eventType}`, error);
            }
        }
        this._eventsN = [];
    }
}