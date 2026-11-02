import { _decorator, Component, Node,sys } from 'cc';
import { Wallet } from './Wallet';
import EventDispatcher from '../Framework/events/EventDispatcher';
import { LocalStorage } from '../Framework/storage/LocalStorage';
const { ccclass, property } = _decorator;

const COINS_CHANGED = 'coinsChanged';
const COINS_STORAGE_KEY = 'framework-demo.wallet.coins.v1';

@ccclass('WalletOwner')
export class WalletOwner extends Component {

    private initCoins:number = 0;

    private maxCoinLimit:number = 30;

    private wallet:Wallet | null = null;

    public events = new EventDispatcher();

    private storage:LocalStorage = new LocalStorage();

    private getWallet():Wallet
    {
        if(this.wallet == null)
        {
            const saved = this.storage.getItem(COINS_STORAGE_KEY);

            let initialCoins = this.initCoins;
            if(typeof saved === "number" && saved >= 0 && saved <= this.maxCoinLimit && Number.isInteger(saved))
            {
                initialCoins = saved;
            }
            console.log(this.node.name,'WalletOwner：初始金币数量',initialCoins);
            this.wallet = new Wallet(initialCoins, this.maxCoinLimit);
        }
        return this.wallet;
    }


    getCoins():number
    {
        return this.getWallet().getCoins();
    }

    tryAdd(amount:number):boolean
    {
        const success = this.getWallet().tryAdd(amount);
        if (success) {
            this.saveCoins();
            this.events.emit(COINS_CHANGED, this.wallet.getCoins());
        }
        return success;
    }


    resetCoins():void
    {
        this.getWallet().resetCoins();
        this.saveCoins();
        this.events.emit(COINS_CHANGED, this.wallet.getCoins());
    }

    private saveCoins():void
    {
        if(this.wallet)
        {
            const bSaved =this.storage.setItem(COINS_STORAGE_KEY, this.wallet.getCoins());
            if(!bSaved)
            {
                console.warn('WalletOwner：保存金币数量失败');
            }
        }
    }

    public restoreDefaults(): boolean
    {
        const bSuccess = this.storage.removeItem(COINS_STORAGE_KEY);
        if(!bSuccess)
        {
            console.warn('WalletOwner：恢复默认金币数量失败');
            return false;
        }
        this.wallet = new Wallet(this.initCoins, this.maxCoinLimit);
        this.events.emit(COINS_CHANGED, this.wallet.getCoins());
        console.log('[恢复默认] 删除后读取：', this.storage.getItem(COINS_STORAGE_KEY));
        return true;
    }

    start() {

    }

    update(deltaTime: number) {
        
    }

    onDestroy() {
        this.events.offAll();
    }
}

