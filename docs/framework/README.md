# 可复用框架使用手册

所有模块只依赖本仓库相对路径和Cocos的 `cc`。没有Global/fwk自动安装、SDK或商业配置；使用者显式创建并持有对象。新9个模块是教学适配/新增实现，见[原版对照](source-map.md)，不是完整原框架的兼容移植。

## 选择模块

| 模块/入口 | 解决什么 | 直接依赖 | 当前学习状态 |
| --- | --- | --- | --- |
| events/EventDispatcher | 已有同步广播 | EventList、cc | 已用，原实现限制保留 |
| storage/LocalStorage | 普通JSON读/写/单键删除 | cc.sys | 已用，业务字段外部校验 |
| lifecycle/DisposableScope | 清理动作成对、统一结束 | 无引擎依赖 | 备课，未接入Demo |
| async/LatestRequest | 旧结果不覆盖新选择 | 无引擎依赖 | 备课，未接入Demo |
| components/ScopedComponent | 活动期/实例期清理约定 | Component、上两项 | 备课，未接入Demo |
| resources/ResourceScope | 本地资源加载与自有引用 | cc.resources、DisposableScope | 备课，待Creator资源验收 |
| state/ObservableValue | 简单可观察值 | Cleanup类型 | 备课，未接入Demo |
| ui/PanelHost | 创建/关闭自有页面节点 | Node、Prefab、instantiate | 备课，待Creator页面验收 |
| pool/PrefabPool | 单模板节点池 | Node、Prefab、instantiate | 棋牌性能专项必修诊断/取舍，未接入，待Creator状态重置验收 |
| tasks/SerialTaskQueue | FIFO串行任务 | Promise | 选修，未接入Demo |
| audio/AudioPlayer | 单AudioSource入口 | AudioSource、AudioClip | 选修，待实际音频验收 |

新模块有类型和隔离逻辑验证，不把Node替身测试当成Creator运行通过。用法见[示例](examples.md)，迁到其他游戏见[复用清单](reuse.md)。

2026-11-03学习优先级见[棋牌性能岗位路线](../jd-performance-roadmap.md)：模块使用必须结合业务与测量；池/列表基本诊断纳入必修，不要求所有页面都池化，也不把已备齐模块算作掌握。

## EventDispatcher / EventList

API：`on(name, callback, target)`、`off(name, callback, target)`、`emit(name, data?, data2?, data3?)`、`has`、`offByName`、`offAll`。创建者持有分发器；面板只撤销自己的订阅，共享源不能随便offAll。

收益：多个监听者可以对同一业务变化独立反应；发送者不用找Label。成本：调用链不如直接调用显式、监听和闭包有存活责任。

已知边界：on的once参数未向下传递；EventList只检查Component节点isValid，不检查activeInHierarchy；直接遍历可变监听数组，派发中增删可能影响遍历；回调异常会中断派发；Function/any缺少事件参数类型约束。不要将它直接标为生产通用总线。保留原版是为了对照学习，复杂新需求可比较Creator.EventTarget或自行给出明确改造与测试。

## LocalStorage

`getItem(key):unknown`：缺失/读取异常/JSON错误返回null；工具不区分这几类原因。`setItem(key,data):boolean`：JSON序列化并写入，失败false。`removeItem(key):boolean`单键删除。

key/账号身份、数值范围、版本迁移、失败策略由业务协调方负责。null本身不适合表示需要区分“缺失”的业务记录。没有加密、远程同步、自动schema检查或可靠事务；返回true不能代替实际跨重开验证。serialize失败与UI刷新是两个责任。

## DisposableScope

`add(cleanup):Cleanup`注册并返回一个至多执行一次的提前清理函数；`dispose()`倒序执行所有剩余动作，幂等；单项异常打印但继续其他清理。对已关闭scope添加动作会立即执行。

适用于监听/取消句柄等同步清理；不接收Promise、不等待异步清理完成、不猜对象的销毁方法。新增的数组/闭包会占内存，提前归还会移除动作；单页几条监听足够，不必为每次算术临时建scope。

## LatestRequest

