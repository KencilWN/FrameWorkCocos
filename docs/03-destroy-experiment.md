# 实验三：销毁当前运行的左侧计数器

前置：初始100→加两次110→隐藏恢复110→清零0→再次恢复0，已由用户报告全部符合。

本轮亲手扩展 PanelToggle，不预先修改资产脚本。目标是观察活动节点最终销毁时的 onDisable/onDestroy，并验证外部引用的收尾。

## 需求与编辑器操作

在 Canvas 下新增 DestroyLeftButton，与 ToggleLeftButton 同级，位置可设为 (0,-290,0)，文字设为「销毁左侧」。

继续使用 ToggleLeftButton 上已有的 PanelToggle，增加一个 Button 引用字段 destroyButton，绑定新增按钮。不要给销毁按钮再挂一份 PanelToggle；否则会产生另一个独立控制器引用。

```ts
@property(Button)
destroyButton: Button | null = null;
```

## 代码练习

1. 仿照现有 on/off，在 onEnable 中为 destroyButton.node 的 CLICK 注册 this.destroyPanel，在 onDisable 中成对解绑。字段可能未绑定时先判断；保留原显隐按钮监听。
2. 新增销毁方法，参考：

```ts
private destroyPanel(): void {
    if (this.panel) {
        this.panel.destroy();
        this.panel = null;
    }
}
```

这里 destroy 请求销毁当前运行的节点与其组件/子节点；null 清空的是这个控制器保存的引用。将字段设为 null 本身不销毁节点；当前两步要分别理解。

本实验只有同一个控制器通过自己的字段销毁目标，随后立即将该字段置空，因此其已有 togglePanel 的 if(this.panel) 可阻止后续访问。以后若其他模块也能销毁该目标，非 null 引用还需要结合 isValid 检查；本轮不扩大到多写入者。

## 运行验收

保存脚本和场景，绑定新字段并刷新预览；在左侧可见、处于活动状态时销毁。

| 操作 | 期望结果 |
| --- | --- |
| 左侧处于活动状态时点击销毁 | 左侧消失，日志出现左侧 onDisable 与 onDestroy |
| 再点显隐按钮 | 不重新出现，不报错 |
| 再点销毁按钮 | 不重复操作已销毁节点，不报错 |
| 操作右侧计数器 | 继续正常 |
| 刷新预览 | 根据保存的场景创建新实例，两侧恢复，初始余额100 |

destroy 的实际收尾由引擎安排，观察本轮日志即可；不要手动调用 onDestroy 模拟销毁。当前操作作用于运行实例，不会从场景资产中删除左侧节点。

## 复述

- active=false 后为什么还能恢复，而最终销毁后同一节点不能通过 active=true 重新出现？
- this.panel=null 和 this.panel.destroy() 各自改变了什么？

2026-10-17 用户已给出 CoinCounterL 的 onDisable→onDestroy 两条运行日志。源码已核对：按钮监听成对、destroy 后清空当前控制器字段。重复点击、右侧状态和刷新重建尚未逐项收到反馈，继续单独保留待验收。

后续用户确认右侧仍可加五；重复点击与刷新重建未明确反馈。

## 为什么只置 null 不会让节点消失

当前节点有至少两条关联：Canvas 的 children 列表持有它，PanelToggle.panel 字段也指向它。panel=null 仅改变后一个字段，场景父子关系保持，节点继续参与运行与显示。

```text
Canvas.children ─────→ CoinCounterL 节点
PanelToggle.panel ───→ 同一个节点
```

调用 destroy 是请求引擎结束节点生命周期：实际处理时移出父节点 children，销毁子节点与组件，触发生命周期回调。引擎销毁不等于立刻强制回收全部内存；JavaScript 对象的回收还依赖剩余引用与垃圾回收器，图片等共享资源另有引用/缓存管理。

一个用于理解多引用的例子，尚未作为本轮实际运行结果：

```ts
if (this.panel) {
    const node = this.panel;
    this.panel = null;
    node.destroy();
}
```

node 保存同一对象的另一个引用，不会复制整棵节点树。清掉 panel 后，这个局部变量仍能用于请求销毁。真正复制节点会使用 instantiate 等专门的引擎接口，后面在 Prefab 课中实验。

用户已能解释这个引用关系，并指出使用let也能保留引用。const限制的是该变量不能再次赋值，例如不能将node重新指向别处；它不冻结节点对象，对仍有效的节点修改active等属性仍然允许。

3.8.7引擎源码证据：在本机Creator安装的引擎目录内查 `cocos/core/data/object.ts` 的 `CCObject.destroy` 和 `cocos/scene-graph/node.ts` 的 `Node._onPreDestroyBase`。原核对行约300/1493；不同安装路径不影响查找，不要求沿用旧电脑的绝对路径。引用细节以当前引擎版本为准。
