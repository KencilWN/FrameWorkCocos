import { _decorator, Component, Node, Prefab,instantiate, Label } from 'cc';
import { getItemConfig, ITEM_CONFIGS } from '../ItemConfig';
import { ItemCell } from './ItemCell';
import { ShopModel } from '../ShopModel';
import { LocalStorage } from '../../Framework/storage/LocalStorage';
const { ccclass, property } = _decorator;


const SHOP_STORAGE_KEY = 'framework-demo.shop.snapshot.v1';

@ccclass('ShopPanel')
export class ShopPanel extends Component {
    @property(Prefab)
    itemPrefab: Prefab|null = null;
    @property(Node)
    content: Node|null = null;

    @property(Label)
    coinLabel: Label|null = null;
    @property(Label)
    InventoryLabel: Label|null = null;

    private shop = new ShopModel(30);

    private storeage = new LocalStorage();

    public buyNum = 2;

    onLoad() {
        if(!this.itemPrefab || !this.content || !this.coinLabel || !this.InventoryLabel) 
        {
            console.error("itemPrefab or content is null");
            this.node.active = false;
            return;
        }
        this.loadShop();
    }

    protected start(): void {
        for(let i = 0; i < ITEM_CONFIGS.length; i++) {
            let itemConfig = ITEM_CONFIGS[i];
            let itemNode = instantiate(this.itemPrefab);
            this.content.addChild(itemNode);
            let itemCell = itemNode.getComponent(ItemCell);
            if(itemCell) {
                itemCell.setData(itemConfig,()=>{
                    this.handleBuy(itemConfig.itemId);
                });
            }
            else {
                console.error("itemCell is null");
            }
        }
        this.refreshShop();
    }

    private handleBuy(itemId:string):void {
        const bSuccess = getItemConfig(itemId);
        if(bSuccess !== null) {
            const bBuySuccess = this.shop.tryBuy(itemId,this.buyNum);
            if(bBuySuccess) {
                console.log("buy success");
                this.saveShop();
                this.refreshShop();
            }else
            {
                console.error("buy failed");
            }
        }else
        {
            console.error("itemConfig is not exist");
        }
    }

    private refreshShop():void {
        this.coinLabel.string = this.shop.getCoins().toString();
        let str = "";
        for(const items of this.shop.getItems()) {
            str += "ID:"+items.itemId+ " Count:"+items.count + "\n";
        }

        if(str === "") {
            str = "背包为空";
        }
        this.InventoryLabel.string = str;
    }

    private runRestoreCheck():void {
        const model  = new ShopModel(30);


        const bSccess =  model.tryBuy("potion");
        if(bSccess)
        {
            console.log("restore check success");
            console.log( JSON.stringify(model.getSnapshot()));
        }

        const data = {
            coins: 0,
            items: [
                { itemId: 'gem', count: 2 },
                { itemId: 'ticket', count: -1 }
            ]
        }

        const bsuccess = model.tryRestore(data);

        console.log( bsuccess+JSON.stringify(model.getSnapshot()));

        const data2 = {
            coins: 0,
            items: [
                { itemId: 'gem', count: 2 }
            ]
        }

        const bsuccess1 = model.tryRestore(data2);
        console.log( bsuccess1+JSON.stringify(model.getSnapshot()));


    }
    //目标为在打开界面时获取localstorage中获取数据，如果有数据则恢复shopmodel，如果没有则创建新的shopmodel
    //成功恢复后，可以获取localstorage数据进行恢复，成功购买后，可以将shopmodel数据保存进storage中
    //失败的话，无法恢复每次进入商店界面都会创建新的shopmodel，或者购买物品后无法保存数据
    //我的直观方案是每次打开界面loadmodel，然后在handlebuy，bBuySuccess中添加savemodel
    //loadmodel中添加tryLoad恢复数据，检查内容与格式是否合法，合法则恢复，不合法则创建新的shopmodel
    //savemodel中添加trysave，检查内容与格式是否合法，合法则保存，不合法则不保存

    private loadShop(): void
    {
        let shopTemp = new ShopModel(30);
        const data = this.storeage.getItem(SHOP_STORAGE_KEY) ;
        if(data!== null) {
            
            const bSuccess = shopTemp.tryRestore(data);
            if(bSuccess) {
                console.log("load success");
            }
            else {
                console.error("load failed");
            }
        }
        this.shop = shopTemp;
    }
    private saveShop(): void
    {
        const data = this.shop.getSnapshot();
        const bSucces = this.storeage.setItem(SHOP_STORAGE_KEY, data);
        if(bSucces) {
            console.log("save success");
        }
        else {
            console.error("商店保存失败，当前购买结果尚未持久化");
        }
    }
}

