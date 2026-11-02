
import EventDispatcher from '../event/EventDispatcher';
import { JsonOb } from './JsonOb';

export const VM_EMIT_HEAD = 'VC:';
export const DEBUG_SHOW_PATH = false;
export const VM_DATA_KEY = '_hasChanged_'

//type Path<T extends object, K extends Extract<keyof T,string>> = K & T[K] extends ViewModel<T> ? `${K}.${Path<T[K],K>}` : never;
type KeyProperty<T extends Object> = Extract<keyof T, string>
// 简化类型定义，避免无限递归导致栈溢出
// 限制递归深度，只支持一层嵌套路径
type KeyPropertyPath<T extends Object, K extends KeyProperty<T>> = K
export type KeyPPath<T> = KeyProperty<T>
/** 通过 . 路径设置值 */
function setValueFromPath<T extends object, P extends KeyPPath<T>>(obj: T, path: P, value: any, tag: string | null = ''): void {
    const props = path.split('.');
    let current: any = obj;
    
    for (let i = 0; i < props.length - 1; i++) {
        const propName = props[i];
        if (!(propName in current)) {
            console.error(`[${propName}] not find in ${tag}.${path}`);
            return;
        }
        current = current[propName];
    }
    
    const lastProp = props[props.length - 1];
    if (!(lastProp in current)) {
        console.error(`[${lastProp}] not find in ${tag}.${path}`);
        return;
        }
    current[lastProp] = value;
}

/** 通过 . 路径获取值 */
function getValueFromPath<T extends object, P extends KeyPPath<T>>(obj: T, path: P, def?: any, tag: string | null = ''): any {
    const props = path.split('.');
    let current: any = obj;
    
    for (const propName of props) {
        if (!(propName in current)) {
            console.error(`[${propName}] not find in ${tag}.${path}`);
            return def;
        }
        current = current[propName];
    }
    
    return current == null ? def : current;
}

function setPrototypeRecursively(obj, newPrototype, visited = new WeakSet()) {
    // 防止循环引用导致无限递归
    if (visited.has(obj)) {
        return;
    }
    visited.add(obj);
    
    let currentProto = Object.getPrototypeOf(obj);
    if (currentProto == Object.prototype || currentProto == null) {
        Object.setPrototypeOf(obj, newPrototype);
    } else if (currentProto == newPrototype) {
        return;
    } else {
        setPrototypeRecursively(currentProto, newPrototype, visited);
    }
}
/**
 * ModelViewer 类
 */
class ViewModel<T extends object> extends EventDispatcher {
    constructor(data: T, tag: string, noticeSame: boolean = false, deep: boolean = false) {
        super()
        new JsonOb(data, this._callback.bind(this), noticeSame, deep);
        this.__tag = tag;
        this.__$data = data;
    }
    /**@description 把data的构造类作为eventDispacher的构造类*/
    public clonePrototype() {
        let dataProto = Object.getPrototypeOf(this.__$data)
        if (dataProto) {
            let selfProto = Object.getPrototypeOf(this)
            setPrototypeRecursively(this.__$data, selfProto)
            Object.setPrototypeOf(this, Object.getPrototypeOf(this.__$data))
        }
        // @ts-ignore  注：避免API生成工具报错
        Object.keys(this.__$data).forEach((key) => {
            let self = this;
            Object.defineProperty(self, key, {
                get: function () {
                    return this.__$data[key];
                },
                set: function (newVal) {
                    this.__$data[key] = newVal
                }
            })
        }, this)
    }
    public __$data: T
    // 索引值用的标签
    public __tag: string | null = null;

    /** 激活状态, 将会通过 director.emit 发送值变动的信号, 适合需要屏蔽的情况 */
    public __active: boolean = true;

    /** 是否激活根路径回调通知, 不激活的情况下 只能监听末端路径值来判断是否变化 */
    public __emitToRootPath: boolean = false;

    // 回调函数 请注意 回调的 path 数组是 引用类型，禁止修改
    private _callback(n: any, o: any, path: string[]): void {
        if (!this.__active) return;
        
        const key = path.join('.');
        if (DEBUG_SHOW_PATH) {
            console.log('>>', n, o, path);
        }
        
        // 发送事件通知
        this.emit(key, n, o, key); // key值改变
        this.emit(VM_DATA_KEY, n, o, key); // 自己有属性改变
    }
    // 通过路径设置数据的方法
    public setValue<P extends KeyPPath<T>>(path: P, value: any, bactive: boolean = true) {
        this.__active = bactive
        setValueFromPath(this.__$data, path, value, this.__tag);
        this.__active = true
    }

