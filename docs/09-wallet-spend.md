# 实验九：独立实现钱包扣款

前置：Wallet已保存余额并提供getCoins、tryAdd和resetCoins；组件已接入钱包，原组件coins字段已删除。用户已听取组件/普通类的分工解释，本轮通过一个新行为检验应用。

预计动手5～10分钟，实际耗时与完成情况由用户反馈后再校准。本轮仅做购买所需的扣款，不包含道具到账、背包或完整商店。

## 1. 自己实现方法体

在Wallet.ts新增：

```ts
public trySpend(amount: number): boolean
```

行为要求：

- 费用必须大于0，且不大于当前余额，才允许扣款。
- 成功时扣除费用并返回true。
- 余额刚好等于费用时，允许扣到0。
- 余额不足，或费用为0/负数时，返回false，余额不变。
- Wallet只处理数字与规则；提示、Label更新和通知继续由调用者负责。

可参考tryAdd的结构，独立决定条件写法。方法体由学习者完成，助手不提前给出答案。此次测试输入为下面列出的整数，不代表完成所有输入边界或完整商用钱包验证。

## 2. 临时测试

在CoinCounter现有start日志后添加以下调用。这里new的是测试钱包，不是组件字段this.wallet，测试用扣款不会改变界面正在使用的余额。

```ts
const testWallet = new Wallet(10, 20);
console.log('扣3', testWallet.trySpend(3), testWallet.getCoins());
console.log('扣7', testWallet.trySpend(7), testWallet.getCoins());
console.log('扣1', testWallet.trySpend(1), testWallet.getCoins());
console.log('扣0', testWallet.trySpend(0), testWallet.getCoins());
console.log('扣-5', testWallet.trySpend(-5), testWallet.getCoins());
```

按同一个测试对象依次执行：

| 费用 | 是否成功 | 操作后余额 |
| --- | --- | --- |
| 3 | true | 7 |
| 7 | true | 0 |
| 1 | false | 0 |
| 0 | false | 0 |
| -5 | false | 0 |

左右CoinCounter都会执行自己的start，因此这组临时日志应出现两套，各自从10开始。正式左右余额仍来自原配置100和10。

## 3. 反馈与后续

提供trySpend方法和测试日志。若结果不一致，保留当前实现与第一处偏差，先定位这一轮。

通过后再添加购买按钮与Inspector费用配置，组件调用同一方法并根据结果提示/发事件；随后合并验收清零、隐藏恢复和两个实例独立。道具数据、库存与完整购买流程留到后续课程。

状态：2026-10-17用户贴出方法与右侧start的五条测试日志，均符合表格预期。源码一致，条件为amount>0 && this.coins>=amount；当前类型检查通过（skipLibCheck=true）。未据此宣称所有输入边界或完整购买已验证。进入[购买按钮接入](10-buy-button.md)，助手未修改assets中的练习源码。
