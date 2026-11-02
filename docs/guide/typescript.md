# 本工程需要的TypeScript基础

先用当前Wallet、Inventory、ShopModel理解常见表达，再按课程补泛型和异步，不以背完语法手册为前提。

## 值、对象与引用

`number/string/boolean`是基本值。对象、数组、Node由引用访问。`const node = this.panel`只保存同一对象的另一条引用；`this.panel = null`不会销毁节点，Node.destroy才请求销毁，且实际生命周期有引擎时序。

const约束变量不能重新赋值，不禁止修改对象字段。`const data={coins:1}; data.coins=2`可以；readonly是编译期的字段写入约束，不等于运行时冻结或深复制。

`{...snapshot}`只复制外层，里面items仍是同一个数组。`items.slice()`复制数组，但条目对象仍共享。现有Inventory.getItems逐条建立 `{itemId,count}`，因为字段只有基本值，已足以隔离当前结构；加入嵌套装备数据后需重新决定复制策略。复制有O(n)工作与分配成本，不无理由每帧做。

## 类、接口、脚本

Wallet是有运行时实例和方法的class；InventoryItem/Shopsnapshot是编译期的数据约定。interface不会生成对象，不能 `new Shopsnapshot()`，也不会检查JSON。脚本只是代码组织单位，不要求每个接口单独文件。

`private`限制TS调用入口（本项目不是运行时安全边界），public对外承诺操作。直接公开内部数组会绕过规则，因此使用受控方法。拆类主要限制改动范围，不保证运行更快。

继承表示稳定的可替代关系；组合表达“拥有/使用”。ShopModel有Wallet和Inventory，不能因为需要扣钱就继承Wallet。继承Component是参与引擎生命周期/序列化，不代表普通数据类都应该继承它。

## 函数与this

`this.refreshShop`是函数值，`this.refreshShop()`才执行。按钮监听传函数及target，让调用时this正确。直接把实例方法作为普通函数调用会丢失接收者。

`() => this.handleBuy(itemConfig.itemId)`使用箭头函数捕获页面this；局部每轮let对应商品ID。它在点击时读取this.buyNum，因此能使用后来的数量；如果创建列表时把数量先存到局部变量再捕获，就可能一直买旧数量。

`(() => void) | null`明确调用签名，Function过于宽泛。void表示调用者不使用返回值，不是禁止函数内部return值。函数或null二选一时，`if(callback)`与`!==null`均可；一般情况下`!==null`不排除undefined。

`quantity=1`仅在省略或传undefined时采用默认值，0/-1仍需业务校验。Number.isInteger会拒绝小数/NaN/Infinity；更大数值范围/上限要由实际产品约束决定，不把类型number当自动合法。

## unknown：检查，不是魔法转换

外部存档可能来自旧版本、用户编辑或错误写入，所以返回unknown。按顺序建立证据：

1. `data !== null && typeof data === 'object' && !Array.isArray(data)`确认顶层种类；typeof数组也是object。
2. `as {coins?:unknown;items?:unknown}`只允许读取候选字段，不复制、不验证。
3. typeof检查字段类型，整数/范围检查业务值；通过后TS能收窄字段类型。
4. 把items交给Inventory.tryRestore，由负责者验证其记录。

`as Shopsnapshot`不会把坏输入变好；any只是放弃编译器约束。不要用truthy判断合法余额，0也是假值；缺失判断用null/undefined或明确类型条件。

## Promise与async/await

async函数返回Promise；await使后续步骤在完成后继续，期间节点可能隐藏/销毁，也可能开始新请求。reject需要try/catch或调用者catch，否则出现未处理拒绝。不要把 `new Promise`里面没有resolve/reject的路径遗忘。

`LatestRequest`只能让旧结果不应用，不能中断网络/引擎加载。`SerialTaskQueue.close`不能打断运行中的任务。取消、失败、过期和清理是不同问题，见[所有权说明](ownership-and-async.md)。

后续才用到的泛型先理解成“把同一套操作用于确定的类型”，例如 `ObservableValue<number>`让监听参数也是number，不需要先掌握高级条件类型。工具锁定TS4.9.5，不为追新语法升级课程环境。
