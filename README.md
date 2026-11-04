# FrameWorkDemo

独立的 **Cocos Creator 3.8.7 / TypeScript** 学习与复用工程。目标是从初级组件开发逐步学会分析需求、组织业务状态、管理生命周期与资源，并能说明框架设计的理由与代价。

GitHub仓库：[KencilWN/FrameWorkCocos](https://github.com/KencilWN/FrameWorkCocos)。

克隆本仓库即可继续学习，不需要 GameSlot、Spins 或原来的 OKF 目录。它们仅作为历史来源出现。引擎仍需自行安装，首次安装 npm 工具需要联网；之后源码与学习资料均在仓库内。

## 在家里开始

1. 安装 Cocos Creator **3.8.7** 和 Node.js **18或以上**。用 Creator Dashboard 导入本文件夹，等待资源导入完成。
2. 在工程根目录运行：

   ```sh
   npm ci
   npm run check
   ```

3. 在 Creator 打开 `assets/Scene/InventoryMain.scene` 并预览。当前商店在 `ShopMain` 节点，旧背包节点停用。首次在另一台电脑运行没有本机存档，默认30金币、空背包。
4. 从[当前恢复点](docs/progress.md)继续。当前任务是[数量1/3选择](docs/32-shop-quantity-selector.md)，尚未完成；当前源码仍固定每次买2件。

还没打开过 Creator 时，可以先运行 `npm run check:portable` 和 `npm test`。`typecheck` 需要本工程由 Creator 生成的声明，不会借用其他项目或伪造引擎类型。更多细节见[环境与两台电脑同步](docs/guide/setup-and-git.md)。

## 资料入口

2026-11-03学习偏向已调整为**棋牌小游戏客户端性能**：基础业务与生命周期继续按关卡推进，逐步加入Profiler、内存/GC、2D渲染、包体/首屏、重连与多平台实测。公开案例用于分析与本人最小复现，不计作已参与生产项目；当前仍先完成实验32。

| 想做什么 | 阅读入口 |
| --- | --- |
| 停了几天，恢复学习 | [学习入口与当前项目地图](docs/guide/start-here.md)、[实时进度](docs/progress.md) |
| 了解完整阶段和目标 | [动态学习计划](docs/learning-plan.md)、[阶段验收](docs/checkpoints.md) |
| 对照棋牌性能岗位学习 | [岗位专项路线](docs/jd-performance-roadmap.md)、[公开案例研习库](docs/guide/performance-cases.md) |
| 训练自己解题，不只抄实现 | [问题求解流程与练习模板](docs/guide/problem-solving.md) |
| 补TS、this、unknown和复制 | [TypeScript实用基础](docs/guide/typescript.md) |
| 补编辑器、Prefab、绑定、生命周期 | [Creator实操基础](docs/guide/cocos.md) |
| 理解数据、异步、资源由谁负责 | [所有权与异步有效期](docs/guide/ownership-and-async.md) |
| 查询框架接口、用法、好处与不足 | [框架使用手册](docs/framework/README.md)、[模块示例](docs/framework/examples.md) |
| 对照原框架学习 | [本地原版源码快照](reference/README.md)、[原版与教学版差异](docs/framework/source-map.md) |
| 复制到其他试水项目 | [复用清单](docs/framework/reuse.md) |
| 查看剩余课程与练习 | [后续实操路线](docs/guide/next-lessons.md) |

聊天仍是结对教学入口；文档让换电脑、换聊天或独立复习时有完整上下文。无需每轮先读所有MD。编号01～32的课程是历史步骤，回顾可以，不能不看当前状态就重新执行旧的注入/重置代码。

## 工程结构

```text
assets/
  Demo/                  学习者写的钱包、背包、商店与页面；保留未完成练习
  Framework/
    events/              原样迁入的EventDispatcher/EventList（有已知限制）
    storage/             已学LocalStorage教学适配
    lifecycle/           DisposableScope：清理动作的明确所有权
    async/               LatestRequest：拒绝过期结果
    components/          ScopedComponent：活动期和实例期清理
    resources/           ResourceScope：本地异步加载、引用持有/归还
    state/               ObservableValue：显式替换、浅层通知
    ui/                  PanelHost：已加载Prefab的创建与关闭
    pool/                PrefabPool：单模板节点复用
    tasks/               SerialTaskQueue：串行任务、拒绝传播
    audio/               AudioPlayer：显式AudioSource入口
  Scene/                 四个现有学习场景
  Prefabs/ItemCell.prefab 商品模板
reference/               固定提交的28个原框架文件及SHA-256来源清单，仅阅读

docs/                    学习计划、进度、独立基础资料、模块手册
scripts/                 本仓库自带的可移植检查和类型检查入口
tests/                   逻辑与生命周期测试，含明确的引擎替身
```

2026-11-02整理新增的9个模块是助手提供的教学适配/新增基础设施，**没有替学习者完成接入和练习**；它们不与原框架API兼容。旧Demo、场景、Prefab、事件和存储代码保持原样。源码在目录里不等于已经掌握，也不表示所有模块已在Creator中验收。

## 当前进度与检查范围

K1组件/生命周期、K2状态/存储已通过限定验收。商店购买→单份快照保存→重开恢复已由学习者确认；指定数量的模型修正版通过定向检查。K3仍在页面整合与设计判断收尾，K4～K8未完成。恢复函数主体曾由AI辅助，这部分不记为独立设计掌握。

`npm run check:portable` 检查运行导入、框架业务依赖方向、元数据UUID、来源哈希及资料本地链接。`npm test` 使用Node和小型引擎替身检查清理、过期结果、引用计数、队列拒绝和节点所有权。`npm run typecheck` 使用本仓库锁定的TS4.9.5，跳过引擎声明内部检查。

这些检查不能代替Creator中的Inspector、真实异步加载/资源释放、音频播放和Web构建。手动验收步骤见[后续路线](docs/guide/next-lessons.md)。

来源与归属见[迁移记录](docs/migration-notes.md)和[来源声明](THIRD_PARTY_NOTICES.md)。仓库未自动附加MIT等统一再许可条款。克隆、提交和双电脑同步操作见[Git指南](docs/guide/setup-and-git.md)。