`begin():number`开始新一轮；`isCurrent(ticket)`检查结果；`invalidate()`使所有旧票号失效。它是有效性门禁，不是取消器/超时器/资源池。结果成功与页面仍有效需要分别检查。

## ScopedComponent

继承后覆盖 `onActivated(scope)`注册活动期动作。onEnable创建activeScope，onDisable关闭并invalidate请求，onDestroy再次安全清理活动期后关闭lifetime。重新启用创建新scope，已销毁实例不复用。

收益是统一“谁在何时清理”；代价是继承契约和基类生命周期约束。若覆盖onEnable/onDisable/onDestroy必须正确调用super；普通模型不要继承它。lifetime不自动管理加载资源，使用者显式add清理且注意消费者结束顺序。

## ResourceScope

`load(path,type):Promise<T>`，path相对 `assets/resources`且无扩展名。每次成功加载addRef一次，dispose归还本scope的每次引用（同资源重复load也按次持有）；加载错误reject，关闭后再load拒绝，关闭期间到达的成功回调会立即平衡引用并reject。

只有本地resources，没有远程图/Bundle选择/缓存淘汰/去重/重试。作用域期间已不用的资源也会保留到dispose，按页面/一次请求分scope控制范围。它不清空Sprite、不销毁实例，不处理引用它的其他组件；先结束消费者，再dispose。见[所有权说明](../guide/ownership-and-async.md)。

## ObservableValue

`new ObservableValue(initial)`、`.value`读取、`.set(next)`显式替换、`.subscribe(listener)`返回撤销函数。订阅不自动首次回调；页面订阅后自己同步一次。Object.is相同值不通知；派发中新添加监听等下一轮，被移除监听跳过。

没有Proxy/属性劫持/嵌套路径/自动副本；修改 `value.items.push(...)` 不会通知。监听同步执行，异常传播并中断本轮后续监听；监听里反复set可能重入。只用于理解显式状态通知，复杂业务仍需要普通模型规则，不能用观察者代替校验。

## PanelHost

`new PanelHost(root)`，`open(prefab):Node`创建并挂到root；`close(node)`只关闭本host创建的节点；`dispose`关闭其全部节点，之后不能再打开。外部自行销毁节点会从集合移除。

调用者预先获得Prefab并保证其资源生命周期；host不加载、不释放资源、不缓存页面，不改变传入Prefab的激活约定。无弹窗队列、层级枚举、遮罩、输入锁、动画或返回值协议。用不同root区分层级可先满足简单需求。Node.destroy有延迟，不能close后立刻断言资产已无消费者。

## PrefabPool

`new PrefabPool(prefab,maxIdle=16)`、`acquire():Node`返回inactive节点、`release(node)`归还并脱离父节点；超出空闲上限销毁；`dispose`销毁空闲和借出节点，之后不能acquire。重复归还/外来节点抛错。

调用者负责条目数据、回调、选择、动画的重置。建议模板根节点设inactive；acquire后先挂父节点/设数据，再active。池不持有Prefab的引擎引用，模板由场景或ResourceScope等外部负责人保证。池会保留内存；不是虚拟列表，仍需自己限制可见实例数。

## SerialTaskQueue

`enqueue(() => valueOrPromise):Promise<T>`按入队顺序串行执行。同步throw和异步reject传给该次调用者，后续任务仍推进。每次调用应catch返回的Promise。

`close()`拒绝未开始和新入队任务，不中断正在执行任务；无法让永不settle的任务自行结束，也不提供优先级/并发/暂停/超时。大量待执行任务仍占内存。先用Promise能解决时不必引入任务系统。

## AudioPlayer

显式传入已有AudioSource，`playMusic(clip,loop=true)`替换音乐，`playEffect(clip,volumeScale=1)`调用playOneShot，`setVolume`校验有限数并夹到0～1，`stop()`停止音乐并清空clip，不销毁source。

重要限制：Creator3.8.7的playOneShot有自己的播放器，stop不能统一停止已启动短音效；保持clip直到它不再使用。没有加载/引用持有、分组、跨场景常驻、淡入淡出、后台策略；网页首次播放还受用户手势限制。本轮没有提供音频素材，也没有验证真实播放。源和资源责任仍归调用者。
