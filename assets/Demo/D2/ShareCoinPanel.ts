import { _decorator, Button, Component, Label } from 'cc';
import EventDispatcher from '../../Framework/events/EventDispatcher';
import { Wallet } from '.././Wallet';
import { WalletOwner } from '.././WalletOwner';

const { ccclass, property } = _decorator;
const COINS_CHANGED = 'coinsChanged';

/** 第一课：先在一个组件里看清「按钮 → 数据 → 事件 → 文字」。 */
@ccclass('ShareCoinPanel')
export class ShareCoinPanel extends Component {
    // 这三个引用需要你在 Creator 的 Inspector 中亲手拖入。
    @property(Label)
    coinLabel: Label | null = null;

    @property(Button)
    addButton: Button | null = null;

    @property(Button)
    resetButton: Button | null = null;

    @property(Button)
    restoreButton: Button | null = null;

    @property
    addStep:number = 5;

    @property(Button)
    buyButton: Button | null = null;

    @property
    purchasePrice:number = 30;

    @property(WalletOwner)
    wallet: WalletOwner | null = null;


    onLoad(): void {
        console.log(this.node.name,'onLoad');
        if (!this.coinLabel || !this.addButton || !this.resetButton||!this.buyButton||!this.wallet) {
            console.error('[ShareCoinPanel] 请先绑定 coinLabel、addButton、resetButton，再预览。');

            if(this.buyButton == null) {
                console.error(this.node.name,'buyButton未绑定');
            }

            this.enabled = false;
            return;
        }

        this.buyButton.getComponentInChildren(Label)!.string = `购买（${this.purchasePrice}）`;
        this.addButton.getComponentInChildren(Label)!.string = `增加（${this.addStep}）`;

        

    }

    onEnable(): void {
        if (!this.coinLabel || !this.addButton || !this.resetButton||!this.buyButton) return;

        // 监听者：收到金币变化通知后，更新文字。
        this.wallet.events.on(COINS_CHANGED, this.refreshCoins, this);

        console.log(this.node.name, '绑定后',this.wallet.events.has(COINS_CHANGED, this.refreshCoins, this));

        // 这里使用代码绑定按钮；Inspector 的 Click Events 留空。
        this.addButton?.node.on(Button.EventType.CLICK, this.addCoin, this);
        this.resetButton?.node.on(Button.EventType.CLICK, this.resetCoins, this);
        this.restoreButton?.node.on(Button.EventType.CLICK, this.restoreWallet, this);
        //this.buyButton.node.on(Button.EventType.CLICK, this.buy, this);

        console.log(this.node.name,'[ShareCoinPanel] onEnable：已绑定监听');

        this.refreshCoins(this.wallet.getCoins());
    }

    onDisable(): void {
        // off 使用与 on 相同的方法引用和 target，成对清理。
        this.addButton?.node.off(Button.EventType.CLICK, this.addCoin, this);
        this.resetButton?.node.off(Button.EventType.CLICK, this.resetCoins, this);
        //this.buyButton?.node.off(Button.EventType.CLICK, this.buy, this);
        this.wallet.events.off(COINS_CHANGED, this.refreshCoins, this);
        this.restoreButton?.node.off(Button.EventType.CLICK, this.restoreWallet, this);


        console.log(this.node.name, '解绑后',this.wallet.events.has(COINS_CHANGED, this.refreshCoins, this));
        console.log(this.node.name,'[ShareCoinPanel] onDisable：已解绑监听');
    }

    onDestroy(): void {
    }

    private addCoin(): void {
        if (!this.wallet) return;
        const success = this.wallet.tryAdd(this.addStep);
        if (!success) {
            console.warn(this.node.name,'[ShareCoinPanel] addCoin：已达最大金币限制');
            return;
        }
    }

    // private buy(): void 
    // {

    //     if(!this.wallet) return;
    //     const success = this.wallet.trySpend(this.purchasePrice);
    //     if(!success)
    //     {
    //         console.warn(this.node.name,'[ShareCoinPanel] buy：余额不足，无法购买');
    //         return;
    //     }
    //     this.wallet.events.emit(COINS_CHANGED, this.wallet.getCoins());

    // }

    private restoreWallet(): void {
        if(!this.wallet) return;
        const bSuccess = this.wallet.restoreDefaults();
        if(!bSuccess)
        {
            console.warn(this.node.name,'[ShareCoinPanel] restoreButton：恢复默认金币数量失败');
            return;
        }
        console.log(this.node.name,'[ShareCoinPanel] restoreButton：恢复默认金币数量成功');
    }

    private resetCoins(): void {
        if (!this.wallet) return;
        this.wallet.resetCoins();
    }

    private refreshCoins(coins: number): void {
        if (this.coinLabel) {
            this.coinLabel.string = `余额：${coins}`;
        }
        console.log(this.node.name, '[ShareCoinPanel] refreshCoins：', coins);
    }

    start() {
        console.log(this.node.name,'start');
    }
}
