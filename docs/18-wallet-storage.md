# 实验十八：重开后还能读到余额

日期2026-10-19，实际学习日D02，K2进行中。实验十七共享钱包已通过；本轮加入本地存档。涉及JSON、unknown和读取校验，暂估35～50分钟，记录实际完成时间后再校准。

教学入口为聊天，本文仅留档与复习，用户不必先读本文。2026-10-19按新机制拆为两段：当前先在聊天讲完整LocalStorage读写，用户完成工具并用独立测试键做两次运行（暂估15～20分钟）；确认工具工作后再接Owner读档/存档。下面后续Owner与坏数据部分是整项路线，不要求本段一次完成。

### 当前第一段的运行验证

LocalStorage含getItem与setItem后，在WalletOwner导入该类，于现有空start中临时验证：

```ts
const storage = new LocalStorage();
const key = 'framework-demo.storage-check.v1';
console.log('运行开始时：', storage.getItem(key));
console.log('写入结果：', storage.setItem(key, 12));
const saved = storage.getItem(key);
console.log('读回：', saved, '类型：', typeof saved);
```

该测试键不存在时第一次运行应先null，写入true，读回12且类型number；相同预览环境停止/重开后，运行开始时应已是12。这个独立键只验证新工具，尚不接金币钱包，面板余额仍按现有逻辑。学生完成后报告两次日志和用时；通过后移除临时测试，进入下文Owner接入。不替用户创建源码或预填运行结论。

### 第一段实际结果与当前第二段

用户提供两次PreviewInEditor日志：第一轮开始null、写入true、读回12且类型number；第二轮开始已是12，随后同样正常。LocalStorage两个方法源码与TypeScript检查通过，实际用时未提供。setItem把return true放在try/catch后，失败路径均提前return false，控制流正确。

第一段正常读写及同编辑器预览环境跨重开通过。JSON错误、业务校验和写入失败尚未运行，不据此提前通过。当前进入Owner接入，暂估20～30分钟：移除start临时测试；Owner持有storage；独立金币key；首次创建时读取校验；成功修改后saveCoins再emit。完整步骤仍在聊天提供，文档不作为前置阅读。

### 第二段当前排查：默认7与原始读取null

Owner接入代码已提交，首次读档、成员存储工具、saveCoins与成功修改后保存再emit均已接通，临时start测试移除，TypeScript检查通过。当前校验条件写成saved > 0，应改saved >= 0，否则合法存档0会被当作无效值。

用户报告小变式显示7，进一步用断点确认LocalStorage.getItem中的原始text为null。该次执行尚未JSON.parse即返回null，因此实际流程为没有读到该键记录→saved为null→采用默认7。不能仅凭源码> 0就认定它造成了这一次现象，两者应分别排查。

已核对读写正式key均为framework-demo.wallet.coins.v1，两个面板共用Owner。接下来保持默认7：改>= 0后运行，点击清零，在setItem调用后临时打印key、写入text和sys.localStorage.getItem(key)的立即读回；在getItem取text后临时打印key和text。保存停止后再次以同一方式运行，提交写入与重开读取两条日志。尚未证实漏操作或环境清除，不预填原因与通过结论。

### 第二段后续反馈：0存档变式通过

用户先说“改好了”，进一步明确“我的意思是现在小变式正常了”。复核保存版saved >= 0、Owner的读取/保存/通知位置正确，TypeScript检查通过，故该项0存档覆盖默认7的重开变式通过。实际源码仍initCoins=7，收尾由用户恢复为0；不再要求补诊断日志或重复运行同一项。历史原始text=null的具体成因未得到日志还原，不把猜测记为根因。

其余正式金币24重开、上限拒绝后重开没有逐项单独反馈，后续整合时集中核对；JSON损坏、非法类型/越界和写入异常仍待验证，不提前将整个K2记为通过。

后续更新：实验十九用户对三组坏数据与清理后的正式24恢复/上限拒绝保持反馈“符合预期”，该轮限定路径现已通过；源码确认临时注入已清理、默认恢复0。完整证据与概念问答见19-invalid-wallet-storage.md；物理存储写入异常和K2其他主题仍未完成。

