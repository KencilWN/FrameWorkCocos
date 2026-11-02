# 实验二十三：背包恢复前先验证完整数据

2026-10-22，实际学习日D03，K2进行中。暂估30～45分钟。用户写业务方法，助手讲新机制并审阅；本文是聊天的留档，不是必读前置。

## 目标与边界

在assets/Demo/Inventory.ts增加：

```ts
public tryRestore(data: unknown): boolean
```

本方法用输入数据整体替换背包，不是在原背包上追加。输入为数组；每条为非null对象，itemId为非空string，count为正整数number。同ID沿用tryAdd规则合并。空数组合法，表示恢复空背包。任意一条不合法返回false，旧背包完全不变；合法返回true，输入对象后续修改不能改动背包。

本轮只做纯模型与现有InventoryPractice测试，不接存储、不新建场景或绑定。下一轮把LocalStorage读出的unknown交给它。

## 新机制

interface与as都不做运行时验证。unknown要求在使用前检查；Array.isArray(data)检查数组。遍历得到raw后，先拒绝null和非object，再访问字段：

```ts
if (typeof raw !== 'object' || raw === null) {
    return false;
}
const row = raw as { itemId?: unknown; count?: unknown };
if (typeof row.itemId !== 'string' || typeof row.count !== 'number') {
    return false;
}
```

typeof null也是'object'，所以null需单独拒绝。`?:`表示字段可能不存在，缺失时读到undefined；字段仍为unknown，必须检查。as只给编译器一个读取形状，不等于证明字段正确，也不转换值。通过两个typeof后，当前分支可把字段传给tryAdd。

## 实现顺序

1. Array.isArray失败直接false。
2. 创建临时candidate = new Inventory()。
3. 遍历输入，每条按上面机制检查对象和字段类型。
4. 调用candidate.tryAdd(row.itemId,row.count)，失败直接false。空ID、正整数等规则复用现有方法，同ID自然合并。
5. 全部遍历完成后，才令this.items = candidate.getItems()，返回true。

失败时临时背包可丢弃，原this.items从未修改。因此即使第一条合法、第二条非法，也不会留下一半恢复结果。不要先清空this.items，再逐条向当前背包tryAdd。

## 运行验收

在现有D2/InventoryPractice.start末尾创建独立restoreBag，先加ticket9，与旧练习变量bag分开。按下表顺序调用tryRestore，每次打印返回值与getItems：

| 输入 | 返回 | 调用后真实背包 |
| --- | --- | --- |
| null | false | ticket9 |
| [{itemId:'potion',count:2},{itemId:'potion',count:3},{itemId:'gem',count:1}] | true | potion5、gem1；ticket消失 |
| [{itemId:'potion',count:20},{itemId:'gem',count:-1}] | false | 仍potion5、gem1 |
| [{itemId:'gem',count:'3'}] | false | 仍potion5、gem1 |
| [null] | false | 仍potion5、gem1 |
| [] | true | 空背包 |

再用一个变量source = [{itemId:'potion',count:4}]恢复成功，之后source[0].count = 999，真实potion应仍4，验证没有保存输入记录引用。

Creator预览挂着InventoryPractice的ShareCoinPanel.scene。既有旧日志可保留，本轮新日志加“恢复”前缀即可区分。完成后报告实际用时和结果，源码审阅与类型检查另做；不因给出上述契约或示范就记为完成。

## 首版审阅与解释（2026-10-22，未通过）

用户说已写好，但不理解第1、2步目的；先询问unknown/any及as InventoryItem的区别，现用实际代码解释数组入口检查与临时背包保留旧数据的职责。未收到用时或运行结果，不认定已独立掌握。

实际方法名truRestore，建议修正为约定的tryRestore。Array.isArray、candidate、tryAdd失败提前返回、循环结束后才赋值的方向正确。循环体却再次声明const raw = data as ...，合法地遮住了for...of的raw，同时把整个数组当作单条记录；普通合法数组会因数组本身没有itemId/count而失败。应先检查迭代得到的raw是非null对象，再使用const row = raw as ...，后续类型检查与tryAdd读取row字段。

当前源码类型检查通过；此处是逻辑错误，未误报重复声明的编译错误。InventoryPractice只创建restoreBag并加入ticket9，尚无恢复调用。助手不修改练习源码，待用户修正后定向核对并运行原约定路径。

## 修正版：模型实现验证通过，用户运行反馈待补

用户已改为for...of得到rawItem，先检查非null对象，再断言为字段unknown的raw形状，检查字段类型并向candidate.tryAdd。rawItem/raw的命名合法，不要求机械改成raw/row。遍历完成后才替换原items，失败时原状态不变。

TypeScript检查通过。助手用transpileModule转译当前实际Inventory.ts，在Node隔离上下文执行，不创建测试文件或修改练习代码：非数组拒绝保留ticket9、合法替换并合并potion5/gem1、后条负数失败无部分提交、字符串数量拒绝、null记录拒绝、空数组成功清空、输入potion4恢复成功、修改输入为999后真实仍4，共8项检查通过。仅证明本轮纯模型契约，不代替用户Creator预览与独立理解。

方法仍拼作truRestore，建议统一为tryRestore；调用测试前保持方法名一致。InventoryPractice暂无恢复调用，后续让用户观察两组核心数据：正常药水2+3/宝石1→true且5/1，之后药水20/宝石-1→false且保持5/1；其余边界助手已验证，本轮不要求再重复整套。未收到实际用时或用户运行结果，未记K2整体通过；背包持久化仍待下一段。

## 用户预览完成：本轮通过

用户提供PreviewInEditor日志：ticket9→合法恢复true，实际记录potion5/gem1；第二组先打印新增potion20，随后负数数量被tryAdd拒绝，恢复返回false，实际记录仍为potion5/gem1。新增20来自candidate的既有tryAdd日志，不是写入原背包，不当作错误。实际源码方法名/两次调用已统一tryRestore，仅警告文字仍为truRestore，无功能影响，不阻断验收。

助手再次检查修正命名与调用后的类型，通过。本轮限定恢复契约通过，未收到实际用时；有问题解释和定向修正提示，不据此认定所有unknown/类型窄化已独立熟练。下一步实验二十四接入背包存档，K2仍未整体通过。
