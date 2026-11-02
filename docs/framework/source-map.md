# 原版、教学版与迁移取舍

来源文件在仓库内[reference阅读包](../../reference/README.md)，完整哈希见manifest。下面的对应是“学习同一种责任/机制”，不声称新代码逐行改写或兼容原API。迁移应先追依赖、列必须保留的行为，再决定哪些需要重写。

| 主题 | 本地原版 | 当前运行版 | 处理与理由 |
| --- | --- | --- | --- |
| 事件 | EventDispatcher/EventList | events同名两文件 | 旧课原样迁入，保留已知缺陷作对照，不擅自改变已有练习 |
| 存储 | Tools/GLStorage | storage/LocalStorage | 学习者教学适配，仅JSON/单键操作；key、账号和规则移到调用者 |
| 事件活动期 | EventProcessor/EventComponent | DisposableScope + ScopedComponent | 新增清理容器与组件适配，显式绑定撤销，不需要全局dispatcher/fwk/GE |
| 生命周期基类 | PrefabComponent | ScopedComponent | 保留活动期/实例期概念，移除自动model、音频、资源大聚合，资源按需求组合 |
| 过期异步结果 | ResourceLoader的组件key/有效性检查 | LatestRequest | 新增独立版本票号工具，明确不等于取消/释放 |
| 本地资源 | ResourceLoader/AssetMgr/Resource/缓存 | ResourceScope | 依据加载-持有-归还责任重写，只用cc.resources；去除业务Global、远程Spine拼装、Bundle/缓存策略 |
| 数据观察 | ViewModel/JsonOb | ObservableValue | 新增简单替代：显式set和浅层通知，先学通知入口；不搬原型修改/深路径类型和数组拦截 |
| 页面 | MgrLayer/CacheViewMgr | PanelHost | 最小宿主重写，只收已加载Prefab；层级root传入，不依赖业务UIIndex/常驻单例 |
| 池 | CachePrefabMgr/PoolUtil/虚拟列表 | PrefabPool | 最小单模板池，归还状态由业务重置；虚拟列表算法仍为后续选修阅读 |
| 任务 | TaskQueue/TaskManager | SerialTaskQueue | 新增FIFO串行替代，无Global错误事件与优先级并发；保留失败推进和返回值归宿 |
| 音频 | ResourceAudio/GlobalAudio | AudioPlayer | 最小显式source入口，移除构造注册、平台音频分支、资源缓存；clip生命周期由调用者负责 |

原版依赖边界可在manifest的 `hostDependenciesNotCopied` 和 `implicitGlobals` 看到。那里没带的文件不是当前工程运行缺件，因为原版快照不运行；可执行教学模块的相对导入必须闭合，由check:portable验证。

没有迁入网络/协议、真实支付、SDK、热更新、Global聚合、业务配置、运营页面和工作素材。它们不是本路线当前核心能力的必需依赖。将来有真实需求再建独立练习，不因它们在原项目中存在就全部复制。

## 为什么不把原PrefabComponent直接拖进来

它导入ResourceLoader/ResourceAudio和ViewModel，调用fwk事件；资源缓存又导入Global/业务Debug配置，继续展开会把宿主服务拉进来。为通过编译填充假全局会掩盖初始化/清理契约。保留原文件供读，运行版按最小边界重写，更适合独立学习；付出的代价是功能删减、API不兼容，需要逐项说明而非宣称“完整迁移”。

## 一次迁移的记录模板

```text
来源文件/提交/哈希：
需要保留的行为：
直接依赖与隐式全局：
原样复制 / 调整导入 / 教学重写 / 暂不迁移：
删除的功能与原因：
本项目入口与结束责任：
成功/失败/关闭时验收：
静态 / 隔离测试 / Creator / Web / 设备的实际证据：
```

本次新增基础设施不是学习者独立迁移成绩；后续课程要求自己追一小段原版、接入一项能力并解释取舍。
