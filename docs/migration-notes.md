# 最小底座迁移记录

## 2026-11-02：改为可独立克隆的学习与复用工程

后续不再依赖本机工作目录。原版28文件从Spins提交 `8d1fec2a1b4715c802cf3328a7d12958b0387b8f`提取为仓库内只读快照，文件级哈希与宿主依赖见reference/manifest.json。新9个运行模块为教学适配/新增实现，API、用法、收益与代价见[框架手册](framework/README.md)，具体对应见[来源地图](framework/source-map.md)。

类型检查改用本工程package-lock锁定TS4.9.5；Creator声明由每台电脑打开本工程生成。基础资料改为仓库内相对链接，补充两台电脑同步、问题求解、未来练习和按需复用说明。本轮没有更改既有Demo/场景/Prefab/事件/存储代码，也未自动完成数量选择练习。

完整范围和验证见[本次整理](standalone-migration-2026-11-02.md)。下方绝对路径、旧检查命令与“待做”是历史来源事实，不是当前工程的依赖或恢复点。

## 2026-10-22：当前源码参考切换到Spins

后续读取 `/Users/mac/Documents/UGit/spins`（核对时分支dev/201，HEAD为1b822356）。10月20～21日产品提交的课程映射见[开发回顾](2026-10-22-spins-review.md)。原GameSlot来源、固定提交和教学改造记录保持历史事实。

核对：Spins下相同路径的EventDispatcher.ts、EventList.ts与Demo的两文件仍字节一致；Spins的GLStorage.ts SHA-256仍为9c3ddb36164c060fc3749e49d52fd7f29d94cb1209482714e85874f01253433f，与10月19日教学参考一致。本次换仓库不需要重新迁移这三个参考模块，未迁入产品SDK、网络或业务配置。

Spins当前UCellShopItem.prefab有未提交改动，保持原状。Demo只检查现有代码并更新教学文档，没有改写用户练习源码。

## 2026-10-16：第一课只迁事件基础

来源工程：`/Users/mac/Documents/UGit/gameslot`。

来源提交：`60a885a8b75e3fd8c31778a55c5281467346e0e2`。迁移前再次核对目标文件；当前 GameSlot 有其他 UI 的未提交改动，没有改动这些来源文件。

| 原路径（相对 GameSlot） | 新路径（相对 Demo） | 处理 |
| --- | --- | --- |
| assets/Scripts/Lib/FrameAsserts/event/EventDispatcher.ts | assets/Framework/events/EventDispatcher.ts | 原样复制 |
| assets/Scripts/Lib/FrameAsserts/event/EventList.ts | assets/Framework/events/EventList.ts | 原样复制 |

没有复制 `.meta`，由 Demo 的 Creator 生成新的资源标识。`CoinCounter.ts` 是新增教学示例，不是迁移来的业务代码。

字节验证：两个新文件均与来源工作区及上述提交的内容完全一致。

- EventDispatcher.ts SHA-256：`8c8a9ce79a89c0789907c7d3539ff4f32dac59beb84c5abc8a4968b96c0df49a`
- EventList.ts SHA-256：`d3c206bfb54e2dc45efb56b36cb39a01b88d97ebcc3359e636a84db4b0b045f8`

## 依赖与边界

- EventDispatcher 只导入 EventList。
- EventList 导入引擎的 Component/isValid，因此目前是 Cocos 内的事件组件，不是无引擎依赖的纯 TS 库。
- 第一课只用 on / emit / off；没有迁移 Global、fwk、EventProcessor、PrefabComponent 或业务事件枚举。
- CoinCounter 每个组件实例各有自己的 EventDispatcher；当前不是跨场景全局消息中心。
- Creator 本身有 EventTarget。迁移自研模块是为了学习当前项目的实现，并非每个新项目都必须另写事件系统。

## 原实现的已知限制

这些问题记录下来，第一课不靠改底层解决：

