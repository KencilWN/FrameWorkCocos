# 模块用法与最小例子

这些例子用于后续带练和自行查询，不是要求现在把商店一次重构完。import路径按示例文件位置调整；本页没有已挂场景的示例组件。新模块进入场景后才记录实际Creator验收。

## 清理与活动期订阅

在普通类里显式持有scope：

```ts
const scope = new DisposableScope();
events.on('changed', refresh, panel);
scope.add(() => events.off('changed', refresh, panel));
// 页面活动期结束
scope.dispose();
```

scope不会替你注册事件；它只收集成对的撤销动作。事件来自显式传入/持有的events，不要求全局dispatcher。

在继承ScopedComponent的组件里：

```ts
protected onActivated(scope: DisposableScope): void {
    const button = this.buyButton;
    if (!button) return;
    button.node.on(Button.EventType.CLICK, this.requestBuy, this);
    scope.add(() => button.node.off(Button.EventType.CLICK, this.requestBuy, this));
}
```

需要导入ScopedComponent、DisposableScope、Button，并自己定义/绑定buyButton和requestBuy。父类在隐藏时执行撤销；重复打开不会继续累加。这里不覆盖onEnable/onDisable，减少忘记super的风险。不能因此认为所有已有组件都必须换基类。

## 显式状态观察

```ts
const selectedQuantity = new ObservableValue<number>(1);
const off = selectedQuantity.subscribe((current, previous) => {
    console.log('数量变化', previous, current);
});
selectedQuantity.set(3); // 触发
selectedQuantity.set(3); // 相同值不触发
off();
```

对象类型的`.value`并非副本。若数据来自模型，继续使用模型方法及快照边界，不能绕过Wallet/Inventory规则。

## 只让最新结果应用

下面是独立讲原理的伪页面流程，`query`由业务传入：

```ts
const ticket = requests.begin();
try {
    const result = await query();
    if (!requests.isCurrent(ticket)) return;
    applyResult(result);
} catch (error) {
    if (requests.isCurrent(ticket)) showError(error);
}
// 隐藏/切换上下文时 requests.invalidate()
```

gate不能替代资源释放。延迟A、快速B、隐藏后完成各自需要测试。query若支持AbortSignal取消，可由业务额外调用；当前工具不假装中断它。

## 加载SpriteFrame并在隐藏时清空引用

本例未来可自行建立 `AsyncIconExample.ts`，不替当前数量练习创建资产。需要一个Sprite引用，以及自行准备的 `assets/resources/learning/icon` 图像（设置为SpriteFrame）。组件例子如下：

```ts
import { _decorator, isValid, Sprite, SpriteFrame } from 'cc';
import { ScopedComponent } from '../../Framework/components/ScopedComponent';
import { DisposableScope } from '../../Framework/lifecycle/DisposableScope';
import { ResourceScope } from '../../Framework/resources/ResourceScope';
const { ccclass, property } = _decorator;

@ccclass('AsyncIconExample')
export class AsyncIconExample extends ScopedComponent {
    @property(Sprite) icon: Sprite | null = null;

    protected onActivated(scope: DisposableScope): void {
        const icon = this.icon;
        if (!icon) return;
        const assets = new ResourceScope();
        const ticket = this.requests.begin();
        scope.add(() => {
            if (isValid(icon, true)) icon.spriteFrame = null;
            assets.dispose();
        });
        void this.loadIcon(icon, assets, ticket);
    }

    private async loadIcon(icon: Sprite, assets: ResourceScope, ticket: number): Promise<void> {
        try {
            const frame = await assets.load('learning/icon/spriteFrame', SpriteFrame);
            if (!this.requests.isCurrent(ticket) || !isValid(icon, true)) return;
            icon.spriteFrame = frame;
        } catch (error) {
            if (this.requests.isCurrent(ticket)) console.warn('图标加载失败', error);
        }
    }
}
```

隐藏时先清Sprite引用再归还scope资产；加载还没完成时关闭，ResourceScope会在结果到达时自行平衡其引用并reject。SpriteFrame路径取决于资源导入子资源，本例使用图像的 `/spriteFrame` 子资源，必须在Creator确认真实路径。

如果想隐藏时保留图标，则资源应由更长生命周期持有，并重新设计清理时机，不照搬“隐藏即释放”。如果一次启用中又切换多次图标，应为每次请求准备/清理合适的scope，不能只invalidate票号就以为资产已释放。

## 显式页面宿主

```ts
const host = new PanelHost(popupRoot);
const panelNode = host.open(alreadyLoadedPrefab);
// 获取具体业务组件、传数据由业务页面决定
host.close(panelNode);
// 页面宿主结束
host.dispose();
```

popupRoot由Inspector/启动组装传入，不用find任意全局节点。alreadyLoadedPrefab可来自场景属性或ResourceScope；它的资源持有者必须覆盖所有实例的实际存活期。host只销毁自己创建的节点，不清root里其他UI。

## 节点复用

```ts
const pool = new PrefabPool(itemPrefab, 12);
const node = pool.acquire(); // inactive
content.addChild(node);
// 设置当前条目数据/回调、重置选择与动画
node.active = true;
// 不再显示：先清条目私有状态
pool.release(node);
// 整个列表结束（借出节点也会被销毁）
pool.dispose();
```

池不自动调用你具体的ItemCell.reset，也不修改ItemCell脚本。需要使用者定义重置契约，才能防止“下一条商品执行上一条回调”。三条商品静态列表不必提前接入池。

## 串行任务

```ts
const queue = new SerialTaskQueue();
const a = queue.enqueue(async () => loadFirstPart());
const b = queue.enqueue(async () => loadSecondPart());
// 两次返回都需要处理；前者失败不自动阻断后者
const results = await Promise.allSettled([a, b]);
queue.close();
```

loadFirstPart/loadSecondPart由调用者定义。若业务要求A失败就不做B，应明确在catch关闭或直接用一个async函数顺序await，不能假设任何队列都自动拥有此策略。

## 音频

```ts
const audio = new AudioPlayer(audioSource);
audio.setVolume(0.5);
audio.playMusic(musicClip);
audio.playEffect(clickClip);
audio.stop(); // 停音乐，不统一停止playOneShot短音效
```

AudioSource通常由场景/常驻根节点持有。clip来自Inspector或显式资源持有者，不能播放后立刻dispose资源scope。没有自动常驻/自动加载，也没有跨平台播放确认。
