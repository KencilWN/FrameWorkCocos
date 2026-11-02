import { _decorator, Button, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PanelToggle')
export class PanelToggle extends Component {

    @property(Node)
    panel:Node | null = null;

    @property(Button)
    DestroyLeftButton:Button | null = null;


    onEnable():void
    {
        this.node.on(Button.EventType.CLICK,this.togglePanel,this);

        this.DestroyLeftButton?.node.on(Button.EventType.CLICK, this.destroyPanel, this);
    }

    onDisable():void
    {
        this.node.off(Button.EventType.CLICK,this.togglePanel,this);

        this.DestroyLeftButton?.node.off(Button.EventType.CLICK, this.destroyPanel, this);
    }


    private togglePanel():void
    {
        if(this.panel)
        {
            this.panel.active = !this.panel.active;
        }
    }


    private destroyPanel():void
    {
        if(this.panel)
        {
            this.panel.destroy();
            this.panel = null;
        }
    }

    update(deltaTime: number) {
        
    }
}

