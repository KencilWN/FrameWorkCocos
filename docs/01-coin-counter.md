# 第一课：把迁入的事件模块接到一个金币计数器

目标：在 Creator 中亲手搭出按钮和 Label，看到「点按钮 → 改金币 → 发通知 → 更新文字」。完成这一课，再拆多个组件。

参考代码已准备好；你要亲手搭场景、绑定引用、预览和修改代码。这是示范后练习，不能仅以文件存在视为学会。

第一次跟做只完成第 2～4 节：搭节点、绑定、预览。看到计数结果后，再回头读第 1、5 节的事件解释，不用同时消化全部概念。

## 1. 今天迁了什么，为什么只迁它

从 GameSlot 的 `assets/Scripts/Lib/FrameAsserts/event/` 原样复制了两个文件：

- `EventDispatcher.ts`：按事件名登记、查找和通知监听者。
- `EventList.ts`：保存某个事件的回调列表，并执行回调。

直接依赖关系是 `CoinCounter → EventDispatcher → EventList → cc`。末端是 Cocos 引擎；不需要先复制 Global、fwk、网络和 UI 管理器。

本课只使用三个方法：

| 方法 | 本课含义 | 调用位置 |
| --- | --- | --- |
| `on` | 登记：金币变了就执行 refreshCoins | onEnable |
| `emit` | 通知：金币现在是多少 | addCoin / resetCoins |
| `off` | 撤销登记 | onDisable |

这是项目自定义事件模块。按钮点击则是引擎自己的节点事件；两条事件链会在例子里连接起来。

原样迁入不等于已审定为完善公共库；已知限制单独记在 [迁移记录](migration-notes.md)，今天不用的功能先不展开。

## 2. 先在 Creator 中搭出四个节点

1. 用 **Creator 3.8.7** 打开 `/Users/mac/FrameWorkDemo`，等待脚本导入结束。
2. 在 Assets 新建 `Scenes` 文件夹，创建并保存一个 2D 场景，命名 `LearningMain`。如果新场景已有 Canvas，就使用已有的；没有则创建 UI Canvas，保留它配套的 UI Camera。
3. 在 Canvas 下创建一个空节点，命名 `CounterPanel`。把它的位置设为 `(0, 0, 0)`。它作为组件的挂载点；本课无需额外挂 Layout/Widget。
4. 在 CounterPanel 下创建 UI Label，命名 `CoinLabel`。再创建两个 UI Button，命名 `AddButton` 和 `ResetButton`。使用引擎自带 Button 模板即可。

节点树应类似：

```text
LearningMain
└── Canvas
    ├── Camera              # 使用实际模板的相机名称
    └── CounterPanel
        ├── CoinLabel       # 有 Label 组件
        ├── AddButton       # 有 Button 组件，通常含一个文字子节点
        └── ResetButton     # 有 Button 组件，通常含一个文字子节点
```

先不添加其他节点。名字主要帮助我们查找；代码通过 Inspector 引用访问它们，并不按这个名字搜索。

建议把 CoinLabel 放在局部坐标 `(0, 100, 0)`，AddButton 放在 `(0, 0, 0)`，ResetButton 放在 `(0, -100, 0)`。按钮文字分别改成「加一」「清零」。CoinLabel 文本先填「等待运行」，字体调到能看清即可，例如 32。

**此时只验收一件事：在场景里能看见一段文字和两个没有重叠的按钮。** 位置是相对 CounterPanel 的局部坐标，不是屏幕左上角坐标。

## 3. 挂脚本，拖入三个引用

1. 在 Assets 找到 `assets/Demo/CoinCounter.ts`。
2. 把脚本拖到 Hierarchy 中的 `CounterPanel` 节点；选中 CounterPanel，Inspector 应出现 CoinCounter 组件。
3. 把 CoinLabel 节点拖到 CoinCounter 的 **Coin Label** 字段。
4. 把 AddButton 节点拖到 **Add Button** 字段，把 ResetButton 拖到 **Reset Button** 字段。
5. 两个 Button 自带的 **Click Events 保持为空**。本课已用代码注册点击，不要同时再填一套。
6. 保存场景。

这里拖入的是节点上的对应组件引用。`@property(Label)` 告诉 Creator 这个字段需要一个 Label；它不会自动创建 Label，也不会按名字帮你找节点。

```ts
@property(Label)
coinLabel: Label | null = null;
```

`null` 表示引用可能还没绑；字段上的 `Label` 类型检查也不会替你完成编辑器操作。

## 4. 第一次预览，只检查这一组结果

选择当前保存的 `LearningMain` 场景，使用 Browser 预览，打开运行页面的浏览器控制台。

| 操作 | 应观察到的结果 |
| --- | --- |
| 初次运行 | 文字变成「金币：0」 |
| 点加一 3 次 | 文字依次为 1、2、3 |
| 点清零 | 回到 0 |
| 刷新浏览器预览 | 重新从 0 开始 |

