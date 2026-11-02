const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Isolated source execution; no emitted files and no real Creator engine.
module.exports = function makeLoader(cc = {}) {
    const root = path.resolve(__dirname, '../..');
    const cache = new Map();
    function load(relative) {
        const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
        if (cache.has(file)) return cache.get(file).exports;
        const mod = { exports: {} };
        cache.set(file, mod);
        const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
            fileName: file,
        }).outputText;
        const requireLocal = name => {
            if (name === 'cc') return cc;
            if (!name.startsWith('.')) throw new Error('Unexpected test dependency: ' + name);
            return load(path.resolve(path.dirname(file), name + '.ts'));
        };
        const execute = vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename: file });
        execute(requireLocal, mod, mod.exports);
        return mod.exports;
    }
    return load;
};
