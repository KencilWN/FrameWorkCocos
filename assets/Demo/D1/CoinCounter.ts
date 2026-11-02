import { _decorator, Button, Component, Label } from 'cc';
import EventDispatcher from '../../Framework/events/EventDispatcher';
import { Wallet } from '../Wallet';

const { ccclass, property } = _decorator;
const COINS_CHANGED = 'coinsChanged';

/** 第一课：先在一个组件里看清「按钮 → 数据 → 事件 → 文字」。 */
@ccclass('CoinCounter')
export class CoinCounter extends Component {
    // 这三个引用需要你在 Creator 的 Inspector 中亲手拖入。
    @property(Label)
    coinLabel: Label | null = null;

    @property(Button)
    addButton: Button | null = null;

    @property(Button)
    resetButton: Button | null = null;

    @property
    initialCoins:number = 100;

    @property
    addStep:number = 5;

    @property
    maxCoinLimit:number = 150;

    @property(Button)
    buyButton: Button | null = null;

    @property
    purchasePrice:number = 30;

    private wallet: Wallet | null = null;

    private events = new EventDispatcher();

    onLoad(): void {
        console.log(this.node.name,'onLoad');
        if (!this.coinLabel || !this.addButton || !this.resetButton||!this.buyButton) {
            console.error('[CoinCounter] 请先绑定 coinLabel、addButton、resetButton，再预览。');

            if(this.buyButton == null) {
                console.error(this.node.name,'buyButton未绑定');
            }

            this.enabled = false;
            return;
        }

        this.wallet = new Wallet(this.initialCoins, this.maxCoinLimit);
        this.buyButton.getComponentInChildren(Label)!.string = `购买（${this.purchasePrice}）`;
        this.addButton.getComponentInChildren(Label)!.string = `增加（${this.addStep}）`;

    }

    onEnable(): void {
        if (!this.coinLabel || !this.addButton || !this.resetButton||!this.buyButton) return;

        // 监听者：收到金币变化通知后，更新文字。
        this.events.on(COINS_CHANGED, this.refreshCoins, this);

        console.log(this.node.name, '绑定后',this.events.has(COINS_CHANGED, this.refreshCoins, this));

        // 这里使用代码绑定按钮；Inspector 的 Click Events 留空。
        this.addButton?.node.on(Button.EventType.CLICK, this.addCoin, this);
        this.resetButton?.node.on(Button.EventType.CLICK, this.resetCoins, this);
        this.buyButton.node.on(Button.EventType.CLICK, this.buy, this);

        console.log(this.node.name,'[CoinCounter] onEnable：已绑定监听');

        this.refreshCoins(this.wallet.getCoins());
    }

    onDisable(): void {
        // off 使用与 on 相同的方法引用和 target，成对清理。
        this.addButton?.node.off(Button.EventType.CLICK, this.addCoin, this);
        this.resetButton?.node.off(Button.EventType.CLICK, this.resetCoins, this);
        this.buyButton?.node.off(Button.EventType.CLICK, this.buy, this);
        this.events.off(COINS_CHANGED, this.refreshCoins, this);


        console.log(this.node.name, '解绑后',this.events.has(COINS_CHANGED, this.refreshCoins, this));
        console.log(this.node.name,'[CoinCounter] onDisable：已解绑监听');
    }

    onDestroy(): void {
        this.events.offAll();
        console.log(this.node.name,'[CoinCounter] onDestroy');
    }

    private addCoin(): void {
        if (!this.wallet) return;
        const success = this.wallet.tryAdd(this.addStep);
        if (!success) {
            console.warn(this.node.name,'[CoinCounter] addCoin：已达最大金币限制', this.maxCoinLimit);
            return;
        }
        // 发送者：修改数据后，通知已经登记的监听者。
        this.events.emit(COINS_CHANGED, this.wallet.getCoins());
    }

    private buy(): void 
    {

        if(!this.wallet) return;
        const success = this.wallet.trySpend(this.purchasePrice);
        if(!success)
        {
            console.warn(this.node.name,'[CoinCounter] buy：余额不足，无法购买');
            return;
        }
        this.events.emit(COINS_CHANGED, this.wallet.getCoins());

    }

    private resetCoins(): void {
        if (!this.wallet) return;
        this.wallet.resetCoins();

        this.events.emit(COINS_CHANGED, this.wallet.getCoins());
    }

    private refreshCoins(coins: number): void {
        if (this.coinLabel) {
            this.coinLabel.string = `余额：${coins}`;
        }
        console.log(this.node.name, '[CoinCounter] refreshCoins：', coins);
    }

    start() {
        console.log(this.node.name,'start');

        //this.wallet.getCoins() = this.initialCoins;
        //this.refreshCoins(this.wallet.getCoins());
        //解耦
        //this.events.emit(COINS_CHANGED, this.wallet.getCoins());


        // const wallet = new Wallet(this.initialCoins, this.maxCoinLimit);
        // console.log(this.node.name, "Wallet initial coins:", wallet.getCoins());

        // console.log(this.node.name, '正常增加',wallet.tryAdd(this.addStep), wallet.getCoins());

        // console.log(this.node.name, '超额增加',wallet.tryAdd(1000), wallet.getCoins());


        // const testWallet = new Wallet(10, 20);

        // console.log('扣3', testWallet.trySpend(3), testWallet.getCoins());
        // console.log('扣7', testWallet.trySpend(7), testWallet.getCoins());
        // console.log('扣1', testWallet.trySpend(1), testWallet.getCoins());
        // console.log('扣0', testWallet.trySpend(0), testWallet.getCoins());
        // console.log('扣-5', testWallet.trySpend(-5), testWallet.getCoins());
    }
}