## 本轮结果与分工

在现有ShareCoinPanel.scene中，加到24，停止预览、重新运行，两边仍是24。清零并重新运行，两边仍是0。沿用同一预览方式和存储环境验证。

| 位置 | 负责的事情 |
| --- | --- |
| Wallet | 余额、增加上限、清零等业务规则 |
| LocalStorage | 按键读写JSON，不判断什么数额是合法金币 |
| WalletOwner | 第一次创建钱包时恢复，成功修改后保存，再通知界面 |
| ShareCoinPanel | 按钮输入与显示，继续调用Owner |

本轮由学习者新建assets/Framework/storage/LocalStorage.ts，并改WalletOwner.ts。沿用当前场景和按钮引用，无需新增面板或存档按钮。购买保持当前范围。

## 对照原项目的哪一部分

来源：GameSlot的assets/Scripts/Lib/Tools/GLStorage.ts，重点看getItem和setItem。原类还有账号前缀、Map缓存、数组逗号格式、全局项和批量清理。本轮参考其中JSON读写的核心机制，自己写两方法的教学版本，名称为LocalStorage。

这属于教学改造：不是原样复制GLStorage，不把未接入的功能记成已经迁移。原项目与引擎源码的定位、提交和差异记录见migration-notes.md。

## 先理解存的是什么

```ts
const text = JSON.stringify(12); // 文本内容是12，text的类型是string
const value = JSON.parse(text);  // 还原为数字12
```

localStorage按字符串键存取文本。JSON.stringify把数据变成JSON文本，JSON.parse把JSON文本还原成数据；它们不会保存或恢复一个Wallet组件/实例。恢复钱包时仍然需要new Wallet(读到的余额, 上限)。

`JSON.parse('12')`得到数字，但`JSON.parse('"12"')`得到字符串。能够解析，不等于符合游戏规则。

## 第一步：写最小存储工具

新建assets/Framework/storage/LocalStorage.ts，使用普通导出类，不继承Component。导入：

```ts
import { sys } from 'cc';
```

提供两个公开方法：

| 方法 | 契约 |
| --- | --- |
| getItem(key: string): unknown | 读取并解析；缺失、读取抛异常或JSON解析失败时返回null |
| setItem(key: string, data: unknown): boolean | stringify后写入；可写入的JSON文本写入调用正常结束则返回true；不能序列化或调用抛异常则返回false并记录警告 |

给出读取方法作为新API和try/catch的小示范；类结构与写入方法由你完成：

```ts
public getItem(key: string): unknown {
    try {
        const text = sys.localStorage.getItem(key);
        if (text === null) return null;
        return JSON.parse(text);
    } catch (error) {
        console.warn('[LocalStorage] 读取失败：', key, error);
        return null;
    }
}
```

- try块出现异常时，转入catch；这里把一次读档失败转成可识别的null，由调用者决定默认值。
- unknown表示暂时不知道读出的数据类型。下一步检查后才能把它当作数字传给Wallet，不能用`as number`替代检查。
- 写入使用`sys.localStorage.setItem(key, text)`，也是同步调用，无需await。
- JSON.stringify某些值会返回undefined，写入方法应先确认结果是字符串；循环引用等序列化异常也由catch处理。本轮正式调用只写数字余额。
- setItem的true表示调用按当前封装完成，并不是已经证明跨重启恢复；真正的存档效果要通过停止/重开验证。

## 第二步：让Owner第一次创建钱包时恢复

在WalletOwner中导入LocalStorage，持有一个存储工具实例。文件顶层定义唯一的业务键：

```ts
const COINS_STORAGE_KEY = 'framework-demo.wallet.coins.v1';
```

键是查找记录的名字；值是JSON文本。工具接收不同的key即可服务其他数据，这个金币业务键留在Owner中。

改getWallet：只有在`this.wallet == null`分支，读取存档，验证后确定初始余额，再new Wallet。平时getCoins/getWallet依然读取现有钱包，不每次重读存档。

本轮金币存档的规则：必须是0到maxCoinLimit之间的整数。可使用这个条件：

```ts
typeof saved === 'number'
    && Number.isInteger(saved)
    && saved >= 0
    && saved <= this.maxCoinLimit
```

