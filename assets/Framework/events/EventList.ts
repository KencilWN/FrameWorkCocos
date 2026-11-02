import { Component, isValid } from 'cc';
export default class EventList {

    private list: { handler: Function, target: Object,once?:boolean }[] = [];

    on(handler: Function, target: Object,once?:boolean) {
        this.list.push({ handler: handler, target: target,once:once })
    }

    has(callback, target): number {
        for (let index = 0; index < this.list.length; index++) {
            const element = this.list[index];
            if (element.handler === callback && element.target === target) {
                return index;
            }
        }
        return -1;
    }

    size(): number {
        return this.list.length;
    }

    off(callback: Function, target: Object) {

        for (let index = 0; index < this.list.length; index++) {
            const element = this.list[index];
            if (element.handler === callback && element.target === target) {
                this.list.splice(index, 1);
                return;
            }
        }

    }

    emit(data?: any, data2?: any, data3?) {
        for (let index = 0; index < this.list.length; index++) {
            let bEmit = true
            let element = this.list[index]
            if(element.target instanceof Component){
                if(!isValid(element.target.node))bEmit = false
            }
            if(bEmit)//没有激活的节点事件不分发
            {
                element.handler.call(element.target, data, data2, data3);
                if(element.once){
                    this.list.splice(index, 1);
                    index--;
                }
            } 
        }
    }

    offAll() {
        this.list.length = 0;
    }

}
