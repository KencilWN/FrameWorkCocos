# Creator实操、UI和生命周期

## Scene、Node、Component、Prefab

Scene保存节点树。Node有父子层级、激活状态与变换；Component给节点附加行为。Prefab是可实例化模板，instantiate产生独立节点，不等于复制了业务共享状态。Label/Button等UI组件需要在Inspector绑定到自己的脚本字段。

`@property(Label)`决定字段如何序列化和显示。public字段没加装饰器不自动出现在Inspector；private不等于不能配置，装饰器和序列化另有规则。当前buyNum在源码里，选择UI的练习要自行绑定新Button/Label。

编辑完成要保存Scene/Prefab和脚本；运行预览时拖动节点的位置通常不会回写编辑资产。Prefab内部引用绑定模板子节点，实例化后各自使用对应子节点；不要把场景外的临时节点引用误当模板内引用。

资源`.meta`包含UUID，场景的脚本/Prefab通过它关联。已入库的资产必须连meta一起提交。复制到另一个项目的新模块若无场景依赖可让目标Creator生成新UUID；整体复制场景/Prefab及其依赖时要完整保留对应身份，不能随意删meta。

## 生命周期与状态

对通常的已激活节点：onLoad用于首次初始化，onEnable进入活动期，start在首次更新前执行一次；之后显隐主要重复onDisable/onEnable。未激活节点首次激活时序需实际验证，不把普通顺序背成所有状态都立即发生。

- 初始化钱包放首次启用前可用的位置，避免onEnable每次重建余额。
- onEnable注册活动期监听并刷新当前状态，onDisable撤销。
- 销毁时归还实例期资源；隐藏不自动销毁对象或清除普通类字段。
- start执行一次不等于以后再显示会重新初始化。

ScopedComponent封装了活动期/实例期清理。继承时优先覆盖onActivated；如果覆盖父类生命周期必须保留super行为，不能因为子类方法同名就认为父类仍自动执行。使用前先读[框架示例](../framework/examples.md)。

## Button与监听

代码监听与Inspector Click Events是两套入口。当前练习用代码on/off，按钮Click Events保持空，避免点击触发两次。注册与撤销的函数引用、target要相同。`.bind(this)`每次产生新函数，直接在on/off各写一次bind通常无法配对。

活动期关闭时主动解绑；原EventList检查节点是否有效但没有检查activeInHierarchy，不依赖注释保证停用。销毁共享事件源应由持有者负责，面板只撤销自己的监听，不随意offAll别人的注册。

## UI布局与数量练习

当前content用Layout按垂直排列商品，位置由Layout调整。改子节点坐标前确认是否被布局接管；Label、Button需要有合适的UITransform尺寸。锚点决定自身定位基准，父节点坐标决定相对位置。Widget负责贴边/适配，不拿每帧手改坐标和Widget互相竞争。

数量选择是ShopPanel当前操作状态；切换只更新Label，无需重新instantiate全部格子。商品价格标明单价，避免界面显示10但实际买3扣30让用户误解。复杂数量输入框/每商品不同数量是后续需求，不在本轮一起加。

## 调试顺序

先保存 → 看第一条有效错误 → 确认当前场景/活动节点 → 检查Inspector引用 → 断点/日志追调用 → 检查状态是否改变 → 检查是否刷新。日志“已解绑”只证明打印执行，必要时用has或断点检查；“save success”也不能代替重开。

类型检查不能发现所有漏绑、布局和运行时顺序。对资源加载、节点销毁、真实音频、Web构建分别保留预览证据。有关数据/资源何时清理，继续读[所有权与异步](ownership-and-async.md)。