`typeof`先确认类型，`&&`逐项判断；Number.isInteger检查整数，也会拒绝NaN和Infinity。条件通过用saved，否则用this.initCoins。恢复时可记录“使用存档/使用默认值”的日志，便于定位。

不要写`Number(saved)`强行转换，不用`saved || this.initCoins`选默认值：余额0是有效值，而||会把0当作需要替换的情况。

恢复放在现有的首次访问创建分支。不要把恢复移到面板onEnable，否则隐藏/显示会重新读档并干扰当前内存状态；也不要等Owner.start才恢复，面板可能已经显示过初始值。

## 第三步：成功修改后立即保存

给Owner增加一个私有saveCoins(): void辅助方法，自己完成：

1. 取得当前钱包余额。
2. 调用storage.setItem(COINS_STORAGE_KEY, 余额)。
3. 返回false时记录存档失败；本轮保留内存中的变化，让界面继续同步，不把存档失败冒充成“金币达到上限”。后续再单独练存储失败反馈与重试。

调整Owner的两个修改入口：

```text
tryAdd：Wallet.tryAdd → 成功才saveCoins → emit → 返回规则操作结果
resetCoins：Wallet.resetCoins → saveCoins → emit
```

resetCoins保存的是数字0。删除一条存档和把余额存为0含义不同，删除/恢复默认值的入口留到下一轮。不要在onDestroy才保存，也不要在onDestroy删档；现有events.offAll继续保留。

面板的增加、清零和恢复显示调用链继续沿用；本轮存档由Owner统一接入，避免两块面板各自读写。

## 第四步：运行这几条路径

先完成基本读写，然后验证读取边界。下列运行均保持相同预览方式、浏览器环境和地址来源；浏览器与编辑器预览可能使用不同存储区域，端口变化也可能换一个区域，不以不同环境互相读不到记录推断逻辑错误。

| 操作 | 预期 |
| --- | --- |
| 该键不存在时开始运行 | 两边使用initCoins，当前是0 |
| 增加两次到24，停止并重新运行 | 两边首次显示24，恢复日志来自创建钱包时 |
| 24时再加12被拒绝，停止并重新运行 | 仍24；失败不通知、不写入 |
| 清零，停止并重新运行 | 两边0，0是有效存档 |
| 有余额时隐藏左侧，从右侧修改，再恢复左侧 | 仍保持共享功能，恢复面板只同步当前内存余额 |

要确认“0被保留”而不是碰巧回到了默认0，可临时把Owner的initCoins改为7，已有存档为0时重开，应显示0；测试后改回initCoins=0。这是检查默认值选择的变式，不是增加新游戏规则。

下面在同一Web预览页面开发者控制台中操作，每次操作后刷新/重新运行该页面。localStorage对应这里的sys.localStorage；如果目前只用编辑器预览且没有相应控制台，先完成上面的主流程，报告预览方式后再安排这组，不要求先研究其他工具。

```js
// 删除本练习的单个键，重开后验证缺失记录使用默认值。
localStorage.removeItem('framework-demo.wallet.coins.v1');
```

```js
// 无效JSON：应被读取方法catch，使用默认值。
localStorage.setItem('framework-demo.wallet.coins.v1', 'broken');
```

```js
// JSON合法但业务数据非法：应由Owner拒绝，使用默认值。
localStorage.setItem('framework-demo.wallet.coins.v1', '999');
```

```js
// JSON合法，得到的是字符串12：不能当数字余额使用。
localStorage.setItem('framework-demo.wallet.coins.v1', JSON.stringify('12'));
```

这些单键操作是给当前练习造数据，不调用localStorage.clear()清除其他项目记录。最后恢复正常余额并保存。修改localStorage不会自动修改已经创建的Wallet；刷新或重开才会执行首次读档。

完成后报告实际用时、预览方式、已运行的步骤和不符预期的日志。边界组若暂未运行就保持待验证；助手检查LocalStorage和WalletOwner，未实现与运行的内容不提前通过。容量不足、平台禁用存储、跨账号、对象存档与存档版本迁移仍属后续范围。
