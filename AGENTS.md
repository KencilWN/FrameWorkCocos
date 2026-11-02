# FrameWorkDemo 协作约定

这是独立的 Cocos Creator 3.8.7 学习与复用工程。所有必需代码、资料与工具必须在本仓库；不依赖 GameSlot/Spins 的本机路径、node_modules、全局变量或资源。历史来源名称不代表运行依赖。

## 学习方式

- 用户练习业务代码/场景/Inspector 绑定，助手先讲需求、设计依据、替代与成本，再审阅。除非用户明确要求实现，不代写正在进行的练习。
- 训练问题求解：目标 → 成功/失败后置状态 → 反例 → 执行顺序 → 实现 → 验证。先让用户尝试，卡住时给局部提示，不一次给完全部答案。
- 聊天提供当轮完整必需内容；Markdown是异地恢复与复习资料，不强制先读全文。
- 不因实现快、AI代码可运行或静态检查通过就认定独立掌握。记录帮助程度、真实用时和验证边界。
- `docs/progress.md` 是当前恢复点；旧课和旧日志保留历史。不要把日历间隔当作已学习天数。

## 目录责任

- `assets/Demo`、现有场景/Prefab：学习者业务与练习，保留未完成任务。
- `assets/Framework`：明确依赖和所有权的运行模块。原样迁移、教学适配、新增实现必须区分。
- `reference/upstream`：原框架只读源码快照，不加入编译或运行；缺失的生产宿主依赖见manifest，不用假Global/fwk垫平。
- `docs/guide`：自包含概念与工程操作；`docs/framework`：模块用法、取舍和原版对照。

## 检查

`npm ci` 后运行 `npm run check:portable`、`npm test`。Creator打开本工程生成temp声明后运行 `npm run typecheck`。不能用工作工程的TypeScript或引擎声明替代本项目环境。

修改框架后做相关失败/生命周期测试；已有检查通过后不反复全量重测。Node中的引擎替身测试不能代替Creator预览、音频、资源释放和Web构建。不要未经请求commit/push。
