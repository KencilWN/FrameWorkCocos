# 实验二十九：购买按钮把请求交给页面

2026-10-22，D03，阶段B/K3进行中。商品Prefab课已收尾。本轮新机制为无参函数类型与箭头函数捕获上下文，暂估30～45分钟。用户改代码与Prefab，助手提供新语法和契约，不代写业务实现，聊天完整提供必要内容。

## 结果与职责

三行商品各有购买按钮，点击后ShopPanel收到正确itemId并打印名称/价格。ItemCell负责按钮与显示，通过调用者传入的回调连接页面，不直接依赖ShopPanel类。下一段由页面协调Wallet与Inventory，本轮点击不改变存档或金币。

实际场景仍为InventoryMain.scene的ShopMain节点；旧InventoryPanel保持禁用，不新增场景或重复列表。

## 新语法

ItemCell增加：

```ts
private buyCallback: (() => void) | null = null;
```

`() => void`表示不接收参数、无返回值要求的函数类型；外层括号让整个函数类型与null组成联合。字段存函数，null表示页面还没传入。

setData签名增加参数：

```ts
public setData(data: ItemConfig, onBuy: () => void): void
```

在方法中保存this.buyCallback = onBuy，保留原引用检查与显示，不直接调用onBuy。按钮触发requestBuy时，检查字段非null，再this.buyCallback()。

ShopPanel给每一行传入：

```ts
itemCell.setData(itemConfig, () => {
    this.handleBuy(itemConfig.itemId);
});
```

箭头函数在点击时才执行，保留创建时的页面this及这一轮itemConfig。当前循环使用let itemConfig，每轮有对应变量。页面方法为private handleBuy(itemId: string): void，导入getItemConfig，查不到提示并return，查到打印this.node.name、itemId、displayName、price。

## ItemCell按钮与生命周期由用户实现

- cc导入Button，增加@property(Button) buyButton: Button | null = null。
- setData的必要引用检查包含buyButton，缺失提示并return。
- onEnable：buyButton?.node.on(Button.EventType.CLICK, this.requestBuy, this)。
- onDisable：同一回调和target配对off。只解绑，保留buyCallback，以支持恢复显示后继续点击。
- private requestBuy(): void：有buyCallback时执行它，不查找父页面或创建钱包。
- onEnable只注册按钮，不读取尚未传入的数据。addChild先使节点激活，页面随后setData；注册早于数据就绪是正常顺序。

引擎on/off的target=this是ItemCell；页面箭头函数捕获ShopPanel的this，两处接收者不同。不把示范中的箭头回调替换为普通this.handleBuy引用。

## 编辑并保存Prefab

双击Project中的assets/Prefabs/ItemCell.prefab，进入编辑模式，在根节点下添加BuyButton，文字“购买”，绑定脚本buyButton。保留名称/价格Label，按左名称/中价格/右按钮排开，例如X=-150/0/160，按钮100×50。Click Events留空，事件由脚本注册。

保存Prefab资源，再预览InventoryMain；不只修改运行实例。原ShopPanel的Prefab/content引用保持有效。

## 验收

- 药水按钮一次：页面收到potion、药水、10，this.node.name为实际ShopMain。
- 宝石一次：gem、宝石、20。
- 门票一次：ticket、门票、5。
- 每点一次只有一条页面购买请求日志，各按钮对应自己的配置，不全部指向最后一条，没有this错误。
- 停止重开仍有3个购买按钮，证明修改保存在Prefab资源。

完成后反馈日志与用时。当前尚未实施或运行，不把商品展示通过记成购买通过；扣款、入包、失败状态不变和购买存档下一段接入，K3仍进行中。

## 首版20分钟：回调主链正确，补激活阶段空值保护

用户反馈20分钟ok，未附逐项点击日志，运行依据完成反馈，助手未预览。实际buyCallback为(() => void)|null，setData检查Label/Button后保存函数，requestBuy用truthy检查后执行；ShopPanel每轮let itemConfig配箭头函数捕获页面this/当前ID，handleBuy查配置后打印页面/ID/名称/价格。getItemConfig已自行告警未知ID，页面无额外else不追加返工。配置对象局部变量名bSuccess虽不是boolean，不影响功能，仅需避免讲解中误认返回布尔。

Prefab资源增加Button、引用正确且Click Events为空，类型检查通过。按钮on/off回调及target一致，保留回调支持恢复显示。但当前onEnable/onDisable直接this.buyButton.node，漏绑时先于setData检查就抛错，需使用buyButton?.node或等价提前保护。本轮不代改源文件，不重复旧生命周期实验。

用户询问：精确函数类型与Function的区别，if(callback)与!==null的区别。解释：()=>void描述无必传参数且调用结果不使用的签名；Function没有指定参数/返回契约，可能接受本来必需参数的函数却允许调用时漏传，优先用明确签名。void不是强制函数体不能return值。当前字段仅函数或null，两种判断效果相同，函数truthy、null falsy；if不执行函数。一般情况下!==null只排除null，undefined等仍可进入；不因此将当前truthy实现判为错误。

20分钟低于30～45预估，但主要代码有新机制示范，且空值保护待补，不单凭速度缩减资源/异步阶段。下一段购买协调尚未布置，不把回调请求当作扣款入包已完成。

用户回复ok后读取实际源码，onEnable/onDisable均已改buyButton?.node，原回调与target配对保留。只改空值访问，无新类型问题，不重复旧检查；结合先前类型检查、Prefab绑定与用户完成反馈，本轮限定实现收尾。继续实验三十ShopModel内存购买，尚未实施。
