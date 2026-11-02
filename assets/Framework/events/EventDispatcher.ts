import EventList from "./EventList";

export default class EventDispatcher {

    private eventMap = {}

    constructor() {
    }
    
    public on(eventName: any = "", callback: Function, target: Object, once?:boolean) {
        let list = this.eventMap[eventName];
        if (!list) {
            list = new EventList();
            this.eventMap[eventName] = list
            list.on(callback, target);
        } else {
            if (!this.has(eventName, callback, target)) {
                list.on(callback, target);
            }
        }
        if (list.size() > 20) {
            console.warn(' EventDispatcher on  is too long ', list.size(), eventName)
        }
    }

    public has(eventName: any, callback, target): boolean {
        let list = this.eventMap[eventName];
        if (list) {
            return list.has(callback, target) >= 0
        }
        return false;
    }

    public off(eventName: any, callback: Function, target: Object) {
        let list: EventList = this.eventMap[eventName];
        if (list) {
            list.off(callback, target)
        }
    }

    public emit(eventName: any, data?: any, data2?: any, data3?) {
        let list = this.eventMap[eventName];
        if (list) {
            list.emit(data, data2, data3)
        }
    }

    public offAll() {
        this.eventMap = {}
    }

    public offByName(eventName: any) {
        let list = this.eventMap[eventName];
        if (list) {
            list.offAll();
        }
    }

}
