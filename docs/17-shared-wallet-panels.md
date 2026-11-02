# 实验十七：两个面板共用一个钱包

日期2026-10-19，实际学习日D02，K2进行中。引用预测已正确，直接进入实操。首轮暂估30～45分钟，包含新脚本、场景配置与运行；按实际完成用时再校准，不作为限时考试。

## 这一轮要完成的功能

左右两个面板显示同一份余额。任意一边加钱或清零，两边都更新；隐藏左边后，右边仍可操作，恢复左边时显示最新余额。退出预览后重新开始，余额仍从0开始，本轮不做存档。

保留已验收的CoinCounterPractice.ts和PrecticeMain.scene。新建WalletOwner.ts、SharedCoinPanel.ts和SharedWallet.scene，由学习者编写与绑定；Wallet.ts继续复用。

```text
Canvas [WalletOwner，持有一个Wallet和一个EventDispatcher]
├─ LeftPanel  [SharedCoinPanel，引用Canvas上的WalletOwner]
│  ├─ CoinLabel
│  ├─ ClaimButton
│  └─ ClearButton
├─ RightPanel [SharedCoinPanel，引用同一个WalletOwner]
│  ├─ CoinLabel
│  ├─ ClaimButton
│  └─ ClearButton
└─ ToggleButton [PanelToggle，panel引用LeftPanel]
```

节点名称可沿用自己的习惯；结构和引用关系正确即可。DestroyLeftButton继续留空。

## 第一步：写钱包持有者WalletOwner

放在assets/Demo/WalletOwner.ts，继承Component，类名和ccclass均为WalletOwner。它有场景中的生命周期和Inspector配置，因此使用组件；余额和运算规则仍由普通类Wallet负责。

准备以下字段：

- Inspector配置initCoins=0、maxCoinLimit=30。
- 私有wallet: Wallet | null = null，实际钱包保存在这里。
- 公开events: EventDispatcher = new EventDispatcher()，两个面板订阅同一通知源。
- 文件顶层导出事件名：`export const COINS_CHANGED = 'coins-changed';`。

本轮给出一个新机制的小示范，其余方法自己实现：

```ts
private getWallet(): Wallet {
    if (!this.wallet) {
        this.wallet = new Wallet(this.initCoins, this.maxCoinLimit);
    }
    return this.wallet;
}
```

它的含义是“首次访问时创建，以后返回原对象”。先检查，再决定是否new；每次调用getWallet并不等于每次创建钱包。这里不再额外在onLoad或onEnable中new钱包。

之前在CoinCounterPractice的onLoad里创建钱包，是为了赶在它自己的onEnable前完成准备。现在存在多个组件，不假设WalletOwner和面板的onLoad谁先执行；让访问方法保证对象已经存在。Inspector中的配置已在场景反序列化时恢复，首次读取使用这些配置。

自己实现三个公开方法：

| 方法 | 要完成的工作 |
| --- | --- |
| getCoins(): number | 通过getWallet读取余额并返回 |
| tryAdd(amount: number): boolean | 调用Wallet.tryAdd一次；成功才emit(COINS_CHANGED)，返回操作结果；失败不发变化通知 |
| resetCoins(): void | 调用Wallet.resetCoins，然后emit(COINS_CHANGED) |

WalletOwner负责修改入口和通知，不重写上限判断，也不保存第二份coins。它不操作Label或Button。自己拥有的events可在onDestroy中offAll，不能在某个面板隐藏时清空所有订阅者。

## 第二步：把面板改成共享钱包的使用者

复制CoinCounterPractice.ts到SharedCoinPanel.ts作为起点；修改类名和ccclass为SharedCoinPanel，保留原文件作为K1完成记录。

新增引用：

```ts
import { WalletOwner, COINS_CHANGED } from './WalletOwner';

// 放在组件类中，和按钮、Label属性同一层。
@property(WalletOwner)
walletOwner: WalletOwner | null = null;
```

两个面板都要引用Canvas上的同一个WalletOwner。这里保存的是组件引用，和b=a共享同一个对象的道理相同。

按下面的责任调整已有方法，不需要重写按钮监听机制：

| 位置 | 本轮调整 |
| --- | --- |
| 字段 | 保留Label、两个Button和addStep=12；去掉面板自己的wallet、events、initCoins、maxCoinLimit |
| onLoad | 检查必要引用，包括walletOwner；漏绑时提示、this.enabled = false并return；不再new Wallet |
| onEnable | 绑定两个按钮；向walletOwner.events登记showCoins，target仍为this；最后直接调用showCoins()同步当前面板 |
| showCoins | 读取walletOwner.getCoins()，写入当前组件自己的Label |
| claimCoin | 调用walletOwner.tryAdd(addStep)；失败时给出日志；面板不再emit |
| resetCoins | 调用walletOwner.resetCoins()；面板不再emit |
| onDisable | 移除自己的按钮监听；从walletOwner.events中off掉自己的showCoins和this |

保留has日志，查询对象也换成walletOwner.events。左右两边虽然使用相同的showCoins方法，target分别是左、右组件，移除左边订阅不会移除右边。

这里有一个有意的调整：原单面板在onEnable里emit也能完成首次显示；共享通知源后，启用左边若emit，右边也会被无故要求刷新。因此现在直接showCoins，只同步当前面板。数据成功改变时，由WalletOwner通知所有订阅者。通知可继续不带余额参数，收到通知后读取当前钱包即可。

## 第三步：在Creator中搭建共享场景

