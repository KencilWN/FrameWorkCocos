export interface InventoryItem {
    itemId: string;
    count:number;
}


export class Inventory {
    private items: InventoryItem[] = [];


    public getItems(): InventoryItem[] {

        let itemsCopy: InventoryItem[] = [];
        for (const item of this.items) {
            itemsCopy.push({ itemId: item.itemId, count: item.count });
        }
        return itemsCopy;
    }

    public getCount(itemId: string): number {
        // const item = this.items.find(i => i.itemId === itemId);
        // return item ? item.count : 0;

        if(itemId == "")
        {
            console.warn('Inventory.getCount: itemId must be a non-empty string.');
            return 0;
        }

        for (const item of this.items) {
            if(item.itemId === itemId) {
                return item.count;
            }
        }

        return 0;
    }

    public tryAdd(itemId:string, count:number):boolean {
        if(count <= 0 || !Number.isInteger(count))
        {
            console.warn('Inventory.tryAdd: count must be a positive integer.');
            return false;
        }
        if(itemId == "")
        {
            console.warn('Inventory.tryAdd: itemId must be a non-empty string.');
            return false;
        }

        for (const item of this.items) {
            if(item.itemId === itemId) {
                item.count += count;
                return true;
            }
        }
        this.items.push({ itemId, count });
        console.log('背包新增物品', itemId, count);
        return true;
    } 

    public tryRestore(data:unknown):boolean
    {

        if(!Array.isArray(data))
        {
            console.warn('Inventory.truRestore: data must be an array.');
            return false;
        }

        const candidate = new Inventory();

        for (const rawItem of data) {

            if(typeof rawItem !== 'object'|| rawItem ===null)
            {
                return false;
            }

            const raw = rawItem as {itemId?:unknown;count?:unknown;}

            if(typeof raw.itemId !== 'string' || typeof raw.count !== 'number')
            {
                console.warn('Inventory.truRestore: data must be an array of objects with itemId and count properties.');
                return false;
            }
           
        
            const bSuccess = candidate.tryAdd(raw.itemId, raw.count);
            if(!bSuccess)
            {
                console.warn('Inventory.truRestore: failed to add item to candidate inventory.');
                return false;
            }    
        }
        
        this.items = candidate.getItems();

        return true;
    }
}