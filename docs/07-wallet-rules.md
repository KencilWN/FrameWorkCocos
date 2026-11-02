# 实验七：让Wallet拥有规则，用返回值报告结果

前置：用户已运行普通类构造/取值实验，左侧初始100，右侧初始10。现有CoinCounter仍使用自己的coins，局部wallet为临时测试对象。

预计动手10～15分钟，按实际完成和解释调整，不计作已用时间。

## 1. 清理组件模板

从Wallet.ts删除cc导入、ccclass/property解构、@ccclass('Wallet')及空start/update，保留export class Wallet、字段、constructor与getCoins。Wallet不继承Component，不挂到节点上；new执行constructor，不会让引擎自动执行start/update。

## 2. 保存上限

在Wallet中增加字段：

```ts
private maxCoinLimit: number;
```

构造函数修改为：

```ts
constructor(initialCoins: number, maxCoinLimit: number) {
    this.coins = initialCoins;
    this.maxCoinLimit = maxCoinLimit;
}
```

CoinCounter.start中的临时构造同步修改为：

```ts
const wallet = new Wallet(this.initialCoins, this.maxCoinLimit);
```

## 3. 自己迁入加币规则

在Wallet中新增tryAdd(amount: number): boolean，由用户完成方法体：

1. 计算当前余额加amount后的候选值。
2. 若候选值大于this.maxCoinLimit，直接return false；不修改余额。
3. 否则将候选值保存到this.coins，再return true。

复用已经验证过的候选值→校验→提交思路，原来的加5改为使用amount参数。这里不弹提示、不访问Label、不发UI事件。false代表拒绝，true代表已完成修改，由调用者决定怎么呈现。

此次需求仅处理原先正数增加与上限；负数、NaN、初始配置合法性尚未定义和验证，不宣称是完整通用钱包。

## 4. 临时测试

在原有Wallet初始值日志后追加：

```ts
console.log(this.node.name, '正常增加', wallet.tryAdd(this.addStep), wallet.getCoins());
console.log(this.node.name, '超额增加', wallet.tryAdd(1000), wallet.getCoins());
```

现有配置左100/5/150、右10/3/20，预期：

| 实例 | 正常增加 | 超额增加 |
| --- | --- | --- |
| 左侧 | true，105 | false，105 |
| 右侧 | true，13 | false，13 |

当前UI初始余额仍为100和10，因为测试对象还没接入显示通知。下一轮才移除组件中的重复状态，接入Wallet并处理初始化顺序。

本轮状态：2026-10-17用户提供代码与预览日志，当前正常增加和超额拒绝用例通过。源码已清理组件模板，tryAdd以newCoins<=maxCoinLimit处理成功分支，否则返回false；实现符合本轮要求，TS检查通过（skipLibCheck=true）。下一步先判断Wallet的创建时机，再由用户接入正式组件状态。
