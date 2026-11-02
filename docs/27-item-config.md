# 实验二十七：配置决定道具名称与价格

2026-10-22，实际D03，进入阶段B，K3尚未通过。本轮暂估30～45分钟，新语法为readonly和模块级导出函数。用户写配置、查询与UI改造，助手讲声明方式与契约，聊天完整提供必要内容，本文留档。

开始前先在Creator将InventoryMain中profileId恢复A并保存，上一轮场景仍留空。不要求重做存档隔离测试。

## 目标与分工

新增assets/Demo/ItemConfig.ts，仅描述道具定义和查询，不导入cc。Inventory继续仅保存itemId/count，LocalStorage继续只存数组；配置名称和价格不进入玩家背包存档。InventoryPanel读取配置显示，后续商店复用同一份价格。

配置内容：

| itemId | displayName | price |
| --- | --- | --- |
| potion | 药水 | 10 |
| gem | 宝石 | 20 |
| ticket | 门票 | 5 |

## 声明语法

```ts
export interface ItemConfig {
    readonly itemId: string;
    readonly displayName: string;
    readonly price: number;
}
```

readonly字段限制通过该类型赋值；配置数组可写为export const ITEM_CONFIGS: readonly ItemConfig[] = [...]。readonly数组限制push/splice等修改，接口字段的readonly限制每条记录的字段赋值。均属编译期约束，不是运行时冻结、外部数据校验，也不妨碍开发者编辑源文件中的配置值。

新增模块级函数export function getItemConfig(itemId: string): ItemConfig | null。它在类外，其他模块可以导入后直接调用，无需new。函数体由用户实现：for...of遍历ITEM_CONFIGS，匹配ID返回该配置，没有匹配则返回null；仿照已学getCount的查找模式。

## UI由用户改造

D2/InventoryPanel导入../ItemConfig的getItemConfig。在refreshItems现有循环中，用当前item.itemId查配置：

- 有配置显示“药水 × 2（10金币）”等名称、数量、单价；这里只显示价格，尚未扣钱购买。
- 没配置显示原始itemId与count，页面仍显示，不报空值错误，不删除道具。
- 空背包仍沿用原空提示。
- 保留纯显示职责，不保存、不修改数量；领取后的保存逻辑保持。

函数返回ItemConfig或null，使用displayName/price前先判断null。不把字符串itemId强转成ItemConfig，也不往InventoryItem中加入名称和价格。

## 验收与恢复

1. A原有药水2/宝石1显示对应中文名称、数量与配置价格。
2. 停止，源码配置中把药水价格改为12，再运行；界面价格变12，原数量仍2。结束改回10。
3. 停止，暂时移除宝石配置，再运行；宝石这一行回退显示gem与数量1，药水正常，没有空引用异常。结束恢复宝石配置。
4. 收尾保留三条完整配置、药水价10、profileId=A；停止重开数量仍来自原A存档，不把配置变化写回玩家数据。

完成后报告结果、用时。当前尚未编写或验证；后续再引入Prefab、购买与JSON资源加载，不提前搬入产品配置系统或全局依赖。

## 实际完成：28分钟，本轮限定实现通过

用户反馈28分钟，未附逐项预览日志；运行依据其完成反馈，不声称助手预览。实际ItemConfig.ts定义了readonly字段与readonly数组，三条完整记录、药水价10；getItemConfig在类外导出，for...of查找成功返回配置，缺失告警并null；未导入cc。

InventoryPanel正确导入../ItemConfig，在循环逐条查询，null回退ID/数量，否则显示ID/价格/名称/数量；文案与示例不同但信息完整，接受，不因格式或未使用的import追加返工。refreshItems保持纯显示，Inventory/存档未混入配置字段，InventoryMain的profileId已恢复A。

TypeScript检查通过。本轮源码接入与用户完成反馈支持限定通过；改价12与临时删除宝石配置未提供单独运行日志，不伪装为助手实测。没有新增镜像查询测试或重复旧模型检查。28分钟略低于30～45估计，维持新语法综合范围；下一轮首次Prefab与动态生成按35～50分钟安排。
