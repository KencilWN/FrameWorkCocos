# 实验六：第一个普通 TypeScript 数据类

前置：组件配置实验已由用户确认通过，场景保存为左100/5/150、右10/3/20。用户实际字段名为maxCoinLimit，后续沿用，不要求改名成教程示例的maxCoins。

## 本轮目标

先建立一个只保存和读取金币的普通类Wallet，认识constructor、new和带返回值的方法。下一轮再逐步迁入增加/上限规则，最终由它接管正式余额，组件负责按钮和显示。

本轮只做构造/取值小实验，现有计数器继续运行；不提前引入存档、UI管理器或全局单例。当前新增脚本由用户亲手创建，不由助手代写到assets。

## 1. 创建Wallet.ts

在assets/Demo下新建Wallet.ts，使用以下内容。若Creator生成了Component模板，将其替换成这个普通类。

```ts
export class Wallet {
    private coins: number;

    constructor(initialCoins: number) {
        this.coins = initialCoins;
    }

    getCoins(): number {
        return this.coins;
    }
}
```

- Wallet只用TS/JS能力，不导入cc、不继承Component、不需要ccclass/property，不挂到节点上。
- constructor是构造函数，在new Wallet(...)时执行；传入的初始数字成为initialCoins参数。
- this.coins保存当前这个Wallet实例的状态。
- getCoins(): number承诺返回数字；return this.coins把值交给调用者。此前return;只是结束方法，这里还带回结果。
- 没写private的getCoins方法可由外部调用；内部coins字段保留private。

## 2. 从现有组件做最小调用

在CoinCounter.ts顶部增加具名导入：

```ts
import { Wallet } from './Wallet';
```

在现有start方法末尾临时添加：

```ts
const testWallet = new Wallet(this.initialCoins);
console.log(this.node.name, 'Wallet初始值', testWallet.getCoins());
```

保留原有初始化与事件通知。这里创建的是单独测试对象，尚未替换计数器正式使用的coins字段；避免把这一步当成已经完成数据层迁移。

## 3. 运行与观察

保存脚本并刷新预览，左侧应打印Wallet初始值100，右侧应打印10。两个CoinCounter各自执行start，所以各创建一次自己的测试对象并各有一条日志。

原有按钮、上限与显隐仍正常。测试对象没有引用Label/Button，说明保存/读取数字可以独立于场景组件。

## 下一步的边界

完成本轮后再自己为Wallet添加有返回值的增加方法，迁入上限检查，然后用唯一的数据对象替换组件的coins。到那一步会重新安排初始化位置，保证onEnable刷新时数据对象已就绪；当前不提前重构。

本轮状态：2026-10-17用户提供左100、右10的运行日志，构造/取值按预期。源码仍有Creator模板残留（cc导入、装饰器及空start/update），已转入[下一步](07-wallet-rules.md)由用户清理；当前还未接管组件正式余额。进度集中在progress.md。
