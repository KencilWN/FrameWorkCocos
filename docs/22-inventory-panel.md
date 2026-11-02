# 实验二十二：背包界面与读取副本

2026-10-19，D02，K2进行中。实验二十一35分钟通过，本轮暂估30～45分钟。用户以聊天学习，本文仅留档；由用户写数据方法与组件、搭建场景，助手不提前实现练习。

## 本轮结果

新建InventoryMain.scene，InventoryPanel显示空状态；药水按钮每次+2、宝石按钮每次+1，Label遍历当前记录显示所有道具。只在内存创建一份背包，停止重开应为空，结构化存档下一轮接入。

单个面板持有一个Inventory，操作成功后直接refreshItems。本轮没有第二个共享界面，不额外创建InventoryOwner或事件源；已有金币场景、Wallet与WalletOwner保持原功能。

## 数据边界：getItems

在Inventory中增加public getItems(): InventoryItem[]，由用户实现：

1. 创建空的结果数组。
2. for...of遍历内部items，每条记录创建新对象加入结果。
3. 返回结果数组。

新对象加入方式：

```ts
result.push({ itemId: item.itemId, count: item.count });
```

返回的数组和记录对象都与内部数据分开。只新建数组、沿用原记录对象仍会共享count字段；本轮字段为string/number，上述逐条创建足以隔离它们。方法返回当前数据的一份副本，不开放内部数组供UI修改。

在现有D2/InventoryPractice.start原测试末尾临时追加，回到共享场景预览一次：

```ts
const snapshot = bag.getItems();
snapshot[0].count = 999;
snapshot.push({ itemId: 'fake', count: 1 });
console.log('副本修改后：', bag.getCount('potion'), bag.getCount('fake'));
```

[]下标从0开始，snapshot[0]是原测试先加入的potion记录。原测试已使potion=5、gem=3，所以预期真实potion仍5、fake仍0。验证原数组和原记录两层均未被修改。实际snapshot可修改，但不是内部数据。

## 新建InventoryPanel组件

assets/Demo/D2/InventoryPanel.ts，类与ccclass为InventoryPanel。导入cc的Component/Label/Button与../Inventory。三个Inspector引用：itemsLabel、potionButton、gemButton。

类字段private inventory = new Inventory()；本模型初始固定为空，不依赖Inspector配置，成员初始化可以直接new。不要在onEnable重建，否则每次恢复显示会丢失内存道具。

用户按以下职责实现：

| 位置 | 行为 |
| --- | --- |
| onLoad | 必要引用检查，缺失提示、enabled=false并return |
| onEnable | CLICK绑定claimPotion/claimGem及target=this，最后直接refreshItems |
| onDisable | 对应回调与target配对off，不清空背包 |
| claimPotion | tryAdd('potion', 2)，成功才refreshItems |
| claimGem | tryAdd('gem', 1)，成功才refreshItems |
| refreshItems | getItems读取副本，遍历形成多行文字，赋给Label |

refreshItems的算法：items.length为0时显示“背包为空”并return；否则先准备空字符串，循环逐行追加，循环完成后给Label赋值一次。length是数组记录条数。追加一行的写法：

```ts
text += `${item.itemId} × ${item.count}\n`;
```

字符串+=表示接在已有文字后，\n表示换行。展示遍历记录，不写死只有potion/gem两行，便于后续增加道具。组件不直接修改返回副本来发奖励；数量规则继续通过Inventory.tryAdd。

## 场景

Creator新建2D场景InventoryMain，Canvas/Camera保留，Canvas下建InventoryPanel节点，挂新组件，孩子ItemsLabel、PotionButton、GemButton分别绑定。建议Panel居中；Label局部(0,100)、尺寸约500×200；两按钮(-140,-120)/(140,-120)，文字“领取药水×2”“领取宝石×1”。实际位置可自行安排，只要可见不重叠。Button Click Events留空，保存再预览。

## 运行验收

- 副本隔离测试在原练习场景输出5、0。
- 新场景初始“背包为空”。
- 药水一次：potion × 2。
- 宝石一次：potion × 2与gem × 1，分行显示。
- 药水再一次：potion × 4与gem × 1，只保留两条道具记录。
- 停止并重开新场景：背包为空，本轮未接背包存档。

完成后报告结果和用时。副本/getItems、场景引用、初次显示和点击链路由助手审阅；当前未实现/运行，不预填通过。消耗、背包存档与结构化数据校验、独立变式仍待后续。

## 实际完成：30分钟，本轮通过

用户反馈“30分钟，结束”，未贴逐条日志，运行依据为本轮完成反馈。助手未操作Creator预览。

源码、场景与定向验证：

- getItems创建新数组并逐条push新记录，当前string/number字段与原数据隔离。助手转译实际Inventory源码，只执行新增副本契约：原potion5/gem3，修改返回副本首条count=999并push fake后，真实potion5/gem3/fake0，验证通过；未重复旧9组测试或新建测试文件。
- InventoryPractice已追加课堂副本检查；InventoryPanel按成员持有Inventory，绑定/解绑target匹配，首次刷新和成功后刷新正确。
- Label遍历全部记录、空状态和换行拼接正确；getItems的let结果数组合法，不因风格额外要求改const。
- onLoad漏绑时用户采用node.active=false并return，当前面板隐藏可阻止onEnable，接受该实现；它影响整个节点，与只禁用脚本的enabled=false范围不同，不当作同义写法，也不机械要求修正。
- InventoryMain.scene实际ItemLabel命名接受，三字段绑定正确、两Button Click Events为空、InventoryPanel组件meta对应，TypeScript检查通过。

本轮限定范围通过，无必修问题。新背包当前仍只在内存，重开为空是本轮预期。30分钟落在30～45分钟区间，维持新语法/机制综合题估时；不据此修改复杂资源/异步阶段。下一主题是数组记录存档与运行时校验，尚未布置具体实现；K2未整体通过。
