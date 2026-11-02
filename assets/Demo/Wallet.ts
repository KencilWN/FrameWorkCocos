
export class Wallet {

    private coins:number = 0;

    private maxCoinLimit:number = 150;

    constructor(initialCoins:number, maxCoinLimit:number)
    {
        this.coins = initialCoins;
        this.maxCoinLimit = maxCoinLimit;

    }   
    
    getCoins():number
    {
        return this.coins;
    }

    public tryAdd(amount:number):boolean
    {
        const newCoins = this.coins + amount;
        if (newCoins <= this.maxCoinLimit) {
            this.coins = newCoins;
            return true;
        }
        return false;
    }

    public resetCoins():void
    {
        this.coins = 0;
    }

    public trySpend(amount:number):boolean
    {
        if(amount >0 && this.coins >= amount)
        {
            this.coins -= amount;
            return true;
        }
        return false;
    }


}

