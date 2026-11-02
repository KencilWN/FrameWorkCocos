# 环境、Git与两台电脑学习

## 首次克隆与运行

安装Creator **3.8.7**、Node.js **18+**。本学习工程仓库地址如下：

```sh
git clone https://github.com/KencilWN/FrameWorkCocos.git FrameWorkDemo
cd FrameWorkDemo
npm ci
npm run check:portable
npm test
```

然后在Creator Dashboard添加现有工程，选择根目录，等待导入。Creator生成本机 `temp/tsconfig.cocos.json` 和引擎声明后：

```sh
npm run typecheck
```

平时可运行 `npm run check` 执行三项。依赖只有锁定的开发工具TypeScript4.9.5；不是运行时npm框架，不安装 `cc` npm包。`cc`由Creator提供。引擎安装路径可以不同，Creator在每台电脑生成自己的配置。

未打开Creator时typecheck会明确失败并提示，不用工作项目声明、不把跳过检查当通过。`skipLibCheck`只跳过引擎.d.ts内部诊断，Demo与Framework源码仍检查。修改Creator版本前先单独分支验证，不顺手升级引擎或TS。

## 打开场景

| 场景 | 用途 |
| --- | --- |
| `assets/Scene/LearningMain.scene` | 最早双计数器、生命周期 |
| `assets/Scene/PrecticeMain.scene` | 独立奖励练习，保留实际拼写 |
| `assets/Scene/ShareCoinPanel.scene` | 共享状态/钱包练习 |
| `assets/Scene/InventoryMain.scene` | 当前主练习：ShopMain商店；旧背包面板关闭 |

新电脑不会自动同步预览环境的localStorage。默认30/空是新存档的正常状态。Git同步的是源码、场景、Prefab和资料，不是浏览器存档或编辑器运行时内存。切换预览方式也可能使用不同存储环境。

修改场景/Prefab应先停止预览，再保存资源。运行时拖位置通常不会落回场景。Inspector字段改名/类型变动后检查绑定；`@property`序列化与TS的public/private不是一回事。

## 第一次提交与之后的同步

2026-11-02整理时本地原本没有提交或remote；随后用户指定KencilWN/FrameWorkCocos并授权首次上传。以下保留首次初始化步骤供新工程参考；已克隆此仓库的家中电脑直接用后文pull/commit/push，不要再次初始化origin。

先打开Creator完成导入，运行检查并预览已有商店。然后：

```sh
git status --short
git add .
git diff --cached --stat
git commit -m "Prepare standalone framework learning project"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

远程仓库由你创建；如果已有origin或提交历史，先查看 `git remote -v`，不要重复添加或覆盖。来源和归属见根目录THIRD_PARTY_NOTICES，不自动把工作来源声明为MIT。

应该提交：`assets`及所有`.meta`、`settings`、`.creator`、docs、reference、scripts、tests、package/lock与tsconfig。`.meta`是资源身份的一部分，漏交可能导致另一台电脑丢脚本/Prefab引用。

不要提交：`library/temp/profiles/local/build/node_modules`、系统垃圾和本机.env。`.gitignore`已经配置；不要把cache或整个Creator安装目录拷入仓库。

## 每天两台电脑往返

开始前：

```sh
git status --short
git pull --ff-only
npm ci
```

若有本地未完成修改，先保存到自己的提交或暂存方案，再pull，不直接覆盖。`npm ci`主要在首次/lock变化时需要；普通源码变化无需反复安装。Creator打开并导入新资源。

结束前：停止预览、保存脚本和场景；记录当前任务/结果/卡点/AI帮助；检查diff，提交并push。家里开始前先pull。避免两台电脑同时修改同一场景；场景冲突要比较真实节点与引用，不能随便整文件覆盖。

开始新的试水项目时见[复用清单](../framework/reuse.md)，不要把本工程的Git身份和全部练习历史复制过去。

## CI与本地验证的区别

GitHub Actions仅运行可移植检查和Node替身测试，不安装Creator，也不谎报引擎类型检查。类型、资源绑定、实际加载/音频和Web构建在装有Creator的电脑验证。参见[课程验收](next-lessons.md)。
