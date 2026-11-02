import { _decorator, Component, Node } from 'cc';
import { Wallet } from './Wallet';
import { Inventory, InventoryItem } from './Inventory';
import { getItemConfig } from './ItemConfig';

export interface Shopsnapshot {
    coins:number,
    items:InventoryItem[];
}
export class ShopModel  {

    private wallet:Wallet;

    private inventory = new Inventory();

    constructor(initialCoins:number)
    {
        this.wallet = new Wallet(initialCoins,150);
    }

    public getSnapshot():Shopsnapshot
    {
        //TODO: return a snapshot of the shop state
        return {
            coins:this.getCoins(),
            items:this.getItems()
        }
    }
    

    public getCoins():number
    {
        return this.wallet.getCoins();
    }

    public getItems():InventoryItem[]
    {
        return this.inventory.getItems();
    }

    public tryBuy(itemId:string,Num:number = 1):boolean{

        const itemConfig = getItemConfig(itemId);

        if(!(Num>0 && Number.isInteger(Num)))
        {
            console.log("Buy failed, invalid Num");
            return false;
        }
        if(itemConfig!==null)
        {
            if(itemConfig.itemId !== "" && itemConfig.price >= 0&& Number.isInteger(itemConfig.price))
            {
                const bBuySuccess = this.wallet.trySpend(itemConfig.price*Num);
                if(bBuySuccess)
                {
                    const bAddSuccess = this.inventory.tryAdd(itemId,Num);
                    if(bAddSuccess)
                    {
                        return true;
                    }
                    else
                    {
                        const returnMoney = this.wallet.tryAdd(Num*itemConfig.price);
                        if(returnMoney)
                        {
                            console.log("Buy failed, return money");    
                        }
                        else
                        {
                            console.log("Buy failed, return money failed");
                        }
                        return false;
                    }     
                }
                else
                {
                    console.log("Buy failed, not enough money");
                    return false;
                }
            }
            else
            {
                console.log("Buy failed, invalid itemId or price null");
                return false;
            }
        }
        else
        {
            console.log("Buy failed, invalid itemConfig");
        }

        return false;
    }

    tryRestore(data:unknown):boolean
    {
        if(Array.isArray(data))
        {
            console.log("Store failed, invalid data"); 
            return false;
        }

        if(data == null || typeof data !== "object")
        {
            console.log("Store failed, invalid data"); 
            return false;
        }
        const snapshot = data as {coins?:unknown ,items?:unknown};

        if(typeof snapshot.coins !== "number" || !Number.isInteger(snapshot.coins) || snapshot.coins < 0)
        {
            return false;
        }

        const wallet = new Wallet(0,150);
        if(!wallet.tryAdd(snapshot.coins))
        {
            return false;
        }

        const inventory = new Inventory();
        if(!inventory.tryRestore(snapshot.items))
        {
            return false;
        }

        this.wallet = wallet;
        this.inventory = inventory;
        return true;
    }
}

