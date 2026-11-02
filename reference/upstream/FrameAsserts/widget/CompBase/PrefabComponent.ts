
import { ResourceAudio } from "../../asset/ResourceAudio";
import ResourceLoader from "../../asset/ResourceLoader";
import { VMType } from "../../dataMV/ViewModel";
import { EventComponent } from "./EventComponent";

export class PrefabComponent extends EventComponent {

    //ui拥有的资源加载器
    resLoader: ResourceLoader = new ResourceLoader()
    protected model: VMType<any> | any

    bEnableUsed: boolean = false
    binit: boolean = false

    audio: ResourceAudio = null
    /**@description onload是创建prefab才调用，如果是节点上绑定组件是不调用的，所以onEnable要再次init*/
    protected onLoad(): void {
        this.initComp()
    }

    initComp() {
        if (!this.binit) {
            this.binit = true
            this.resLoader.name = this.node.name + "_loader"
            this.audio = new ResourceAudio()
            this.audio.initNodeLoader(this.node,this.resLoader.name)
        }
    }

    onEnable(): void {
        this.bEnableUsed = true
        this.initComp()
        this.removeListener()
        this.addListener()
        this.updateInit()
        if (this.model != undefined || this.model != null) {
            try {
                this.updateModel()
            } catch (error) {
                console.error(this.node.name + "节点调用updateModel异常报错:" + error)
            }
        }
        this.updateComp()
    }

    addListener(): void {
        this.onGE('releaseCatchDeep', this.releaseCatchDeep.bind(this));
        super.addListener();
    }

    onDisable(): void {
        this.bEnableUsed = false
        this.removeListener();
    }

    releaseCatchDeep(): void {
        this.resLoader.clearAllCatches();
    }

    setModel(m: VMType<any>) {
        //重置vm，先清理vm事件
        this.removeListener();
        this.model = m;
        if (this.enabledInHierarchy && this.bEnableUsed) {
            this.addListener()
            this.updateInit()
            if (m != undefined || m != null) {
                try {
                    this.updateModel()
                } catch (error) {
                    console.error(this.node.name + "节点调用updateModel异常报错:" + error)
                }
            }

        }
    }

    getModel() {
        return this.model
    }

    /**@description 修改数据后调用一次，激活调用一次*/
    updateInit() {

    }

    /**@description 根据数据刷新*/
    updateModel() {

    }

    updateComp() {

    }

    /**@description 销毁，包含自己加载的资源也计数器减少*/
    onDestroy() {
        if(this.resLoader){
            this.resLoader?.destroy()
            this.audio?.destroy()
            this.resLoader = null
        }else{
            console.error("销毁PrefabComponent时，resLoader为空,重复销毁: " + this.node.name)
        }
    }

}