


import { GEvent } from "../../../Config/Def/gEnum";
import { VMType, createVM } from "../dataMV/ViewModel";
import { ErroLevel } from "../Def/typeDef";
import { TaskQueue } from "./TaskQueue";

//对游戏中所有任务进行管理，避免到处调用找出混乱
export  class TaskManager implements IModule {

    private static _instance:TaskManager = null
    static get ins(){
        if(!TaskManager._instance){
            TaskManager._instance = new TaskManager()
            TaskManager._instance.clear()
        }
        return TaskManager._instance;
    }  

    modelName: string = "【任务管理器】"
    private mapQueue:Map<string,TaskQueue> = new Map()
    //做任务统计标签
    protected mapTaskTag:Map<string,VMType<{pro:number,max:number}>> = new Map()

    /**@description 获取标签对应的任务进度*/
    getTaskTagObj(tag:string){
        let obj = this.mapTaskTag.get(tag)
        if(!obj){
            obj=createVM({pro:0,max:0},"标签任务进度")
            this.mapTaskTag.set(tag,obj)
        }
        return obj
    }

    //清空所有任务队列
    clear(){
        this.mapQueue.forEach((queue:TaskQueue)=>{
            queue.stopAll()
        })
        this.mapQueue.clear()
        this.mapTaskTag.clear()
    }

    /** 防止同一任务 Promise 被 resolve/reject 两次（对应引擎 resolveAfterPromiseResolved）。 */
    private wrapPromiseSettle<T>(
        nameTask: string,
        settle: (value: T) => void,
        kind: 'resolve' | 'reject',
    ): (value: T) => void {
        let settled = false;
        return (value: T) => {
            if (settled) {
                const err = new Error(`[TaskManager] 重复 ${kind}: ${nameTask}`);
                console.error(err.message, value, err.stack || '');
                return;
            }
            settled = true;
            settle(value);
        };
    }

    createTask(nameTask:string,startFun:(resolve:(value: any) => void,rejects:(value: any) => void)=>void,finishFun?:()=>void,tag?:string){
        let self = this
        let task:AcTask={
            name:nameTask,
            start:()=>{
                return new Promise(async (resolve, reject)=>{
                    const safeResolve = self.wrapPromiseSettle(nameTask, resolve, 'resolve');
                    const safeReject = self.wrapPromiseSettle(nameTask, reject, 'reject');
                    try{
                        await startFun(safeResolve, safeReject)
                    }catch(error){
                        console.error("执行任务报错:"+nameTask, error)
                        dispatcher.emit(GEvent.ERRO_LEVEL,"执行任务报错:"+nameTask,ErroLevel.TOAST)
                    }
                    
                })
            },
            finish:()=>{
                if(tag){
                    let obj = self.mapTaskTag.get(tag)
                    obj.pro += 1
                }
                if(finishFun)finishFun()
            }
        }
        if(tag){
            let obj = this.getTaskTagObj(tag)
            obj.max += 1;
        }
        return task
    }

    /**
     * name 任务名称
    *erroLv 异常错误处理等级
    *onProgress 进度变化函数
    *onFinish 完成处理函数
    *maxNum 同时处理的任务最大数
     */     
    addTaskQueue(name:string,erroLv:ErroLevel,onProgress?:(pro:number)=>void,onFinish?:()=>void,maxNum:number=1){        
        let queuehas = this.getTaskQueue(name)
        if(queuehas){
            queuehas.stopAll()
            this.mapQueue.delete(name)
            console.warn("任务队列中已经存在，停止并删除",name)
        }

        let queue = new TaskQueue(name,erroLv,onProgress,()=>{
            this.mapQueue.delete(name)
            if(onFinish){
                try {
                    onFinish()
                } catch (error) {
                    console.error("执行任务后onFinish报错:"+name)
                    dispatcher.emit(GEvent.ERRO_LEVEL,"执行任务后onFinish报错:"+name,erroLv)
                }
            }
            
        },maxNum)
        this.mapQueue.set(name,queue)
        return queue
    }


    /**@description 停止任务*/
    stopTaskQueue(name:string){
        let queue = this.mapQueue.get(name)
        if(queue){
            queue.stopAll()
            this.mapQueue.delete(name)
        }        
    }

    getTaskQueue(name:string){
        let queue = this.mapQueue.get(name)
        return queue
    }

}