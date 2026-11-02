# 离线原框架阅读包

这里保存28个与后续课程直接相关的原框架完整文件。来源为Spins提交 `8d1fec2a1b4715c802cf3328a7d12958b0387b8f`，提取日期2026-11-02，使用提交内容而非未提交工作区。换电脑不用带工作仓库。

`upstream/` 内部保持 `assets/Scripts/Lib/` 下的相对目录；每文件原路径、导入、未带入的宿主依赖及SHA-256在[manifest.json](manifest.json)。`npm run check:portable` 会验证快照未被改写。

这是**只读阅读包**，不放进 `assets`，不参与Creator编译。原类含有生产宿主依赖和隐式全局变量；复制28个文件并不等于迁出了完整原框架。不要从Demo导入这里，也不要通过加假的Global/fwk消除错误。需要运行时使用 `assets/Framework` 的教学版本。

## 先看哪些文件

| 主题 | 阅读文件 | 带着什么问题读 |
| --- | --- | --- |
| 事件 | [EventDispatcher](upstream/FrameAsserts/event/EventDispatcher.ts)、[EventList](upstream/FrameAsserts/event/EventList.ts) | once是否传下去？派发时修改监听数组会怎样？ |
| 监听管理 | [EventProcessor](upstream/FrameAsserts/event/EventProcessor.ts)、[EventComponent](upstream/FrameAsserts/widget/CompBase/EventComponent.ts) | 谁注册、谁撤销？为什么全局dispatcher影响独立复用？ |
| 组件基类 | [PrefabComponent](upstream/FrameAsserts/widget/CompBase/PrefabComponent.ts) | 继承后需要保留哪些父类行为？资源/音频是谁创建和释放的？ |
| 资源 | [ResourceLoader](upstream/FrameAsserts/asset/ResourceLoader.ts)、[Resource](upstream/FrameAsserts/asset/Resource.ts) | 加载、缓存、引用、节点各是谁持有？ |
| 资源缓存 | [CacheManager](upstream/FrameAsserts/asset/CacheManager.ts)、[CachePrefabMgr](upstream/FrameAsserts/asset/CachePrefabMgr.ts) | 缓存是否还引用着资源？回池等不等于释放？ |
| 状态观察 | [ViewModel](upstream/FrameAsserts/dataMV/ViewModel.ts)、[JsonOb](upstream/FrameAsserts/dataMV/JsonOb.ts) | 属性/数组变更在哪里被拦截？深观察成本是什么？ |
| 页面 | [MgrLayer](upstream/FrameAsserts/interfaceUI/MgrLayer.ts)、[CacheViewMgr](upstream/FrameAsserts/asset/CacheViewMgr.ts) | 页面关闭是隐藏、回池还是销毁？层级由谁决定？ |
| 任务 | [TaskQueue](upstream/FrameAsserts/task/TaskQueue.ts) | 同步抛错或reject后是否始终推进？停止是否真的中断已启动任务？ |
| 列表 | [VirsualGrideList](upstream/FrameAsserts/widget/ScrollList/VirsualGrideList.ts)、[PoolUtil](upstream/PoolUtil.ts) | 可见数量与数据量如何分离？旧状态何时重置？ |
| 音频 | [ResourceAudio](upstream/FrameAsserts/asset/ResourceAudio.ts)、[GlobalAudio](upstream/FrameAsserts/asset/GlobalAudio.ts) | source、clip、原生/网页音频分别由谁管理？ |
| 存储 | [GLStorage](upstream/Tools/GLStorage.ts) | JSON工具与账号身份/业务key如何分开？ |

原注释和命名可能不准确，原版缺陷不在这里直接修正。先写期望、追方法和导入，再比较[教学版差异](../docs/framework/source-map.md)。原生产业务页面、协议、SDK、账号配置和美术素材不在本包；旧学习日志引用那些页面时只是历史案例，不是当前课程的必需依赖。
