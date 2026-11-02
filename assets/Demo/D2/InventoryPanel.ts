import { _decorator, Button, Component, Label, labelAssembler, Node } from 'cc';
import { Inventory } from '../Inventory';
import { LocalStorage } from '../../Framework/storage/LocalStorage';
import { getItemConfig } from '../ItemConfig';
const { ccclass, property } = _decorator;

const INVENTORY_STORAGE_KEY = 'framework-demo.inventory';

@ccclass('InventoryPanel')
export class InventoryPanel extends Component {

    @property(Button)
    potionButton:Button | null = null;

    @property(Button)
    gemButton:Button | null = null;

    @property(Label)
    itemsLabel:Label | null = null;

    @property
    profileId: string = 'A';

    private inventory:Inventory  = new Inventory();

    private storage = new LocalStorage();




    onLoad():void {
        if(this.potionButton == null|| this.gemButton == null ||this.itemsLabel == null)
        {
            console.error("请先绑定this.potionButton,this.gemButton,this.itemsLabel")
            this.node.active = false;
            return;
        }

        if(this.profileId == 'A' || this.profileId == 'B')
        {
            this.loadItems();
        }
        else
        {
            console.error("请先设置profileId为A或B")
            this.node.active = false;
            return;
        }


    }

    onEnable():void {
        this.potionButton?.node.on(Button.EventType.CLICK,this.claimPotion,this);
        this.gemButton?.node.on(Button.EventType.CLICK,this.claimGem,this);

        this.refreshItems();
    }

    onDisable():void {
        this.potionButton?.node.off(Button.EventType.CLICK,this.claimPotion,this);
        this.gemButton?.node.off(Button.EventType.CLICK,this.claimGem,this);
    }

    private claimPotion():void{
        const bSuccess = this.inventory.tryAdd("potion",2);
        if(bSuccess)
        {
            this.refreshItems();
            this.saveItems();
        }
    }

    private claimGem():void{
        const bSuccess = this.inventory.tryAdd("gem",1);
        if(bSuccess)
        {
            this.refreshItems();
            this.saveItems();
        }
    }


    private refreshItems():void
    {
        const itemCopy = this.inventory.getItems();
        if(itemCopy.length === 0)
        {
            console.log("背包为空")
            this.itemsLabel.string = "背包为空";
            return;
        }

        let text = "";

       
        for(const item of itemCopy)
        {
            const config = getItemConfig(item.itemId);
            if(config == null)
            {
                text += `${item.itemId} × ${item.count}\n`;
            }
            else
            {
                text += `ID：${config.itemId} × 单价：${config.price} × 名字：${config.displayName}× 数量${item.count} \n`;
            }
            
        }
        this.itemsLabel.string = text;
    }

    private loadItems():void
    {

        const strKey = this.getStorageKey();
        const saved = this.storage.getItem(strKey);
        if(saved === null)
        {
            return;
        }
        
        const bSccess = this.inventory.tryRestore(saved);
        if(!bSccess)
        {
            console.error("加载失败，use empty inventory")
        }   
    }

    private saveItems():void
    {
        const strKey = this.getStorageKey();
        const bSccess = this.storage.setItem(strKey,this.inventory.getItems());
        if(!bSccess)
        {
            console.error("保存失败");
        }
        else
        {
            console.log('保存成功',strKey);
        }
    }

    private getStorageKey():string
    {
        return `${INVENTORY_STORAGE_KEY}.${this.profileId}.items.v1`;
    }

    start() {
        
    }

    update(deltaTime: number) {
        
    }
}

