import { _decorator, Button, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;
import {ItemConfig} from '../ItemConfig';

@ccclass('ItemCell')
export class ItemCell extends Component {


    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    priceLabel: Label = null;

    @property(Button)
    buyButton: Button = null;

    private buyCallback: (()=> void)|null = null;

    onLoad(){

    }

    public setData(data: ItemConfig,onbuy: ()=> void):void{
        if(!this.nameLabel || !this.priceLabel ||!this.buyButton){
            console.error("ItemCell: nameLabel or priceLabel or buyButton is null");
            return;
        }
        this.nameLabel.string = data.displayName;
        this.priceLabel.string = data.price.toString();

        this.buyCallback = onbuy;
    }

    private requestBuy(){
        if(this.buyCallback){
            this.buyCallback();
        }
    }
    start() {
        
    }

    update(deltaTime: number) {
        
    }

    protected onEnable(): void {
        this.buyButton?.node.on(Button.EventType.CLICK,this.requestBuy,this);
    }

    protected onDisable(): void {
        this.buyButton?.node.off(Button.EventType.CLICK,this.requestBuy,this);
    }
}

