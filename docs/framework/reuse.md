# 把框架用于其他试水项目

先选需求，再选模块；没有需要就不加。当前工程是学习底座，不是经过所有平台验收的完整游戏框架发行包。

## 按需复制

| 需求 | 最小带入内容 | 谁负责结束 |
| --- | --- | --- |
| JSON本地存档 | storage/LocalStorage | 业务决定key/恢复/失败策略 |
| 多处同步监听 | events两文件，先接受已知限制或选Creator EventTarget | 注册者解绑，拥有者最终清空 |
| 批量撤销监听/句柄 | lifecycle/DisposableScope | 当前活动/实例负责人dispose |
| 忽略过期异步结果 | async/LatestRequest | 切换/隐藏时invalidate |
| 组件清理约定 | components/ScopedComponent + lifecycle + async | 保留父类生命周期行为 |
| 本地资源持有 | resources/ResourceScope + lifecycle | 所有消费者结束后dispose |
| 简单状态替换通知 | state/ObservableValue + lifecycle中的Cleanup类型 | 订阅者撤销 |
| 创建/关闭弹窗节点 | ui/PanelHost | 宿主dispose；资产另行持有 |
| 高频节点复用 | pool/PrefabPool | 列表停用前归还/销毁；模板另行持有 |
| 简单串行作业 | tasks/SerialTaskQueue | catch每次返回值，结束close |
| 音乐/短音效入口 | audio/AudioPlayer | 音频source/clip由调用者持有 |

原EventDispatcher有once/派发中修改等限制，详见[手册](README.md)。新项目是否继续用原版、改进版还是引擎能力，要根据需求判断；不要因为“来自框架”就默认健壮。

## 新项目操作步骤

1. 用Creator3.8.7新建项目，不复制本仓库的 `.git`、缓存、工程uuid或所有学习场景。
2. 将选中的Framework子目录及其相对依赖带入目标 `assets/Framework`；不复制reference进assets，不复制Demo当通用框架。
3. 纯脚本首次迁入目标可以由Creator生成新meta；若复制包含场景/Prefab的完整资产组，连同相关meta和所有依赖一起迁移。不要在同一目标中产生重复UUID/ccclass。
4. 明确谁创建scope、共享状态、root、音频source；不为方便访问先堆Global。
5. 配置目标自己的key命名空间，例如 `my-prototype.player.v1`，不能复用学习Demo的业务key导致互相覆盖。
6. 按需要带入scripts/tests和锁定TS工具（目标本来有package时合并依赖和scripts，不覆盖原package/tsconfig）。运行目标Creator类型检查和实际预览。
7. 做一次关闭/重开、失败、过期结果或重复归还的相关检查，记录自己实际测试的范围。

## 目前不适合直接通用化的Demo内容

Wallet的tryAdd没有完整校验正数/整数，构造值也未统一校验；ShopModel约定上限150，配置直接模块查询，返回boolean区分不了失败原因；当前存档版本没有迁移体系。它们是教学模型，不自动升级为生产资产系统。

试水项目可借用其思路，但先定义自己的数值约束、失败原因、状态共享和版本变化。若多个页面共用钱包，应传入/持有同一个玩家模型，而不是各自new后写同一key。若需要真实支付/服务端资产，当前本地购买不能提供可信交易保证。

## 不急着抽象的判断

第二个使用场景若需要改框架内部业务判断，说明边界还没分好；但两处几行相似代码也未必值得泛型接口体系。比较改动范围、调用复杂度、资源责任和测得的运行成本。先把新的真实变化说清楚，再决定继承、组合、接口或函数。
