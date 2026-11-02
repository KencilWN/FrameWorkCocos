const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const errors = [];
function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(file) : [file];
    });
}
function report(file, message) { errors.push(path.relative(root, file) + ': ' + message); }
const code = walk(path.join(root, 'assets')).filter(file => file.endsWith('.ts'));
for (const file of code) {
    const source = fs.readFileSync(file, 'utf8');
    if (/\/Users\/|[A-Za-z]:\\Users\\|\/home\//.test(source)) report(file, '包含机器绝对路径');
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function visit(node) {
        let specifier;
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) specifier = node.moduleSpecifier.text;
        if (specifier) {
            if (specifier !== 'cc' && specifier !== 'cc/env' && !specifier.startsWith('.')) report(file, '未声明的运行依赖 ' + specifier);
            if (specifier.startsWith('.')) {
                const target = path.resolve(path.dirname(file), specifier);
                const resolved = [target + '.ts', path.join(target, 'index.ts')].find(candidate => fs.existsSync(candidate));
                if (!resolved || !resolved.startsWith(path.join(root, 'assets') + path.sep)) report(file, '导入缺失或越界 ' + specifier);
                if (file.startsWith(path.join(root, 'assets/Framework') + path.sep) && resolved?.startsWith(path.join(root, 'assets/Demo') + path.sep)) report(file, '框架依赖Demo业务 ' + specifier);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(parsed);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'reference/manifest.json'), 'utf8'));
for (const entry of manifest.files) {
    const file = path.join(root, entry.snapshotPath);
    if (!fs.existsSync(file)) { report(file, '来源快照缺失'); continue; }
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (hash !== entry.sha256) report(file, '来源快照校验不一致，请勿直接修改原版');
}
const uuids = new Map();
const assets = walk(path.join(root, 'assets'));
for (const file of assets.filter(file => file.endsWith('.meta'))) {
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!meta.uuid) { report(file, '缺少uuid'); continue; }
    if (uuids.has(meta.uuid)) report(file, '重复uuid，另见 ' + path.relative(root, uuids.get(meta.uuid)));
    uuids.set(meta.uuid, file);
}
for (const file of assets.filter(file => /\.(ts|prefab|scene)$/.test(file))) {
    if (!fs.existsSync(file + '.meta')) report(file, '缺少.meta，不能保持跨机器资源身份');
}
const docs = [...walk(path.join(root, 'docs')).filter(file => file.endsWith('.md')), path.join(root, 'README.md'), path.join(root, 'reference/README.md')];
for (const file of docs) {
    const text = fs.readFileSync(file, 'utf8');
    const links = text.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g);
    for (const match of links) {
        const href = match[1];
        if (/^(https?:|mailto:|#)/.test(href)) continue;
        if (/^(\/|[A-Za-z]:|file:)/.test(href)) { report(file, '非可移植链接 ' + href); continue; }
        const target = path.resolve(path.dirname(file), decodeURIComponent(href.split('#')[0]));
        if (!fs.existsSync(target)) report(file, '本地链接缺失 ' + href);
    }
}
if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`可移植检查通过：${code.length}个运行脚本、${manifest.files.length}个来源快照、${uuids.size}个资产UUID及本地资料链接。`);
console.log('此检查不验证 Creator Inspector 绑定、引擎运行行为或学习者掌握程度。');
