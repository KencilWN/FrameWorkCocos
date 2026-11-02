# 实验二十六：独立给两个测试用户隔离背包存档

2026-10-22，D03，K2独立变式，暂估15～25分钟。已完成背包恢复、存档及失败模拟。本轮给需求与新声明语法，主要实现由用户决定，允许查已有代码；不提供完整key计算或读写方法，不新增Owner/场景/全局框架。

## 目标

同一个InventoryMain场景、同一个InventoryPanel和同一套Inventory规则，通过Inspector选择测试用户A或B，各自保存自己的道具。只在停止预览后修改用户ID，不做运行过程中切换。

需要可配置字符串字段的写法：

```ts
@property
profileId: string = 'A';
```

声明放在组件类内，Creator会显示字符串输入框。改值后保存场景，再开始预览。

## 由学习者实现的契约

1. 用户ID为A或B，两者使用不同存档key。
2. 推荐新增private getStorageKey(): string，让loadItems与saveItems使用同一处计算结果，避免两处手拼不一致。命名或等价实现可自行选择，不能复制两套组件/Inventory逻辑。
3. 预期键名分别为framework-demo.inventory.A.items.v1与framework-demo.inventory.B.items.v1。使用已有模板字符串或拼接计算，不为A/B复制两套读写方法。
4. onLoad已有引用检查后、读档之前验证ID；为空或不是A/B则提示并禁用组件或节点、return，防止无效身份写入。生命周期/引用检查采用已学模式。
5. Inventory不知道用户ID，不导入LocalStorage；LocalStorage也不写死A/B，它仍只负责调用者给的key和数据。profileId与key计算由当前持有/协调组件负责。
6. 保留正常领取、JSON恢复、失败告警与纯显示职责；没有临时false或坏存档注入。

新A/B键与之前无ID的framework-demo.inventory.items.v1不同；旧potion6仍在旧键，A/B初次为空是预期，无需删除原存档。

## 验收流程

- 停止预览，在Inspector设置A并保存场景。初次为空，药水点一次、宝石点一次→potion2/gem1，停止。
- 改B并保存场景，预览应为空；药水点两次→potion4，停止。
- 改回A并保存，预览仍为potion2/gem1。
- 改回B并保存，预览仍为potion4，没有gem。
- 停止后将ID改为空，保存并预览，应提示且面板不允许继续领取；结束恢复A并保存场景。

这里是测试身份命名空间，不是登录/鉴权系统；不增加账号SDK或线上业务依赖。

完成后报告结果、用时，并用两三句话解释：为什么ID和key计算放在组件协调层，Inventory与LocalStorage分别负责什么。允许查已有模式，新字段声明提供过示例；不据此夸成完全无提示的全新功能。助手审阅、必要类型检查及用户运行证据到齐后再判K2，当前尚未实现/运行。

## 实际完成：17分钟，独立变式通过，K2核心过关

用户附件日志：A首次为空，增加potion2/gem1，保存键为framework-demo.inventory.A.items.v1；B首次为空，药水两次保存B键；改回A时恢复potion2/gem1，改回B恢复potion4；最后空ID触发“请先设置profileId为A或B”。当前代码通过getStorageKey统一拼接读写，普通Inventory/LocalStorage未引入身份，onLoad仅允许A/B后加载，无效时禁用节点并return；类型检查通过。

用户17分钟落在15～25分钟估计内。当前场景序列化profileId仍为空，需用户在Creator改回A并保存，属于收尾，不要求重新重复A/B实验，不代改学习者场景。

用户解释为放入Inventory或LocalStorage会局限于写死A/B的key。方向正确，但需精确：通过参数化仍可复用，位置本身不是绝对规则；本设计由持有/协调层知道测试身份并准备key，Inventory管理道具规则，LocalStorage提供任意key的JSON读写，避免通用工具认识业务身份。以后可将协调移动到Owner/业务服务，并非永远固定在UI组件。

结合前置状态、存档、坏数据和模拟失败实验，K2核心验收通过，阶段A核心结束，进入阶段B。没有把真实平台故障、运行中身份切换、高级TS和所有配置主题提前认定通过。下一轮实验二十七道具配置，尚未实施。

实验二十七后已核对InventoryMain.scene的profileId恢复A，上一轮场景收尾完成。