1. 停止预览，在Creator里复制PrecticeMain.scene，命名SharedWallet.scene并打开。让Creator生成新资产的meta。
2. 给Canvas挂WalletOwner，配置初始0、上限30；本轮Canvas始终保持活动。
3. 将原RewardPanel作为LeftPanel，移除它身上的CoinCounterPractice组件，挂SharedCoinPanel。绑定本面板的Label、ClaimButton、ClearButton，以及Canvas上的WalletOwner。
4. 复制LeftPanel为RightPanel，左右位置可设x=-220、x=220。检查右边的Label和按钮指向右边自己的孩子，WalletOwner仍指向Canvas上的同一个组件。两个面板addStep均为12。
5. 外面的PanelToggle.panel指向LeftPanel，DestroyLeftButton留空。保存场景再预览。

已有练习面板的Widget没有启用对齐，可直接调整面板位置；不用改Canvas的适配设置。不要只在运行时调整位置或绑定。

## 这次只验收共享功能涉及的路径

按顺序运行，观察界面与showCoins日志：

| 操作 | 预期 |
| --- | --- |
| 开始预览 | 左右均0 |
| 左边领取一次 | 左右均12 |
| 隐藏左边，右边领取一次 | 右边24；左边已off，期间没有左边showCoins日志 |
| 恢复左边 | 左边立即24，右边仍24；恢复只刷新左边，不重建钱包 |
| 任意一边再领取一次 | 超过上限被拒绝，余额仍24，不发变化通知 |
| 任意一边清零 | 左右均0 |
| 左边隐藏/恢复3次，再领取一次 | 左右均12；左边has在隐藏后false、恢复后true，右边仍能响应 |
| 停止再重新预览 | 左右重新0；这说明当前是内存状态，存档尚未加入 |

完成后报告实际用时、是否有不符预期的步骤和相关日志。助手再检查两个新脚本与SharedWallet.scene的引用。没有实现与运行证据前，不把共享功能或K2记为通过。

## 2026-10-19第一次读取：未保存的磁盘快照（已被保存版替代）

用户报告运行符合预期，用时27分钟，购买相关功能未纳入本轮。实际提交名为ShareCoinPanel.ts / ShareCoinPanel.scene，组件字段名wallet引用WalletOwner；命名差异接受。用户从原双计数器界面改造，保留了购买按钮、配置和注释掉的购买回调，本轮不要求恢复购买或扩展WalletOwner.trySpend。

静态检查结果：

- Canvas上只有一个WalletOwner，左右面板的wallet均引用它；两边步长均为12，左右Label、增加、清零按钮均引用各自的孩子，Click Events为空。
- 钱包初始0、上限30目前写为WalletOwner私有字段，没有暴露到Inspector；当前数值符合功能验收，不因配置方式不同否定共享接入。
- onEnable订阅后直接refreshCoins(getCoins())，onDisable以事件名、回调、this移除本面板订阅，这两处正确。
- TypeScript检查通过。运行来自用户反馈，助手未操作Creator预览。

当时磁盘快照的两处职责问题（保存版已不存在）：

1. WalletOwner.tryAdd/resetCoins已经发送通知，ShareCoinPanel.addCoin/resetCoins又发送一次。余额不会因此加两次，但每次成功操作会让每个活动面板刷新两次。保留持有者的emit，移除面板的这两处emit及相关过期注释。
2. ShareCoinPanel.onDestroy调用wallet.events.offAll，会移除右侧仍在使用的订阅。面板依靠现有onDisable清理自己的监听；清空整个通知源的行为放在WalletOwner.onDestroy，用this.events.offAll()。

当前ShareCoinPanel.scene已保留并绑定外部DestroyLeftButton，来源于用户采用的双计数器场景，可直接用于此次定向回归；不要求给之前的PrecticeMain补绑按钮。

修复后只回归受影响路径：

- 两面板均显示时，点击一次增加、一次清零：每次操作每个面板各有一条refreshCoins日志。
- 点击已有销毁左侧按钮，下一帧后右侧增加/清零：右侧数值和显示仍同步，没有靠自身补发通知来掩盖订阅被清除。

以上为当时的审阅建议，当前结论以下方保存版复核为准。同类搭建与接线首版后续暂按25～35分钟估计，修正与验收另记；不以本次速度直接缩短资源/异步阶段。

## 2026-10-19保存版复核：本轮共享练习通过

用户说明刚才代码未保存并要求重看。重新读取文件确认：

- ShareCoinPanel.addCoin只调用Owner.tryAdd，失败提示后结束；resetCoins只调用Owner.resetCoins；没有面板额外emit。
- ShareCoinPanel.onDestroy为空；自己的订阅仍由onDisable中的off移除。
- WalletOwner.onDestroy调用this.events.offAll，最终清理位于共享通知源持有者。
- 其余共享读取、恢复时直接同步与事件余额参数的配合正确，TypeScript检查再次通过。

结合已核对的场景引用与用户此前“运行结束，与预期相符”的反馈，本轮原定共享功能通过，记录用时27分钟。不能把第一次读取的未保存版本当作用户27分钟完成版本的错误；求助程度为按方法契约实现，并给过getWallet首次访问创建的小示范，未由助手代写主体代码。

销毁单面板后继续操作属于第一次审阅时建议的拓展，目前只有源码清理责任正确的证据，尚无该路径的单独运行报告；不冒充已测，也不强加为本轮原定要求。下一主题为本地存档，存储、数据契约及独立变式仍未完成，因此K2整体继续进行。
