# 实验十二：用has验证监听是否解绑

前置：已通过target对照实验，源码确认购买监听已恢复。迁入的EventList.emit使用handler.call(target,...)，与刚验证的调用上下文一致。

本轮约5～10分钟。操作由学习者完成，助手不修改assets源码；暂不迁入新模块。

## 为什么增加查询

EventDispatcher.on会通过has对相同事件、回调和target去重。显隐后没重复触发，只能说明当前可见行为正常；若off遗漏，也可能因on去重没有出现重复行为。

has(eventName,callback,target)查询这一组登记当前是否存在，不调用回调。它只证明所查询的这一组登记状态，不代表全部事件或按钮监听均清理。

## 1. 添加两处临时查询

删除buy中的上一轮this打印。

在onEnable现有this.events.on(COINS_CHANGED,this.refreshCoins,this)之后添加：

```ts
console.log(this.node.name, '绑定后',
    this.events.has(COINS_CHANGED, this.refreshCoins, this));
```

在onDisable现有this.events.off(COINS_CHANGED,this.refreshCoins,this)之后添加：

```ts
console.log(this.node.name, '解绑后',
    this.events.has(COINS_CHANGED, this.refreshCoins, this));
```

这两处操作针对自己迁入的EventDispatcher，Button.node上的CLICK监听保留原样。

## 2. 正常路径与此前回归合并

重新运行预览，两边绑定后查询应为true。

1. 左清零再增加一次为5，右清零再增加一次为3。
2. 用外部按钮隐藏/恢复左侧三次。每次隐藏后查询false，恢复后查询true；左购买按钮跟随子树显隐，左余额保持5、右保持3。
3. 第三次恢复后点击一次左增加，左变10、右保持3。

注意对照CoinCounterL日志；停止旧预览时的onDisable等输出也可能出现，不与本轮主动操作混淆。

## 3. 故障对照

仅临时注释金币事件这一行，不动按钮off或has打印：

```ts
// this.events.off(COINS_CHANGED, this.refreshCoins, this);
```

保存并重新运行预览，隐藏左侧。此时名为“解绑后”的查询应打印true，说明该登记仍在。原有“已解绑监听”文本也可能继续打印，文本本身不核验实际登记。

## 4. 恢复

恢复该off行，保存并重新运行预览，再隐藏左侧，查询应回到false。两处has打印可保留到本轮审阅，不改框架实现。

每次重新预览创建新的钱包，正常路径的5/3→10/3数字只在第2节那轮观察，不要求跨重新运行保持。

反馈正常/临时遗漏/恢复三种查询结果，以及正常路径的数字和按钮显隐结果。若有偏差，先保留对应代码和日志定位，不扩大修改范围。

状态：2026-10-17用户回复“结果和预测相符”，本页三组查询与正常路径合并回归按用户运行报告通过。源码确认off已恢复，两处has打印都在，buy临时this打印已删。助手未操作预览，未要求重复提交已确认结果；查询结论仅针对指定登记。下一步[漏绑引用排错](13-missing-reference.md)。
