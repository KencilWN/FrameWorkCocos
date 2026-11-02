import { _decorator, Button, Component, Label, Node } from 'cc';
import { Wallet } from '.././Wallet';
import EventDispatcher from '../../Framework/events/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('CoinCounterPractice')
export class CoinCounterPractice extends Component {

    @property(Button)
    claimButton: Button | null = null;

    @property(Button)
    resetButton: Button | null = null;

    @property(Label)
    coinLabel: Label | null = null;

    private wallet:Wallet | null = null;

    @property
    addStep:number = 12;
    @property
    maxCoinLimit:number = 30;
    @property
    initCoins:number = 0;

    events:EventDispatcher = new EventDispatcher();

    onLoad() {
        if (!this.claimButton || !this.resetButton||!this.coinLabel) {
            console.error('[CoinCounterPractice] 请先绑定 claimButton、resetButton,coinLabel，再预览。');
            this.enabled = false;
            return;
        }

        console.log(this.node.name,'onLoad');
        this.wallet = new Wallet(this.initCoins, this.maxCoinLimit);
    }

    onEnable() {
        console.log(this.node.name,'onEnable');
        this.claimButton?.node.on(Button.EventType.CLICK, this.claimCoin, this);
        this.resetButton?.node.on(Button.EventType.CLICK, this.resetCoins, this);
        this.events.on('coins-changed', this.showCoins, this);

        console.log(this.node.name,'onEnable：已绑定监听:',this.events.has('coins-changed', this.showCoins, this));

        this.events.emit('coins-changed');
    }

    onDisable() {
        console.log(this.node.name,'onDisable');
        this.claimButton?.node.off(Button.EventType.CLICK, this.claimCoin, this);
        this.resetButton?.node.off(Button.EventType.CLICK, this.resetCoins, this);
        this.events.off('coins-changed', this.showCoins, this);
        console.log(this.node.name,'onDisable：已解绑监听:',this.events.has('coins-changed', this.showCoins, this));
    }

    showCoins()
    {
        console.log(this.node.name,'当前金币数量:', this.wallet?.getCoins());
        this.coinLabel!.string = `金币数量: ${this.wallet?.getCoins()}`;
    }

    claimCoin() {
        const success = this.wallet?.tryAdd(this.addStep);
        if (success) {
            console.log(this.node.name,'成功领取金币');
        } 
        else             
        {
            console.log(this.node.name,'领取金币失败，已达上限');
            return;
        }
        console.log(this.node.name,'claimCoin');
        this.events.emit('coins-changed');
    }

    resetCoins() {
        console.log(this.node.name,'resetCoins');
        this.wallet?.resetCoins();
        this.events.emit('coins-changed');
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}

