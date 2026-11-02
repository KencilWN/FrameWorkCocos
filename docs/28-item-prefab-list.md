# 实验二十八：一份商品Prefab，生成多行配置

2026-10-22，D03，阶段B，K3进行中。配置课28分钟限定实现通过。首次Prefab编辑器与动态生成组合暂估35～50分钟；用户创建代码、场景、绑定和Prefab，助手讲机制、审阅，不代写练习实现。聊天完整提供必要操作。

## 结果与概念

一份ItemCell.prefab，运行ShopMain后按ITEM_CONFIGS生成三行：药水10金币、宝石20金币、门票5金币。页面负责创建条目，ItemCell负责显示一条配置。配置继续用Demo/ItemConfig.ts，普通数据类与旧背包场景保持现有行为。

Prefab是Project中的节点模板资源；instantiate(prefab)创建包含节点、孩子和组件的一份独立运行实例；addChild挂入场景；getComponent(ItemCell)取得实例根节点上已有的组件，setData交入配置。不是new一个普通类来创建整行UI。

已核对本机Creator3.8.7 cocos/serialization/instantiate.ts的Prefab→Node重载，以及cocos/ui/layout.ts的VERTICAL、CONTAINER、spacingY。Spins的assets/Scripts/Common/CommonReward/UListGiftItems.ts:updateModel（约511行）也用instantiate(prefabGiftItem)创建条目并挂到容器，随后交数据。本轮只使用所需原生机制，尚未迁移PrefabComponent及其资源/事件依赖。

## 1. 用户创建ItemCell

在Creator创建assets/Demo/D3目录与ItemCell.ts，类名/ccclass为ItemCell，继承Component，导入cc的Label及../ItemConfig的ItemConfig。两个Inspector字段：nameLabel、priceLabel，类型Label|null。

public setData(config: ItemConfig): void由用户实现：先检查两个Label，缺失时提示并return；然后显示displayName与“price金币”。本轮不在onEnable读取未传入的配置，也不需要start初始化数据。

创建新2D场景ShopMain，在Canvas下建ShopPanel/Content。Content添加UITransform（已有则使用），宽460、高300、位置居中；添加Layout：Type=VERTICAL，Resize Mode=CONTAINER，Spacing Y=10，方向TOP_TO_BOTTOM。Container让容器按孩子扩展，行自身尺寸由模板决定。

在Content下面暂建ItemCell节点，UITransform宽460高80，根节点挂ItemCell脚本；孩子NameLabel、PriceLabel左右摆放，例如x=-110/120、字号28。字段分别绑定自身两个孩子的Label。

Creator Project中创建assets/Prefabs目录，把整个ItemCell根节点拖进去生成ItemCell.prefab。Prefab需保存脚本和内部Label引用。随后删除场景里用于制作模板的ItemCell实例，保留Project资源；编辑态Content为空。

## 2. 用户创建ShopPanel

D3/ShopPanel.ts继承Component，类名/ccclass为ShopPanel。cc导入Prefab、Node、instantiate，配置从../ItemConfig导入ITEM_CONFIGS，条目从./ItemCell导入ItemCell。

两个字段：

```ts
@property(Prefab)
itemPrefab: Prefab | null = null;

@property(Node)
content: Node | null = null;
```

脚本挂ShopPanel场景节点；itemPrefab绑定Project里的ItemCell.prefab资源，content绑定Hierarchy里的Content节点。onLoad做必要引用检查，失败时禁用节点并return，沿用已有模式。

start只生成一次，遍历ITEM_CONFIGS。每轮核心新API：

```ts
const itemNode = instantiate(this.itemPrefab);
this.content.addChild(itemNode);
const cell = itemNode.getComponent(ItemCell);
```

检查cell缺失则提示并结束；正常调用cell.setData(config)。完整循环与显示由用户写，不在onEnable反复生成。ItemCell必须挂Prefab根节点，便于getComponent找到。这里无需手写每行坐标，Layout负责竖排。

## 3. 验收与收尾

- 编辑态Content为空；运行后有3个条目，竖排显示药水10、宝石20、门票5，彼此不重叠。运行数量由配置条数决定。
- 停止后在ITEM_CONFIGS源码临时新增{itemId:'key',displayName:'钥匙',price:8}，重开自动4行，不改创建循环或另做Prefab。
- 删除临时钥匙配置，恢复三条并保存，重开回3行；Prefab资源、场景和Inspector绑定保存完整。

完成后反馈结果与用时。尚未创建/运行，不把步骤或源码API核对记为Prefab通过。按钮购买、钱包协调、异步加载与资源释放待下一轮；本轮静态Prefab引用与实例化不证明动态资源系统已迁移。

## 首版34分钟：主流程正确，钩子拼写待修正

用户反馈34mins over，按本轮完成反馈理解，不推断为结束全天学习；未附逐项运行日志。实际D3/ItemCell、ShopPanel与ItemCell.prefab已创建，配置恢复三条。ItemCell根节点460×80、脚本与自身两个子Label绑定正确，setData检查引用后显示名称和价格，toString且未带金币单位的文案差异接受。

ShopPanel使用下标for与let，语法及循环边界正确，instantiate→addChild→getComponent→setData，start仅运行一次，类型检查通过。itemCell缺失当前静默跳过，建议补提示便于排错，当前Prefab根脚本绑定已正确，不追加新业务功能。

必须修正：生命周期名写成Onload，大小写不符合引擎onLoad，当前漏绑检查不会被自动调用。TS允许普通自定义方法，故类型检查通过不能证明此钩子生效。由用户改为onLoad(): void即可，不代改学习代码；本轮尚未完全收尾，34分钟记首版。

实际没有独立ShopMain.scene：用户在InventoryMain.scene中增加ShopMain节点，content为空且Vertical、Container、SpacingY10、TopToBottom正确，Prefab UUID匹配新资源；旧InventoryPanel节点active=false，ShopMain/content为true。原背包节点/脚本保留，允许这一组织方式，不要求为了名称重做场景，之后沿用实际InventoryMain工作。

四行变式没有单独日志，运行依据用户完成反馈，助手未预览。修正后只需一次正常预览收尾，不重做已有配置/隔离验证；K3购买仍待下一轮。

用户回复ok后的再次读取：已补itemCell缺失报错，钩子由Onload变成OnLoad，首字母O仍大写，尚不符合onLoad。仅需精确改方法名，保留原检查体；继续由学习者修改，不把同名大小写差异误认为已修复，不重复类型检查或提前布置购买任务。

用户要求继续时，实际源码onLoad已精确修正、原检查保留，组件缺失报错也已补。结合此前Prefab/场景/配置核对、类型检查和用户34分钟完成反馈，本轮限定实现收尾；没有额外预览日志，助手未运行，不重复旧检查。修正耗时未提供。继续实验二十九购买请求回调，扣款入包在下一段。
