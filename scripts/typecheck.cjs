const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(root, 'temp/tsconfig.cocos.json'))) {
    console.error('缺少 Creator 生成的 temp/tsconfig.cocos.json。请先用 Cocos Creator 3.8.7 打开本工程并等待导入完成，再运行 npm run typecheck。');
    process.exit(1);
}
const compiler = require.resolve('typescript/bin/tsc');
const result = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.check.json', '--pretty', 'false'], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
