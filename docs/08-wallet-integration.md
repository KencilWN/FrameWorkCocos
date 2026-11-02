# 实验八：Wallet正式接入与清零收尾

2026-10-17，用户自行完成Wallet接入并报告运行验证。源码与类型检查已核对；下面的修正由用户继续完成，不由助手代写到assets。

## 已完成的路径

- CoinCounter以字段持有自己的Wallet，onLoad使用Inspector初值和上限创建。
- onEnable注册监听后读取Wallet刷新，因此首次显示前对象已准备好，隐藏恢复也不会重建。
- addCoin调用tryAdd；失败提示并结束，成功后emit getCoins()，显示由refreshCoins处理。
- Wallet没有cc依赖，负责保存数字和处理本轮规则；组件负责按钮、提示和通知显示。

用户已能解释为何当前调用顺序下选onLoad：start晚于首次onEnable读取，而onEnable每次直接new会丢失已修改的余额。这是根据使用时机作出的选择，并非数据对象一律必须在onLoad创建。

## 需要修正的行为

当前resetCoins中写的是：

```ts
this.wallet = new Wallet(this.initialCoins, this.maxCoinLimit);
```

这会恢复初始余额（左100、右10），而原清零按钮要求余额为0。它还会更换Wallet对象；若其他模块保存了旧对象的引用，那些引用仍指向旧钱包。

此次清零应修改原Wallet对象中的余额。

## 用户实现任务

1. 在Wallet增加reset(): void，方法内将该对象的coins设为0。余额的修改继续由Wallet提供方法完成。
2. 在CoinCounter.resetCoins中保留空值检查，调用this.wallet.reset()替换new Wallet，随后保留emit当前余额。
3. 删除CoinCounter中已无读写的private coins=0及其过期注释。refreshCoins(coins:number)的参数仍需保留，它接收用于显示的数字，不是第二份长期保存的余额。
4. 删除start中的旧实验注释；若仍观察生命周期，可保留start日志。

reset只改数据；此阶段仍由CoinCounter负责emit通知，与tryAdd接入的方式一致。

## 回归预期

| 操作 | 结果 |
| --- | --- |
| 左侧刷新预览→增加→清零→增加 | 100→105→0→5 |
| 左侧隐藏再显示 | 仍为5 |
| 右侧刷新预览→增加→清零→增加 | 10→13→0→3 |
| 只操作其中一侧 | 另一侧保持自己的余额 |

当前状态：2026-10-17用户确认修改完成。源码核对Wallet以resetCoins():void实现清零，组件调用this.wallet.resetCoins()后发事件，未再更换对象；命名差异允许，后续沿用用户方法名。清零接入时TS检查通过（skipLibCheck=true）；随后组件旧coins字段及对应注释已由用户删除，不因该删除重复检查。start仍有不执行的历史实验注释，不作为功能阻碍。修正后的以上运行用例尚待明确反馈。用户先前“验证运行完毕”发生在修正前，不视为本轮清零回归已通过。

## 以后怎样沿用这次分工

默认按依赖划分职责：组件处理按钮、Label、节点、动画与引擎生命周期；普通类保存业务状态并处理规则，例如余额、增加上限和清零。普通类通过参数接受输入、通过返回值等接口提供结果，不直接查找节点或修改Label。

组件也可以保存只属于显示的状态，例如当前选中的页签，以及Inspector配置。无需为了“数据都进普通类”拆出只有一个显示布尔值的小类。initialCoins、addStep和maxCoinLimit继续通过组件配置并传入钱包或方法，属于当前合理的组装方式。

职责与生命周期分开判断：把余额放进普通类，不会自动变成全局共享或存档。当前每个CoinCounter持有自己的Wallet；隐藏没有重建对象，所以余额保留。若销毁面板后重新创建，新组件又会new Wallet并使用初始余额。未来跨页面共享时，再把Wallet交给寿命覆盖这些页面的持有者管理；需要重启后保留时，再增加存储。

普通类并不天然等于公共框架。Wallet目前是自写的业务模型示例，EventDispatcher/EventList才是此次从原项目原样迁入的公共模块。是否提取为公共框架，后续用第二个实际需求验证复用价值与差异。
