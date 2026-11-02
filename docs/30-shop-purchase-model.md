# 实验三十：用普通类协调一次购买

2026-10-22，D03，阶段B/K3进行中。商品点击回调已收尾。本轮暂估35～50分钟，由用户实现普通模型、页面与两个Label；不替用户写业务代码。聊天完整提供必要内容，本文留档。

## 结果与职责

ShopModel是新增教学业务类，不是迁入的通用框架。它持有一份Wallet和Inventory，处理“按配置扣钱并加一件道具”；ShopPanel创建模型、发购买请求、显示当前状态；ItemCell只负责按钮/条目；Wallet与Inventory继续管理各自规则。

本轮仅内存，每次新预览30金币/空背包。旧A/B背包存档与WalletOwner不接入、不删除，旧InventoryPanel继续禁用，避免两份钱包或背包各自修改同一份数据。下一轮将商店钱包与背包作为一份快照接存档。

## 普通类由用户实现

新建assets/Demo/ShopModel.ts，不导入cc：

- 导入./Wallet的Wallet、./Inventory的Inventory与InventoryItem、./ItemConfig的getItemConfig。
- private wallet: Wallet；private inventory = new Inventory()。
- constructor(initialCoins: number)中创建this.wallet = new Wallet(initialCoins, 150)。本轮调用方固定传30，不新增初始余额接口规则。
- public getCoins(): number，返回钱包余额。
- public getItems(): InventoryItem[]，返回inventory.getItems()副本，不公开内部wallet/inventory供页面随意修改。
- public tryBuy(itemId: string): boolean，查询并验证配置、调用现有规则，不访问Label、按钮或存储。

tryBuy实现顺序：

1. getItemConfig找不到返回false。
2. 配置itemId非空、价格为正整数；不合法返回false，未改任何状态。price是源码number，正数+Number.isInteger足够本轮约束；0价/负价不作为本课免费商品。
3. wallet.trySpend(config.price)失败返回false，不加道具。
4. inventory.tryAdd(config.itemId, 1)，只购买一件，不是旧领取按钮每次药水+2。
5. 若入包返回false，用wallet.tryAdd(config.price)退回刚扣的金币，再返回false；正常成功返回true。

第5步是撤销本次已经发生的扣款。当前固定初始30≤150、无await、模型独占两个状态、无外部中途修改，退回金额使余额回到购买前，符合现有Wallet上限规则。现有Inventory对合法ID/数量1必然成功，所以本轮通常走不到该分支；不因写了退款就认定模拟过容量失败或支持通用异步事务。以后加入容量、异步奖励等规则时重新设计验证。

## 页面接入由用户实现

D3/ShopPanel导入../ShopModel，类内private shop = new ShopModel(30)。增加@property(Label) coinsLabel与inventoryLabel并导入Label。

已有onLoad必要检查加入两个Label。start仍只生成一次，循环完成后调用refreshShop。

private refreshShop(): void：coinsLabel显示shop.getCoins()；inventoryLabel遍历shop.getItems()显示ID/数量，空时显示“背包为空”。本轮可复用已学循环，无需配置查询或新增事件；不写存档、不改变模型。

handleBuy(itemId)：调用shop.tryBuy(itemId)；成功refreshShop并可打印余额/记录，失败提示“购买失败：配置无效或余额不足”，不自行扣钱或直接写背包。原箭头回调与Prefab生成方式保留。失败可以不刷新，因为模型应完全不变。

## Creator

实际InventoryMain场景的ShopMain节点下添加CoinsLabel/InventoryLabel，绑定ShopPanel新属性。建议余额位于列表上方，背包位于下方，不重叠；可CoinsLabel y=220，InventoryLabel y=-230/大小600×160/字号24，具体位置自行安排。保留旧InventoryPanel节点禁用，不需要新的按钮或Prefab改动。

## 验收

| 操作（同一次预览依次执行） | 余额 | 背包 |
| --- | --- | --- |
| 初始 | 30 | 空 |
| 买药水 | 20 | potion1 |
| 买宝石 | 0 | potion1/gem1 |
| 买门票 | 0，失败提示 | 仍potion1/gem1 |

追加未知ID失败测试：start末尾refreshShop后临时console.log('未知ID', this.shop.tryBuy('missing'), this.shop.getCoins(), this.shop.getItems())，初始应false/30/[]，再执行上面按钮流程。验证后删除临时行。

停止重开恢复30/空，是本轮仅内存的预期。完成后报告日志与用时，模型源码/类型/场景另审阅。当前尚未实施，不提前判K3通过；下一轮统一购买快照存档与结构校验。

## 首版33分钟：主流程正确，两处定向修正

用户反馈33分钟结束，没有逐项日志，运行依据本轮完成反馈，不据“结束”推断为结束全天学习。实际ShopModel私有持有Wallet和Inventory，构造余额、getCoins/getItems、配置查询/扣款/入包/退款均按已有模型组合实现；源码顶部有未使用的cc模板导入，本轮不把清理风格升级为必修。ShopPanel使用coinLabel/InventoryLabel命名，场景引用分别指向实际cc.Label，命名差异接受。必要检查、start后刷新、成功刷新、失败提示、未知ID测试行清理均正确，类型检查通过。

助手在Node转译当前实际源码，使用独立模块上下文（未改磁盘源文件），执行初始30/空、药水成功20/p1、宝石成功0/p1g1、门票余额不足false不变、未知IDfalse不变、将隔离模型的inventory.tryAdd替换为返回false验证退款回30/空，共6项通过。退款为模拟调用方分支，不是现有背包已有容量拒绝场景，未修改正式私有封装接口。

边界检查：隔离上下文临时将potion配置价格改10.5，新模型tryBuy实际返回true/余额19.5/potion1，期望false/30/空，失败。未修改ItemConfig源文件，实际三条配置仍10/20/5。当前条件itemConfig.price>=0没有约束整数；应在ShopModel改为price>0并Number.isInteger(price)，保留非空ID条件，零价也提前按无效配置拒绝。

第二处：refreshShop遍历空背包后将空字符串赋给Label，需显示已约定的“背包为空”，可在空字符串结果时回退，或循环前处理空数组。其余主流程无必修问题，不追加重构、命名或新功能。修正后只回归价格边界与初始提示，不重复全部已过购买/Prefab检查。33分钟记首版，修正用时未知；本轮尚未整体通过，购买存档待后续。

## 2026-10-23 D04恢复：内存行为收尾

实际已补Number.isInteger与空背包提示，类型检查通过。只定向执行隔离上下文中的价格10.5、-1、0，均返回false、余额30/空背包不变；未再跑旧6项或修改磁盘配置。当前条件仍price>=0，0由Wallet.trySpend拒绝，不能误称零价购买成功；建议随新课收紧为>0以在ShopModel体现正整数契约，不为同结果重复阻断课程。修正用时未知，首版33分钟保留。

结合原主流程/退款检查、页面引用/类型、用户完成反馈，本轮内存行为收尾。没有新增Creator日志，助手未预览，不声称新课跨重开已运行。进入实验三十一统一快照存档，K3等待该链路完成。
