# 实验十四：独立完成奖励面板

这是K1的整合练习，预计20～30分钟，以实际投入反馈校准。当前已有逐项实操与排错证据，本轮检验能否从空组件独立接起完整流程，不提前宣告K1通过。

## 1. 范围与帮助方式

- 新建assets/Scene/PracticeMain.scene，保留原LearningMain场景。
- 新建assets/Demo/RewardCounter.ts组件，先合上CoinCounter，不复制其实现。
- 允许查Cocos API、自己的笔记、Wallet/EventDispatcher/PanelToggle公开接口。卡住时保留现象和自己的尝试，请求分级提示。
- 复用现有Wallet，不新建同构钱包类；Framework原文件不改。
- 助手只提供需求与验收，用户亲自创建场景、写组件并预览。

## 2. 场景

创建2D场景，在Canvas中建立：

```text
Canvas
├─ RewardPanel
│  ├─ CoinLabel
│  ├─ ClaimButton
│  └─ ClearButton
└─ ToggleButton
```

RewardCounter挂在RewardPanel。ClaimButton文字为“领取12”，ClearButton为“清零”。位置自行安排，按钮不重叠。

ToggleButton在面板子树外，复用现有PanelToggle，panel绑定RewardPanel。DestroyLeftButton可留空，当前实现使用可选调用，不要求本轮做销毁。

编辑场景时先停止预览，完成后保存；原场景不覆盖。

## 3. 功能要求

- 初始金币0，每次领取12，上限30，三项通过Inspector可配置。
- 使用自己的Wallet实例保存余额，组件不再保存另一份coins长期状态。
- 领取调用Wallet.tryAdd，超额时整次拒绝，组件提示，余额与界面保持原值。
- 清零调用Wallet.resetCoins。
- 成功修改后，通过本实例EventDispatcher通知显示；onEnable先登记并读取当前值刷新，onDisable成对清理。
- 隐藏/恢复不创建新钱包，余额保留，恢复后的单次点击只执行一次操作。
- 所有必要Label/Button引用在初始化时检查，漏绑时有可定位提示并停止后续初始化。
- 用has检查本轮金币变化监听登记后true、解绑后false。

组件字段、方法、事件名由学习者自行命名，效果和责任清楚即可。配置文字可以像原场景一样动态生成。

## 4. 可查的接口

Wallet.ts：constructor(initialCoins,maxCoinLimit)、getCoins()、tryAdd(amount):boolean、resetCoins():void。

EventDispatcher.ts：on(eventName,callback,target)、emit(eventName,data)、off(eventName,callback,target)、has(eventName,callback,target)、offAll()。

RewardCounter与上述文件同在既有目录结构，可自行检查导入路径。此处不提供完整组件和方法体。

## 5. 按顺序验收

| 操作 | 预期 |
| --- | --- |
| 初次运行，领取三次 | 0→12→24→24，第三次拒绝 |
| 清零，再领取一次 | 0→12 |
| 隐藏/恢复三次 | 保持12，整个面板跟随显隐；has在解绑后false、登记后true |
| 恢复后再领取一次 | 24，仅增加一次 |
| 重新运行预览 | 回到初始0；本轮尚无存档 |
| 临时清空一个必要按钮引用再运行 | 有明确绑定提示，没有后续空引用异常 |
| 恢复引用、保存再运行 | 正常初始0、领取到12 |

以上是同一场景内按阶段观察，重新运行会重新创建内存对象。测试结束恢复正常绑定，保留便于审阅的日志。

## 6. 反馈

完成后报告运行结果、大致实际投入，以及一句话解释按钮点击到Label更新的过程。助手会读取新脚本与场景，必要时再问一个反例；不要求一次写得毫无错误。

如果中途求助，说明自己已完成到哪一步、预期与实际、首条错误；帮助程度照实记录。源码/运行/解释证据齐全后再决定K1整体验收与后续共享状态/存档课程。

状态：用户于2026-10-17 18:23开始，18:47报告操作结束，首版跨度24分钟（用户未提中断，净投入不另行推断）。实际文件CoinCounterPractice.ts / PrecticeMain.scene，允许命名差异。首版类型检查通过（skipLibCheck=true），核心复用、引用、配置与成对监听正确。助手未创建或修改assets练习实现，未创建提醒或自动任务。

## 首版审阅与收尾

DestroyLeftButton未绑定符合本轮范围，PanelToggle已有可选调用，不需要为了验收添加销毁功能。

showCoins收到无载荷通知后读取Wallet的当前值，是成立的设计，不强制改为事件传数字版。方法名、字段名和节点英文文字不要求完全照教程。

首版发现两处（现已按审阅方向修正）：

1. 初次显示：当前onEnable只登记，start也不刷新；场景CoinLabel初始为label。完成登记后主动调用显示方法，让初次启用和每次恢复都同步当前余额。
2. 失败通知：claimCoin失败后仍执行方法末尾emit。拒绝增加时结束方法，成功提交后再通知变化。

两处修正先按3～5分钟估，实际时间后续反馈。之后按上方表格运行：初次0；三次领取12/24/24且第三次不调用金币刷新；清零与显隐保持；重新预览恢复0；必要引用漏绑可定位且无额外异常，恢复后正常。补充运行结果及一句按钮→Wallet→事件→显示的解释，再决定K1整体验收。

当前没有强制新增onDestroy offAll：本实例监听已在onDisable撤销，dispatcher为组件自有；不为了样板数量引入额外工作。尚无助手预览实测，不把静态核对记成运行全通过。

2026-10-17修正审阅：onEnable登记后已新增emit('coins-changed')，通过已登记的showCoins同步显示；claimCoin失败分支已return。当前仅showCoins订阅该实例事件，接受该显示同步方案，不强制改为直接调用；未来共享及增加其他订阅时再精化事件语义。引用与配置正常。尚待用户反馈修正版运行验收与一句调用链，助手未修改练习源码，未因简单调用/return重复类型检查。

后续复述已通过：用户说明claimCoin→wallet.tryAdd→成功后emit→showCoins，核心顺序正确。已补充tryAdd返回boolean、组件发事件、showCoins读当前余额写Label的职责。当前只剩修正版运行验收结果的明确确认，无需重复贴全部日志或重新复述；尚不从本次仅解释调用链的回答推断运行全通过。

最终收尾：2026-10-17用户明确确认修正版运行全部符合预期，并要求今天收尾、明天继续。结合源码/场景核对、最终TS检查通过、运行反馈和复述，本轮独立整合及K1基础关通过。首版24分钟，后续修正耗时未另计。后续进度以[progress.md](progress.md)为准，明天从[共享钱包起点](15-next-session.md)继续；今天不布置新增任务。
