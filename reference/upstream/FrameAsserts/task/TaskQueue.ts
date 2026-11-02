import { Global } from "../../Global"
import { ErroLevel } from "../Def/typeDef"

interface AcTaskPromise extends AcTask{
   // promiseFun?:()=>Promise<any>
}

type PriorityTasks = Array<AcTaskPromise>

export interface AcTaskErro{
    desp?:string,
    bdisp?:boolean
}

export  class TaskQueue {
    /* 
    *name 任务名称
    *erroLv 异常错误处理等级
    *onProgress 进度变化函数
    *onFinish 完成处理函数
    *maxNum 同时处理的任务最大数
    */
    constructor(name:string,erroLv:ErroLevel,onProgress?:(pro:number)=>void,onFinish?:()=>void,maxNum:number=1){
        this._taskQueueName = name
        this._taskErroLv = erroLv
        this._taskProgres = onProgress
        this._taskFinish = onFinish
        if(maxNum<=0){
            throw new Error(name+"队列必须同时处理数量大于0")
        }
        this._maxTaskDoneNum = maxNum
        this._runningAsyncTasks = new Set<Promise<any>>()
    }
    // 正在运行的任务
    private _runningAsyncTasks: Set<Promise<any>>;
    private _mapQueuesPriority: Map<number,PriorityTasks> = new Map();//优先级队列    

    private isProcessing:boolean = false;
    private _taskQueueName:string = ''
    private _maxTaskDoneNum:number = 1;
    private _curFinishNum:number = 0;
    private _curMaxNum:number = 1;

    private _bStopAll:boolean = false
    private _taskErroLv:ErroLevel = ErroLevel.TOAST
    private _taskProgres?:(pro:number)=>void
    private _taskFinish?:()=>void
   
   getName(){
    return this._taskQueueName
   }

    public stopAll(){
        if(this._runningAsyncTasks.size==0){
            this.isProcessing = false;
        }        
        this._bStopAll = true
        this._mapQueuesPriority = new Map();
    }

    public skipAll(){
        this.stopAll()
        if(this._taskFinish)this._taskFinish()
    }

    /**
     * 任务队列完成回调
     */
    public complete: Function | null = null;

    /**@description priority 值越大优先级越高*/
    public addTasks(tasks:AcTask[], priority:number = 0){
        let taskpool = this._mapQueuesPriority.get(priority)
        if(!taskpool){
            taskpool = new Array<AcTaskPromise>()
            this._mapQueuesPriority.set(priority,taskpool);
        }
        let self = this
        tasks.forEach((actask:AcTask)=>{            
            taskpool.push(actask)
        })        
    }

    /**
     * 开始运行队列
     */
    public start() {
        if (this.isProcessing) {
            return;
        }
        this._bStopAll = false
        this.isProcessing = true;
        this._runningAsyncTasks = new Set<Promise<any>>()    
        this._curFinishNum = 0;
        this._curMaxNum = 0;
        this._mapQueuesPriority.forEach((v:PriorityTasks)=>{
            this._curMaxNum += v.length
        })
        console.log("curMax=====",this._curMaxNum)
        if(this._curMaxNum>0)
            this.sequenceTasksDo()
        else{
            this.skipAll()
        }   
    }

    async getTasklistDo(poolh:PriorityTasks,maxNum:number){
        if(this._bStopAll)return;
        let leftMax = poolh.length
        maxNum = leftMax<maxNum?leftMax:maxNum
        maxNum = this._maxTaskDoneNum-this._runningAsyncTasks.size<maxNum?this._maxTaskDoneNum-this._runningAsyncTasks.size:maxNum
        if(leftMax<=0){
            if(this._runningAsyncTasks.size==0) //当前排序队列空了之后再处理新排序队列
                this.sequenceTasksDo()
        }
        else{
            let self = this
            for(let idx=0;idx<maxNum;++idx){
                let cellAt = poolh.shift()
                let begintime = new Date().getTime()
                let procell = cellAt.start()
                this._runningAsyncTasks.add(procell)
                procell.then((res)=>{
                    if(self._bStopAll)return;
                    if(cellAt.finish && !self._bStopAll)cellAt.finish();                        
                    self._curFinishNum += 1;
                    let pro = self._curFinishNum/self._curMaxNum
                    let endtime = new Date().getTime()
                    console.log('['+self._taskQueueName+']',`完成${cellAt.name} 当前进度${Math.floor(pro*100)}  耗时${endtime-begintime}ms-多任务不具参考性`)
                    if(self._taskProgres)self._taskProgres(pro)
                    self._runningAsyncTasks.delete(procell) //完成后移除                    
                    self.getTasklistDo(poolh,1)
                }).catch((erro)=>{                    
                    let desp = ''
                    let bdisp = true
                    let acerro = erro as AcTaskErro
                    if(erro instanceof String)
                        desp = String(erro);
                    else if(erro.message || acerro.bdisp != null){            
                        desp = erro.message?erro.message:''        
                        if(acerro.bdisp != null)bdisp = acerro.bdisp;
                    }
                    self._curFinishNum += 1;
                    let errodesp = cellAt.name+"执行异常:"+desp
                    console.error(' ['+self._taskQueueName+']',errodesp)
                    if(bdisp)
                        dispatcher.emit("ERRO_LEVEL",cellAt.name+"任务异常",self._taskErroLv)                    
                    if(self._taskErroLv!=ErroLevel.NONE && self._taskErroLv!=ErroLevel.TOAST)
                        self.stopAll();
                    else{
                        self._runningAsyncTasks.delete(procell) //完成后移除    
                        self.getTasklistDo(poolh,1)
                        if(self._taskProgres)self._taskProgres(self._curFinishNum/self._curMaxNum)
                    }
                    Global.tastMgr?.stopTaskQueue(self._taskQueueName)
                        
                    return erro
                })
            }
        }
        
    }

    protected async sequenceTasksDo(){
        if(this._mapQueuesPriority.size<=0){            
            this.isProcessing = false;
            if(!this._bStopAll){
                if(this._curMaxNum==0){
                    if(this._taskFinish)this._taskFinish()
                }                    
                else if(this._curFinishNum>=this._curMaxNum){//这里判断是因为有可能遇到catch异常的结束，任务没走完就不调用finish
                    if(this._taskFinish)this._taskFinish()     
                } 
                               
            }            
            return;
        }
        let PriorityKeys = Array.from(this._mapQueuesPriority.keys())  
        PriorityKeys.sort((a:number,b:number)=>{return a-b}) //排序a,b,小的在前面
        let lastIdx = PriorityKeys.length-1
        let keyPriority = PriorityKeys[lastIdx]
        let poolh = this._mapQueuesPriority.get(keyPriority);//取出优先级最高的
        if(poolh.length>0)
            this.getTasklistDo(poolh,this._maxTaskDoneNum)
        else{
            this._mapQueuesPriority.delete(keyPriority)
            this.sequenceTasksDo()
        }
    }
}