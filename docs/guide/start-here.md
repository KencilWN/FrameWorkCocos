# 学习入口与项目回顾

本工程目标：能独立分析一个小功能、熟练写常见TS业务、理解并复用选定框架模块，逐渐形成对状态、依赖、生命周期、失败和成本的设计判断。既练实现，也练为何安排这个函数/接口/脚本。更大规模架构能力依靠后续真实需求积累，不承诺读完目录就获得。

2026-11-03起按[棋牌性能岗位路线](../jd-performance-roadmap.md)调整偏向，使用[公开案例](performance-cases.md)学习取证和最小复现。当前先完成数量选择，后续增加Profiler、资源/内存、渲染、加载与网络恢复；方向调整不代表新增过关，也不跳过基础。

## 换电脑/停几天后的恢复

1. 按[环境指南](setup-and-git.md)安装并打开工程。
2. 只读[进度最上方](../progress.md)的当前恢复点。不要从第一课重新做起。
3. 打开 `InventoryMain.scene`、`ShopPanel.ts`、`ShopModel.ts`，沿一次购买找入口、模型变化和刷新。
4. 用自己的话写当前任务的目标和成功/失败状态，再编码。卡住时使用[问题求解流程](problem-solving.md)。

## 当前功能调用链

`ShopPanel.start` 遍历配置 → 实例化 `ItemCell.prefab` → `setData`设置显示和回调。

玩家点击格子 → `ItemCell.requestBuy`执行回调 → `ShopPanel.handleBuy`读取当前 `buyNum` → `ShopModel.tryBuy`校验/扣款/入包/必要时退款 → 页面成功分支保存快照并刷新。当前不需要全局事件中心。

启动时 `ShopPanel.onLoad` 先检查Inspector引用，再 `loadShop` 读普通数据 → `ShopModel.tryRestore`在候选钱包/背包全部有效后替换 → `start`首次显示。`refreshShop`不读写存档。

`WalletOwner/ShareCoinPanel`是之前共享钱包的独立实验。当前商店自己持有Wallet/Inventory，并没有自动使用旧共享钱包；将来多个页面共用资产时要重新决定持有者，不能复制钱包当共享。

## 目录与职责

| 对象 | 负责 | 不负责 |
| --- | --- | --- |
| ItemConfig | 道具ID、名称、单价 | 玩家拥有数量 |
| Wallet | 余额操作 | 商品价格与按钮 |
| Inventory | 物品增量、查询、记录恢复 | 扣钱与本地key |
| ShopModel | 协调购买、导出/恢复完整状态 | Label、保存平台 |
| ItemCell | 单行展示、报告点击 | 找ShopPanel或扣钱 |
| ShopPanel | 生成列表、当前选择、协调读写/刷新 | 重新写钱包/背包校验 |
| LocalStorage | JSON读写与异常返回 | 判断什么是合法商店记录 |

## 学习记录怎么看

- K1/K2核心通过；商店正常存档链路通过；K3收尾中的数量切换尚未实现（2026-11-02核对）。
- `tryRestore`主体有AI辅助，记录为能跟随/验证，继续通过独立变式练推导。
- 后续框架代码已备齐不等于已经学过；新模块还没有挂进旧场景。
- 旧 `01～32` 课是发生时的步骤，方法名和临时代码可能已经变化。以当前源码/恢复点为准。
- 原GameSlot/Spins文件现在从仓库内[阅读包](../../reference/README.md)查，不要求访问历史本机目录。

已有8关的范围与滚动时间见[计划](../learning-plan.md)，具体将按独立程度和卡点重估。日历过了一周不等于增加一周已完成进度。
