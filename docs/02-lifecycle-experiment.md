# 实验二：隐藏与恢复计数器

前置：用户已运行两套计数器，确认状态互不影响；场景中实际节点名为 CoinCounterL / CoinCounterR，引用均指向各自子节点。

本轮目标：观察 node.active 切换时的 onDisable/onEnable，确认隐藏的组件仍保留字段。代码文件由学习者在 Creator 中创建和输入，助手不预先写入 assets。

## 1. 创建一个位于计数器外的按钮

在 Canvas 下创建 UI Button，命名 ToggleLeftButton，位置可设为 (0,-230,0)，文字为「显示/隐藏左侧」。它与 CoinCounterL/R 同属 Canvas，不放进任何计数器里面，确保左侧隐藏后还能再次点击开关。

## 2. 亲手创建 PanelToggle.ts

在 assets/Demo 新建 TS 组件脚本 PanelToggle.ts，输入以下参考。脚本挂在 ToggleLeftButton 上，将 CoinCounterL 节点拖入 Panel 字段；Button 的 Click Events 保持为空。

```ts
import { _decorator, Button, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PanelToggle')
export class PanelToggle extends Component {
    @property(Node)
    panel: Node | null = null;

    onEnable(): void {
        this.node.on(Button.EventType.CLICK, this.togglePanel, this);
    }

    onDisable(): void {
        this.node.off(Button.EventType.CLICK, this.togglePanel, this);
    }

    private togglePanel(): void {
        if (this.panel) {
            this.panel.active = !this.panel.active;
        }
    }
}
```

this.node 指当前脚本挂载的按钮节点；this.panel 指编辑器拖入的计数器节点。`!` 是布尔取反，true 变 false，false 变 true。

## 3. 给原计数器日志加上名字

CoinCounter.ts 中已有 onLoad/onEnable/onDisable/onDestroy，只修改日志，让每条带上 this.node.name。例如：

```ts
console.log(this.node.name, 'onLoad');
console.log(this.node.name, 'onEnable：已绑定监听');
console.log(this.node.name, 'onDisable：已解绑监听');
console.log(this.node.name, 'onDestroy');
```

四行分别放在现有对应方法中，保留原来的业务操作和清理。无需手动调用任何生命周期方法。

## 4. 先预测，再运行

保存代码与场景，刷新预览。左侧加到 10 后，点击开关隐藏，再点击恢复，观察：

- 隐藏时是否打印左侧 onDisable？
- 恢复时打印哪些方法？是否再次 onLoad？
- 恢复后余额是多少？再点一次加五是多少？
- 右侧是否保持自己的状态？

预期：初次激活时左侧 onLoad→onEnable；隐藏时 onDisable；恢复时 onEnable，onLoad 不重新执行。余额仍是 10，再加五成为 15。当前代码没有在禁用时清零，也没有销毁节点。

连续关闭/恢复三次再加一次，检查业务没有重复执行。原事件系统有注册去重，所以没有重复执行不能单独证明 off 生效；核对日志和对应清理代码，必要时下断点。

当前只练隐藏/恢复，节点最终销毁和 start 的一次性行为后续分别验证。浏览器刷新会创建新一轮运行，日志与状态不可和同一轮隐藏/恢复混为一谈。

## 记录

2026-10-17 用户已完成参考代码输入与绑定，反馈恢复余额仍为 10，打印 onEnable 和 refreshCoins。助手对照源码与截图确认：左侧隐藏时 onDisable，恢复时 onEnable→refreshCoins(10)，恢复阶段没有再次 onLoad。

[本次日志截图](evidence/2026-10-17-counter-lifecycle.png)。开关节点位于 Canvas，目标引用为 CoinCounterL；两套计数器仍各自绑定自己的子节点。start、最终销毁及更深入的监听清理验证后续单独进行。

## 下一步：亲手添加 start 日志

在 CoinCounter 类中仿照现有 onLoad 的方法声明，新增 start(): void，里面只打印当前节点名与 start。保留原有生命周期方法和监听逻辑。

刷新预览，分别看每个组件的日志；左侧隐藏/恢复两次。预期单个组件首次 onLoad→onEnable→start，onEnable 内原有 refreshCoins 日志仍会出现；同一实例恢复只再次 onEnable 和其内部调用，不再次 start/onLoad。两个不同组件之间的全局日志顺序不作为这项验收要求。

2026-10-17 用户已新增 start 日志并运行反馈：首次在 onLoad/onEnable 后执行一次，之后隐藏恢复没有再次 onLoad/start。本项记为用户运行报告通过；最终销毁仍未验收。