初次日志应先有 `onLoad`，再有 `onEnable`，然后打印一次 `refreshCoins：0`。每次点击加一应新增一条 `addCoin` 和一条 `refreshCoins`。

如果出现 `请先绑定...`，回 Creator 检查三个字段，重新保存并刷新预览。这个组件会主动禁用自身，避免在缺少引用时继续工作。

这一课还没有存档，所以刷新后归零是正确结果。不要为了保留数字先迁入 Session 或 Global。

## 5. 第一次只读这三个小方法

打开 `assets/Demo/CoinCounter.ts`，先看：

```ts
private addCoin(): void {
    this.coins += 1;
    console.log('[CoinCounter] addCoin：', this.coins);
    this.events.emit(COINS_CHANGED, this.coins);
}
```

第一行修改**内存里的数字**；最后一行发送通知，附带这个新数字。改数字本身不会自动修改 Label。

```ts
this.events.on(COINS_CHANGED, this.refreshCoins, this);
```

这行在 onEnable 中执行。它登记事件名、要调用的方法和该方法执行时使用的对象。`this.refreshCoins` 是把函数交出去，写成 `this.refreshCoins()` 则是立刻调用它；两者不同。

```ts
private refreshCoins(coins: number): void {
    if (this.coinLabel) {
        this.coinLabel.string = `金币：${coins}`;
    }
    console.log('[CoinCounter] refreshCoins：', coins);
}
```

收到通知后才把数字写到 Label。发送时附带的数字成为这个方法的 `coins` 参数。

当前把数据、发送者和显示放进一个组件，是为了先看清通知过程；这么简单的计数器直接调用刷新也能工作。下一课才把状态与显示拆开，观察事件在多个组件间的作用。

## 6. 亲手改两次，再恢复

每次改之前先预测，保存代码后按需重新打开预览，记录实际结果。

**练习 A：把每次加一改成每次加五。**

只改一处 `this.coins += 1`。刷新后点击两次，预期是 10。按钮文字也可以亲手改成「加五」，但那是另一个编辑器改动。

**练习 B：临时注释 addCoin 中的 emit。**

恢复每次加一，注释发送通知的那行。刷新后点三次：addCoin 日志应显示 1、2、3，但 Label 仍显示 0。解释原因后恢复 emit。

这两步分别验证「数据怎么变」和「界面为什么会变」。没有运行结果，不把它们标记成完成。

## 7. 这次先认识清理，不一次讲完整个框架

onEnable 负责登记，onDisable 负责撤销登记：

```ts
this.events.on(COINS_CHANGED, this.refreshCoins, this);
this.events.off(COINS_CHANGED, this.refreshCoins, this);
```

两边使用同一个事件名、同一个方法引用和同一个 target。不要分别写 `.bind(this)`，因为每次 bind 会创建新函数。

本课从代码认识这一对；下一课会加入位于面板外的开关按钮，亲手验证隐藏和重开。不要把按钮放进要隐藏的面板后再用它恢复面板。

## 8. 卡住时先按现象检查

| 现象 | 先查什么 |
| --- | --- |
| 找不到 CoinCounter 组件 | 先看脚本编译错误和导入是否完成，确认文件在 assets/Demo |
| 画面空白 | 是否预览了已保存的 LearningMain；Canvas、相机和节点是否激活 |
| 文字还显示「等待运行」 | 脚本是否挂到场景节点；组件是否启用；三个字段是否绑定 |
| 点击没日志 | Button 是否 Interactable；脚本启用状态；是否有其他 UI 遮挡 |
| 一点出现两次 addCoin | 是否挂了两个 CoinCounter，或又配置了 Click Events |
| 出现两个 Canvas / 相机 | 检查新场景模板已创建的节点，不要重复添加 |

出现问题时保留第一条错误原文和操作顺序；不先整包复制旧项目依赖。

## 完成标准与本轮反馈

- [ ] 能亲手创建节点、挂脚本、完成三处绑定。
- [ ] 能运行并得到 0→1→2→3→0。
- [ ] 完成加五实验及 emit 注释实验。
- [ ] 能用自己的话说明：数字由谁修改、Label 由谁更新。

下一次只需要告诉助手：做到哪一步、实际结果、第一条错误（如果有）。无需先读懂两个事件文件里的所有循环和类型。

相关原理：OKF 的 `cocos-editor-first-run.md`、`cocos-scene-component-lifecycle.md`。生命周期与按钮参考已核对 [官方生命周期](https://docs.cocos.com/creator/3.8/manual/zh/scripting/life-cycle-callbacks.html) 和 [Button 文档](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/button.html)；文档属于持续更新的 3.8 LTS，实际环境以本机 3.8.7 为准。
