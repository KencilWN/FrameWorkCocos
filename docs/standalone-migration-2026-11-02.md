# 2026-11-02：独立学习工程整理记录

## 目标与交付范围

让本文件夹成为可提交GitHub、在家中继续学习、按需向其他试水项目复用的独立工程。学习目标继续是常见TS实现、需求分析与反例推导、框架机制及设计取舍；不只是堆一份看不懂的源代码。

本轮新增：

- 仓库内固定版本的原框架阅读包28文件，逐文件SHA-256和缺失宿主依赖说明；不在Creator运行。
- 9个独立教学运行模块：DisposableScope、LatestRequest、ScopedComponent、ResourceScope、ObservableValue、PanelHost、PrefabPool、SerialTaskQueue、AudioPlayer。每个模块的来源关系、接口、例子、收益与不足已归档。
- 自包含TS/Creator/问题求解/所有权资料，替换当前学习计划对工作项目OKF的链接；保留旧课程和原始历史来源事实。
- 本仓库自己的TypeScript4.9.5依赖/lock、可移植检查、Node隔离测试、类型检查入口及GitHub CI。
- 两台电脑安装/同步、首次提交、后续实操与按需复用指南；AGENTS记录以后继续教学的协作边界。

旧Demo、四个Scene、商品Prefab、原事件和LocalStorage不在本轮业务修改范围。数量切换仍由学习者完成。没有创建远程仓库、commit或push。

## 来源与可移植边界

原版包来自Spins提交 `8d1fec2a1b4715c802cf3328a7d12958b0387b8f`，提取提交内容而非未提交文件。来源清单在reference/manifest.json。新模块是职责层面的教学适配/新增代码，不宣称兼容原版，也不借Global/fwk假宿主运行。

运行导入只允许本仓库相对路径和cc。Creator引擎不入库；家中安装同版本并打开本工程生成声明。新电脑不继承浏览器存档。原来借用工作项目TypeScript的方式废止。

原事件once/派发中修改监听等已知问题不偷偷修复，原学习证据和后续可复现行为保留；新项目选用时见框架手册。Wallet等Demo模型也没有被自动包装成生产通用资产系统。

## 验证记录

2026-11-02本轮验证：

| 检查 | 结果与边界 |
| --- | --- |
| 本工程 `npm run check` | 通过：可移植检查、14项Node隔离测试、TS4.9.5类型检查；引擎声明来自本工程已有Creator导入 |
| 可移植性 | 25个运行脚本的导入/依赖方向、28个原版SHA-256、49个资产UUID及资料本地链接通过 |
| 旧资产保留 | 整理前保存的46个Demo/场景/Prefab/旧事件存储文件哈希全部一致；未写回工作仓库 |
| 干净副本 | 按Git可提交文件建立183文件副本，不含temp/library/node_modules；`npm ci --ignore-scripts`成功，portable与14项测试均通过 |
| 缺引擎声明的首次环境 | 干净副本typecheck明确退出1并提示先打开Creator生成temp；没有借用其他项目声明，也没有把未检查当通过 |
| Git准备 | 原仓库仍无提交/remote；新增文件可见，缓存/系统垃圾/node_modules已忽略；没有commit/push |

源码入库不代表学习者独立掌握或Creator手动验收。检查脚本与README明确区分了可移植性、Node替身逻辑、引擎声明类型、Creator运行和目标构建。

待实际Creator验证：新增组件显示/生命周期、异步资源路径和真实释放、池的状态重置、音频播放、Web构建。当前业务预览沿用此前用户已确认的限定范围，没有冒充本轮重新操作预览。

## 接下来怎么用

提交入口是根README。家中克隆后按环境指南npm ci并打开Creator；从progress最上方恢复，不重做第一课。继续实验32数量选择，再按next-lessons推进异步、资源、组件、状态和第二项目复用。每个阶段按实际完成和帮助程度记录，不用本轮新增文件数代替能力进度。
