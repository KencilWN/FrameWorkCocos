import { _decorator, Component, Node } from 'cc';
import { Inventory } from '../Inventory';
const { ccclass, property } = _decorator;

@ccclass('InventoryPractice')
export class InventoryPractice extends Component {
    start(): void {
        const bag = new Inventory()

        const restoreBag = new Inventory();
        restoreBag.tryAdd('ticket', 9);

        const ok1 = restoreBag.tryRestore([
            { itemId: 'potion', count: 2 },
            { itemId: 'potion', count: 3 },
            { itemId: 'gem', count: 1 },
        ]);
        console.log('成功恢复：', ok1, restoreBag.getItems());

        const ok2 = restoreBag.tryRestore([
            { itemId: 'potion', count: 20 },
            { itemId: 'gem', count: -1 },
        ]);
        console.log('失败恢复：', ok2, restoreBag.getItems());

        // console.log(bag.getCount('potion'));
        // console.log('背包加药水2', bag.tryAdd('potion', 2), bag.getCount('potion'));
        // console.log('背包加gem2', bag.tryAdd('gem', 3), bag.getCount('gem'));
        // bag.tryAdd('potion', 3);
        // console.log('药水+gem', bag.getCount('gem'), bag.getCount('potion'));
        // console.log('背包加ticket', "票", bag.getCount('ticket'));
        // bag.tryAdd('potion', 0);
        // console.log('背包加药水0', bag.getCount('potion'));
        // bag.tryAdd('potion', -1);
        // console.log('背包加药水-1', bag.getCount('potion'));
        // bag.tryAdd('potion', 1.5);
        // console.log('背包加药水1.5', bag.getCount('potion'));
        // bag.tryAdd('', 3);
        // console.log('背包加空字符串', bag.getCount(''));


        // const snapshot = bag.getItems();
        // snapshot[0].count = 999;
        // snapshot.push({ itemId: 'fake', count: 1 });

        // console.log('副本修改后：', bag.getCount('potion'), bag.getCount('fake'));

    }

    update(deltaTime: number) {
        
    }
}