    // 获取路径的值
    public getValue<P extends KeyPPath<T>>(path: P, def?: any): any {
        return getValueFromPath(this.__$data, path, def, this.__tag);
    }
}

export type VMType<T extends Object> = ViewModel<T> & T & Object

// 检查对象是否已经是 ViewModel
function isViewModel(obj: any): boolean {
    return !!(obj.__$mdt || obj.__setValue || obj.__getValue || obj.__tag);
}

// 创建 ViewModel 的通用逻辑
function createViewModelInternal<T extends Object>(data: T, name: string, noticeSame: boolean = false, deep: boolean = false): VMType<T> {
    if (isViewModel(data as any)) {
        console.error("对象已经有类似成员变量,不能重复创建", name);
        return data as any;
    }
    const ob = new ViewModel(data, name, noticeSame, deep);
    ob.clonePrototype();
    return ob as any;
}

export function createVM<T extends Object>(data: T, name: string, noticeSame: boolean = false, deep: boolean = false): VMType<T> {
    return createViewModelInternal(data, name, noticeSame, deep);
}

// 单选逻辑：取消其他选项，选中指定索引
function updateRadioSelection(dr: any, selectedIdx: number): void {
    dr.arr.forEach((ele: VMType<IDCRadio>, idx: number) => {
        if (selectedIdx !== idx && ele && ele.choosed) {
            ele.setValue('choosed', false, false);
        }
    });
    if (dr.arr[selectedIdx] && !dr.arr[selectedIdx].choosed) {
        dr.arr[selectedIdx].setValue('choosed', true, false);
    }
    dr.setValue('radioidx', selectedIdx, true);
}

// 将数据数组转换为 ViewModel 数组
function convertToVMArray<T extends IDCRadio>(newDt: Array<T>, ob: VMType<IDCArrRadio>): Array<VMType<T>> {
    if (!newDt || newDt.length === 0) {
        return [];
    }
    
    const temp = newDt[0] as any;
    if (isViewModel(temp)) {
        return newDt as any;
    }

    const targets: Array<VMType<T>> = [];
    for (let idx = 0; idx < newDt.length; ++idx) {
        const cell = createVM(newDt[idx], 'ele' + idx);
        cell.on("choosed", (bchoose: boolean) => {
            const chooedIdx = cell.index as number;
            const dr = ob as any;
            
            if (dr.arr.length === 1) {
                dr.arr[0].setValue('choosed', true, false);
                dr.setValue('radioidx', 0, true);
            } else if (bchoose) {
                updateRadioSelection(dr, chooedIdx);
            }
        }, ob);
        targets.push(cell);
    }
    return targets;
}

export function createVMArrRadio<T extends IDCRadio>(datas: Array<T>, name: string, noticeSame: boolean = false, deep: boolean = false): VMType<IDCArrRadio> {
    if (isViewModel(datas as any)) {
        console.error("createVMArrRadio的对象已经有类似成员变量,不能重复创建", name);
        return datas as any;
    }

    const newRadioOb: IDCArrRadio = {
        radioidx: 0,
        arr: []
    };
    
    if (datas.length > 0) {
        datas[0].choosed = true;
    }
    
    const ob = createViewModelInternal(newRadioOb, name, noticeSame, deep);

    // 监听 radioidx 变化，更新选中状态
    ob.on("radioidx", (chooedIdx: number) => {
        const dr = ob as any;
        if (dr.arr && dr.arr.length > chooedIdx) {
            updateRadioSelection(dr, chooedIdx);
        }
    }, ob);

    if (!deep) {
        // 浅模式：将数据转换为 ViewModel 数组
        if (datas && datas.length > 0) {
            ob.setValue('arr', convertToVMArray(datas, ob), false);
        }

        ob.on("arr", (arrdatas: Array<T>) => {
            const newArr = convertToVMArray(arrdatas, ob);
            ob.setValue('arr', newArr, false);
        }, ob);
    } else {
        // 深模式：直接使用原始数据
        ob.setValue('arr', datas, false);
        ob.on(VM_DATA_KEY, (newV: any, path: string) => {
            const props = path.split('.');
            if (newV === true && props.length === 3 && props[0] === 'arr' && props[2] === 'choosed') {
                const chooedIdx = parseInt(props[1]);
                const dr = ob as any;
                dr.arr.forEach((ele: any, idx: number) => {
                    if (chooedIdx !== idx && ele && ele.choosed) {
                        ele.choosed = false;
                    }
                });
                dr.radioidx = chooedIdx;
            }
        }, ob);
    }
    
    return ob;
}