1. EventDispatcher.on 虽接收 once 参数，但没有把它传给 EventList.on。本课不使用 once，也不承诺一次性监听可用。
2. EventList 的注释写着“不激活不分发”，实际只检查 Component 的节点 isValid，没有检查 activeInHierarchy。关闭页面时仍要主动 off；注释不能作为行为证据。
3. emit 直接遍历可变数组；派发期间增删监听可能改变这一轮的遍历结果。回调异常也没有独立隔离。本课回调不增删监听、不主动抛异常。
4. 接口使用 Function/any，事件名和参数没有强类型约束。

以后需要扩展时，先写出期望，再用针对性实验验证：重复注册、撤销、派发中删除、异常、销毁、once。不会因这次复制就把它当作已完成的通用库。

## 2026-10-19：存储教学改造（读写工具通过，钱包接入验证中）

来源：assets/Scripts/Lib/Tools/GLStorage.ts，读取时GameSlot HEAD为ac3da1b1d20495dca5d034e1f6c60bd1ff979d88，该文件无工作区改动；SHA-256为9c3ddb36164c060fc3749e49d52fd7f29d94cb1209482714e85874f01253433f。

对照位置为GLStorage.getItem与setItem：使用sys.localStorage读写，JSON.parse/stringify转换数据。也已核对本机Creator3.8.7的cocos/core/platform/sys.ts：Web端等价于window.localStorage，初始化不可用时引擎可能安装只告警的替代方法，因此封装返回true只表示未检测到调用失败，不能代替重开验证。

任务目标为assets/Framework/storage/LocalStorage.ts，由学习者自行实现，是教学改造而非原样复制：

- getItem返回unknown，读取或JSON解析异常返回null，业务类型与数值由Owner校验。
- setItem返回boolean，捕获序列化/写入异常，不能生成JSON文本时失败；Owner仍同步内存与UI，并报告持久化失败。
- 先提供两个方法，不接入原类的账号前缀、Map缓存、全局项、逗号数组、批量清理和业务key枚举。
- 金币key位于WalletOwner，Wallet不依赖存储，面板继续只调用Owner。

学习者现已实现LocalStorage.ts，普通类仅导入cc.sys，包含getItem/setItem，符合上述教学改造边界。实际catch使用console.error；setItem失败分支提前返回false，正常流程在try/catch后返回true。它与原GLStorage不是字节一致迁移。

已验证：TypeScript检查通过；用户提供两次编辑器预览日志，独立测试键framework-demo.storage-check.v1第一次null、写入true、读回12(number)，停止/重开后首次读取即12。正常读写和该环境的跨重开通过；JSON损坏、存储异常、钱包初始校验与金币保存尚未验证。下一步由Owner接入正式金币key。

Owner现已接入正式key与saveCoins，成功增加/清零后保存再通知。类型检查通过，但正式金币0存档变式出现默认7，用户断点原始text为null，当前追踪写入与重开读取，未判定原因；另有> 0需改为>= 0的业务边界错误。此处只更新接入事实，不把正式金币恢复、坏数据和写入失败提前记为通过。

后续验证：>= 0修正后用户明确0存档变式正常；实验十九用户确认无效JSON、字符串12、999越界及清理后24恢复/拒绝后保持均符合预期。源码确认临时注入移除，基础金币读写与限定坏数据路径通过。原始text=null的历史成因未还原；物理存储读写异常仍未测试，不据catch存在推断该类异常已验证。

实验二十已布置removeItem教学适配，尚未实施：原GLStorage.removeItem会拼接用户前缀并同步清Map缓存；当前LocalStorage仅对调用者指定key执行sys.localStorage.removeItem，增加boolean/异常处理契约。Owner持有金币key并协调恢复默认，UI不直接删存档。没有原样复制或运行通过结论，待用户实现后记录。

实验二十后续：用户12分钟完成removeItem、Owner恢复协调、左侧可选按钮并报告验证完成。审阅单键删除、false失败分支、成功重建默认Wallet但不save、保留事件源正确，场景绑定与类型检查通过；该限定功能通过。该方法仍属教学适配，不是原GLStorage账号前缀/缓存已迁移；物理删除失败未运行。
