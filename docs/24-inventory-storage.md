# 实验二十四：背包跨重开存档

2026-10-22，实际学习日D03，K2进行中。实验二十三已通过限定验收。本轮属于已学存储与恢复方法的接入，暂估25～35分钟；用户写练习业务代码，助手讲职责、审阅与检查。本文为聊天留档。

## 结果与职责

在InventoryMain场景领取道具，停止重开后保留数量。复用LocalStorage和Inventory.tryRestore，仅修改现有D2/InventoryPanel，无需新场景/按钮/通用框架文件。

当前单页组件已经持有Inventory，本轮兼任该实例的创建与存档协调；Inventory普通类继续负责道具规则与结构恢复，LocalStorage负责JSON和物理读写。后续多个界面共享或状态需要独立于页面生存时，再把持有/读写协调移动到Owner。本轮不为了分层再造一套框架。

## 接入位置

在assets/Demo/D2/InventoryPanel.ts导入：

```ts
import { LocalStorage } from '../../Framework/storage/LocalStorage';
```

类外常量：

```ts
const INVENTORY_STORAGE_KEY = 'framework-demo.inventory.items.v1';
```

类内成员：

```ts
private storage = new LocalStorage();
```

同一key保存整个getItems()数组。LocalStorage内部已有JSON.stringify/parse，调用方不再次转换。不使用Wallet的key。

## 两个方法由用户实现

private loadItems(): void：

1. storage.getItem(INVENTORY_STORAGE_KEY)读取saved。
2. saved === null时直接return，保留当前初始空背包；不要把空数组当成缺失。
3. 调用inventory.tryRestore(saved)，返回false时console.warn提示存档无效，保留当前空背包，组件仍可操作。
4. 读取完成后不调用saveItems，不自动删除无效记录；下一次合法领取会保存新状态。

private saveItems(): void：

1. storage.setItem(INVENTORY_STORAGE_KEY, inventory.getItems())。
2. 返回false时console.warn提示保存失败，不回滚本次内存修改，不阻止界面刷新。

onLoad：已有必要引用检查及失败return之后，调用this.loadItems()。onEnable继续原来的绑定与refreshItems，让第一次显示读到恢复后的状态，不在onEnable重读或重建。

claimPotion/claimGem：tryAdd成功分支中依次saveItems、refreshItems；失败不保存。现有onDisable只解绑，不在生命周期结束时才存档。

## 正常验证

预览InventoryMain。首次无该key时为空；药水点击两次、宝石一次→potion4/gem1；停止并重开应仍为4/1。金币与ShareCoinPanel中的模型练习互不影响。

## 无效结构验证与收尾

临时在onLoad的this.loadItems()正前方加入：

```ts
this.storage.setItem(INVENTORY_STORAGE_KEY, [
    { itemId: 'potion', count: 8 },
    { itemId: 'gem', count: 'bad' },
]);
```

这段能正常序列化为JSON，但第二条数量类型不符合道具规则。预览应告警并显示空背包，第一条potion8只存在临时candidate，不应残留到界面。区别于JSON文本损坏，本轮验证可解析JSON的业务结构校验。

验证后删掉临时注入，保存脚本，停止并重新预览；损坏记录仍在，继续空背包是预期。点击一次药水→potion2并保存，停止重开应仍为potion2。这证明拒绝坏数据后仍能操作，合法新状态可覆盖旧记录。

完成后报告结果与实际用时。当前未实现/运行，不将catch存在、模型检查或步骤说明记为存档通过；物理存储读写失败仍待后续专门验证。

## 首版14分钟：运行路径有证据，职责待修正

用户提供预览日志：坏记录第一条potion8进入临时背包，第二条数量类型被拒绝，显示背包为空；点击后新增potion2；新预览进程恢复potion2。结合实际源码loadItems位置，支持坏结构拒绝后可操作并恢复合法保存。用户报告14分钟，记录为首版；未提供修正耗时，不提前计完整验收用时。

审阅：onLoad在引用检查后恢复，独立key与封装使用正确，注入已清理；保存失败使用console.error也接受，现有流程不会因此阻断刷新。TypeScript检查通过。

三处定向修正：

1. saveItems放在refreshItems的非空分支，导致onEnable或任何非空显示刷新都写存档；空显示又直接return。移出刷新，放到两个领取成功分支中、刷新之前，明确操作成功触发保存。
2. loadItems读到null时额外setItem空数组，不符合只读恢复契约。封装的null也可能代表解析失败；此时自动写空会在仅打开页面时覆盖记录。删去setItem，仅return。
3. loadItems忽略tryRestore的boolean，需在false时由协调层提示“背包存档无效，使用空背包”。模型自己的字段警告保留，不能依赖所有拒绝分支都会自行输出。

当前不记实验整体通过。用户修正后只需回归一次成功领取与重开，既有坏结构验证不要求整套重做；助手再核对读写调用位置。不代写练习代码，不重复八项模型测试，不把14分钟外推为复杂资源/异步阶段速度。

## 职责修正完成

用户随后回复ok，实际保存版源码已修改三处：refreshItems不再保存；loadItems读到null只return，并检查tryRestore返回值、失败提示；两个领取方法成功后刷新并保存。当前采用先刷新、再保存，两者同步且已有引用检查，满足本轮行为，接受，不将顺序差异升级为必须返工。保存失败仍输出错误而不回滚内存。

类型检查通过。本轮接入代码收尾完成，用户修正版未另给重开日志；下一轮实验二十五开始先做一次正常领取/重开建立基线，覆盖本次受影响路径。首版14分钟保留，修正用时未知，不杜撰完整净耗时。

实验二十五后续已收到预览附件：新进程恢复potion4，失败模拟后再开仍4，恢复真实保存后新进程恢复6，实际源码读写职责正确且真实调用恢复。本轮修正版跨重开回归完成，背包接入限定验收通过；首版14分钟，修正时间未知。
