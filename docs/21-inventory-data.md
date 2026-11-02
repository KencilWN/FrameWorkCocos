# 实验二十一：对象、interface与数组组成最小背包

2026-10-19，D02，K2进行中。恢复默认实操12分钟已通过，本轮是新语法主题，暂估20～30分钟，另按实际表现校准。聊天提供完整必需讲解和任务，本文仅留档；用户自写Inventory与练习组件，助手不代写业务实现。

## 当前目录与准备修复

用户将组件移入assets/Demo/D1、D2，Wallet/WalletOwner仍在Demo根目录。D1/CoinCounter.ts遗漏两条导入更新，助手仅修复EventDispatcher路径为../../Framework/events/EventDispatcher、Wallet路径为../Wallet；随后TypeScript检查通过。保留用户目录与meta，不改业务行为。D1/CoinCounterPractice和D2/ShareCoinPanel的现有导入可解析，.././Wallet等写法合法，不额外整理。

## 数据如何表示

一条记录是对象：

```ts
const item = { itemId: 'potion', count: 2 };
console.log(item.count); // 2
```

用interface声明这种对象的字段和类型，放在Inventory.ts的类外：

```ts
export interface InventoryItem {
    itemId: string;
    count: number;
}
```

interface是编译阶段的结构约定，不创建对象、不包含数量运算，不能new InventoryItem，也不会校验JSON数据。实际记录仍用对象字面量创建，数据类负责业务方法，读外部数据时另做运行时检查。

在同文件导出普通类Inventory，在类内保存：

```ts
private items: InventoryItem[] = [];
```

InventoryItem[]表示元素为这种记录的数组，[]表示初始没有道具。potion和gem是不同道具ID，当前不加商品目录约束；同一ID最多一条记录。

## 新机制示范与实现契约

getCount使用新的for...of，给出该方法示范：

```ts
public getCount(itemId: string): number {
    for (const item of this.items) {
        if (item.itemId === itemId) {
            return item.count;
        }
    }
    return 0;
}
```

每轮item是数组中的一个记录对象；找到立即返回。全部找过（包括空数组）才返回0。item引用原对象，const限制变量重新赋值，不妨碍修改对象count字段。

用户自己实现tryAdd(itemId: string, amount: number): boolean：

1. 空ID、amount非正整数返回false，原数据保持不变。
2. 用for...of查找；存在则累加该记录count并返回true，不能再添加重复记录。
3. 全部找过仍不存在，使用push增加一条记录并返回true。

新数组API示范：

```ts
this.items.push({ itemId: itemId, count: amount });
```

push在数组末尾加入对象。已有记录修改item.count，新ID才push；失败检查放在任何修改之前。规则暂为每种道具数量是正整数，无额外上限。本轮类不导入cc，不接事件或存档，是为当前Demo新增的业务模型，不宣称从GameSlot迁入通用背包框架。

## 创建与运行

- assets/Demo/Inventory.ts：导出InventoryItem接口与Inventory类。
- assets/Demo/D2/InventoryPractice.ts：练习Component，类名/ccclass为InventoryPractice，导入Inventory路径../Inventory。
- 挂到ShareCoinPanel.scene的Canvas，在start创建const bag = new Inventory()并按顺序打印操作结果。原金币组件保留，日志标注背包避免混淆。

| 顺序 | 操作 | 预期 |
| --- | --- | --- |
| 1 | getCount('potion') | 0 |
| 2 | tryAdd('potion', 2)，再读potion | true，2 |
| 3 | tryAdd('gem', 3)，再读gem | true，3 |
| 4 | tryAdd('potion', 3)，再读potion和gem | true，5，3 |
| 5 | getCount('ticket') | 0 |
| 6 | 分别tryAdd('potion', 0)、-1、1.5 | 都false，potion仍5 |
| 7 | tryAdd('', 1)，再读空ID | false，0 |

打印可沿用console.log('背包加药水2', bag.tryAdd('potion', 2), bag.getCount('potion'))形式；确保操作按顺序在同一bag上执行。每次预览start新建空背包，当前尚未有背包UI或背包持久化，下一轮再接入。

完成后报告日志与实际用时。当前仅布置，Inventory、interface/数组/for...of应用与K2均不预填通过。后续依次接消耗/背包显示、结构化存档与校验、独立变式；存储异常模拟仍保留待验证。

## 实际完成：35分钟，本轮通过

用户报告35分钟完成。Inventory.tryAdd校验、for...of查找合并与push正确；getCount依照示范实现。参数名称count和对象属性简写{itemId,count}符合契约，不要求改回amount；已有注释中的find/箭头函数/三元运算未执行，不将其算作已验证能力。

TypeScript检查通过。InventoryPractice组件已挂ShareCoinPanel.scene的Canvas且活动，meta对应。助手未操作Creator预览；用户未贴逐条日志，运行反馈为“完毕”。为确认方法返回值与状态，助手用当前TS转译真实Inventory源码并在Node执行以下9组契约，全部通过：

| 检查 | 实际结果 |
| --- | --- |
| 空背包查询potion | 0 |
| 增加potion 2 | true，2 |
| 增加gem 3 | true，3 |
| 再增potion 3，gem不变 | true，5，3 |
| 未知ticket | 0 |
| 拒绝0、-1、1.5 | 三组各为false，potion5，gem3 |
| 拒绝空ID | false，空ID0，potion5 |

该执行只在命令中验证实际源码，没有新建测试文件或代改业务代码。练习组件失败分支只打印数量，未逐项打印boolean；逻辑与助手实际执行已证明false，不把日志格式另设为通过门槛。后续实验建议同时打印操作结果和状态，让学习者能自己看到两者。

本轮范围通过，无必修代码问题。求助程度：getCount给过for...of小示范，tryAdd由用户按契约实现；不认定完整接口理论、高级数组方法和结构化存档已熟练。后续新语法综合任务暂按30～45分钟估计，与熟悉模式小扩展15～20分钟分开。下一主题为背包显示/按钮，然后接结构化存档；尚未布置下一任务，K2仍进行中。
