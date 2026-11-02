# 实验二十：删除存档与恢复默认

2026-10-19，D02，K2进行中。实验十九限定路径已通过。本轮暂估20～30分钟，由用户编写存储方法、Owner入口、面板按钮回调并在Creator绑定；聊天给出全部必要步骤，本文仅留档。

## 目标与区别

| 操作 | 内存余额 | 本地记录 |
| --- | --- | --- |
| 原清零按钮 | 改为0 | 保存数字0，记录存在 |
| 新恢复默认按钮 | 改为initCoins | 删除金币记录；下次启动采用默认值 |

删除记录本身不会自动修改现有Wallet或Label。恢复默认的完整行为由Owner协调：删除成功→重建默认Wallet→通知正在显示的面板。

## LocalStorage增加removeItem

在assets/Framework/storage/LocalStorage.ts中自己增加：

```ts
public removeItem(key: string): boolean
```

使用sys.localStorage.removeItem(key)，try正常结束返回true；catch记录失败并返回false。与setItem一样，boolean是本封装的处理结果，引擎方法没有返回这个boolean。指定键本来不存在时，正常调用仍视为成功。

参考原项目GLStorage.removeItem：先拼用户前缀，再调用sys.localStorage.removeItem，最后清内存Map缓存。本教学版没有账号前缀/缓存，只保留单键删除，增加已有风格的异常处理；这是教学改造，不是整个原类已迁入。

## Owner增加restoreDefaults

在WalletOwner中自己增加公开restoreDefaults(): boolean：

1. storage.removeItem(COINS_STORAGE_KEY)。失败则提示并返回false，保留当前余额，不发变化通知。
2. 删除成功后，用new Wallet(this.initCoins, this.maxCoinLimit)替换Owner内部的wallet。
3. 使用现有events和COINS_CHANGED发送新余额，返回true。

该方法不调用saveCoins，否则会立即重新生成刚删除的记录；也不新建EventDispatcher，已有的两个面板订阅继续使用。面板引用的是Owner，显式恢复时重建Owner内部Wallet仍能同步两边。

本轮可在删除成功后加验证日志：

```ts
console.log('[恢复默认] 删除后读取：', this.storage.getItem(COINS_STORAGE_KEY));
```

正常环境下应null。保留原resetCoins的清零并保存0语义，不把它替换为删除记录。

## 左面板新增恢复按钮

在ShareCoinPanel类中增加：

```ts
@property(Button)
restoreButton: Button | null = null;
```

只为左面板配置该按钮，右侧留空是本轮预期，因此它不加入onLoad必绑检查。onEnable通过可选引用绑定CLICK，onDisable配对off，target仍为this。

新private restoreDefaults(): void回调委托this.wallet.restoreDefaults()，失败时提示；不从面板直接操作storage，也不重复emit。照已有增加/清零按钮的结构自行完成。

Creator停止预览后，在左面板CoinCounterL下新增Button，文字“恢复默认”，可放局部位置(0, 200)，与现有Label(0, 100)和按钮区分。绑定到左ShareCoinPanel.restoreButton，Click Events留空。右面板restoreButton为空；购买与显隐按钮维持当前范围。

## 运行验证

临时把Owner.initCoins设7，保留maxCoinLimit=30。用原清零再增加两次，准备存档24。

| 操作 | 预期 |
| --- | --- |
| 点击恢复默认 | 左右立即7，删除后读取日志null |
| 停止再运行 | 仍7，来自缺失记录时的默认值 |
| 再增加一次12 | 两边19，产生新存档 |
| 停止再运行 | 两边19，说明后续操作仍能正常保存 |

最后停止预览，把initCoins改回0；保存运行后点击一次恢复默认，回到默认0且金币键不存在。它本轮未给右侧提供按钮，但右侧必须同步且仍能继续操作。

完成后报告以上结果和实际用时。助手检查三个脚本与场景引用。当前尚未实施或运行，不提前记为通过；删除失败、写入失败的异常模拟和数据结构另行安排。

## 实际完成：12分钟，本轮通过

用户报告“12分钟，添加验证完毕”，按本轮要求记录成功恢复默认、缺失记录重开、后续保存与右侧同步运行通过；助手未操作预览，证据为用户确认。

静态审阅与验证：

- LocalStorage.removeItem只删除指定key，异常返回false，正常返回true。
- Owner.restoreDefaults删除失败直接返回；成功替换内部Wallet，原events保持，发新余额且不调用saveCoins；日志读取删除后结果。initCoins已恢复0。
- 面板实际回调名restoreWallet，on/off同引用同target；右侧restoreButton为空，并未加入必绑检查。面板不直接读写storage或重复emit。
- 场景左CoinCounterL.restoreButton绑定自己的按钮，右侧留空，两侧Owner引用相同，所有Click Events为空。用户按钮位置(-10.893,-280.278)，位置建议不是硬性要求，无异常反馈。
- TypeScript检查通过。本轮无需修正，不额外要求重复运行已报告成功的路径。

求助程度为方法契约与少量新API提示，主体由用户实现。该12分钟针对已有模式的扩展，后续同类小扩展暂估15～20分钟；新主题另校准，不用此速度推算资源/异步。物理删写失败路径、对象数据和K2独立变式仍未完成。
