# 实验十一：回调函数与调用时的this

前置：购买扣款主路径已运行；按钮层级已修正并保存。当前按钮监听如下：

```ts
this.buyButton.node.on(Button.EventType.CLICK, this.buy, this);
```

## 本轮先预测

由学习者先解释：既然第二个参数已经写this.buy，为什么最后还需要一个this？

若仅将购买按钮的注册改成以下写法，点击后会发生什么？

```ts
this.buyButton.node.on(Button.EventType.CLICK, this.buy);
```

预测阶段已完成：用户正确指出省略target后buy内部的this无法访问组件字段。补充精确概念为调用上下文；末尾this不是buy的普通业务参数。接下来执行约5分钟的对照实验。这里讨论Cocos节点事件on，其target为可选；不要同时省略自研EventDispatcher.on的必需target参数。

## 对照实验（已收到反馈）

1. 在buy第一行、读取this.wallet之前新增console.log('进入buy，this =', this)。保留原有方法体。
2. 保留节点事件on末尾的this，保存后重新运行预览，点击左侧购买一次。应打印CoinCounter组件实例，余额100→70。
3. 仅将购买按钮的on改为不传末尾this，保存并重新运行预览，点击左购买。应先打印进入buy和undefined，再在读取this.wallet处出现异常；余额保持初始100。
4. 恢复原有on的末尾this，删除临时打印，保存并重新运行预览，再点击左购买，应正常100→70。

每次重新运行预览，避免旧监听混入。off继续保留原来的完整参数，本轮只临时对比购买按钮on的target，实验结束恢复配对状态。提供省略target时的日志、第一条错误与恢复后的结果；结果不一致时先保留现象，定位该步骤。

## 教学核对依据

本机Creator3.8.7引擎cocos/core/event/callbacks-invoker.ts:349-352在存在target时执行callback.call(target,...)，否则执行callback(...)。读取this.buy获得函数引用并不自动绑定实例；普通类方法在该无target调用中this为undefined，当前buy会在读取this.wallet时报错。原函数仍然可以被调用，函数调用与调用时this的归属是两件事。

自研EventList.emit同样使用element.handler.call(element.target,...)，随后再追这条源码，联系迁移进来的事件模块。本次未修改底层。

状态：2026-10-17用户提供省略target时进入buy、this为undefined及读取wallet异常的日志；恢复后this打印为CoinCounter，余额刷新70，实验通过。源码确认on的target已恢复，buy的临时打印仍在，下一轮可删除。PreviewInEditor和Window重复显示同一错误，不据此判定函数调用两次。后续进入[has解绑验证](12-event-unsubscribe.md)。
