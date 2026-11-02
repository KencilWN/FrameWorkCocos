import { EventProcessor } from "../event/EventProcessor"


export  class Controller extends EventProcessor implements IModule{
    modelName:string = 'Controller'
            
    init(){
        this.addListener()
    }
    uninit(){
        this.removeListener()
    }
}