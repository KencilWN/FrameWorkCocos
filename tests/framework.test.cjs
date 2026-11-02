const test = require('node:test');
const assert = require('node:assert/strict');
const makeLoader = require('./helpers/load-ts.cjs');
const prefix = 'assets/Framework/';

test('scope cleans in reverse order, once, including actions added after disposal', () => {
    const { DisposableScope } = makeLoader()(prefix + 'lifecycle/DisposableScope.ts');
    const scope = new DisposableScope();
    const order = [];
    const early = scope.add(() => order.push('early'));
    early(); early();
    scope.add(() => order.push('a'));
    scope.add(() => order.push('b'));
    scope.dispose(); scope.dispose();
    scope.add(() => order.push('late'));
    assert.deepEqual(order, ['early', 'b', 'a', 'late']);
});

test('one cleanup exception does not leak later cleanup actions', () => {
    const { DisposableScope } = makeLoader()(prefix + 'lifecycle/DisposableScope.ts');
    const scope = new DisposableScope();
    let cleaned = false;
    scope.add(() => { cleaned = true; });
    scope.add(() => { throw new Error('expected cleanup error'); });
    const original = console.error;
    try { console.error = () => {}; scope.dispose(); }
    finally { console.error = original; }
    assert.equal(cleaned, true);
});

test('late A cannot replace B, and disabling invalidates an outstanding request', () => {
    const { LatestRequest } = makeLoader()(prefix + 'async/LatestRequest.ts');
    const gate = new LatestRequest();
    const a = gate.begin();
    const b = gate.begin();
    let display = '';
    if (gate.isCurrent(b)) display = 'B';
    if (gate.isCurrent(a)) display = 'A';
    assert.equal(display, 'B');
    gate.invalidate();
    assert.equal(gate.isCurrent(b), false);
});

test('observable replacement notifies, in-place mutation does not; unsubscribe is explicit', () => {
    const { ObservableValue } = makeLoader()(prefix + 'state/ObservableValue.ts');
    const state = new ObservableValue({ coins: 1 });
    const changes = [];
    const off = state.subscribe((value, previous) => changes.push([value.coins, previous.coins]));
    state.value.coins = 2;
    assert.equal(changes.length, 0);
    state.set({ coins: 3 });
    off(); off();
    state.set({ coins: 4 });
    assert.deepEqual(changes, [[3, 2]]);
});

test('serial queue keeps order after a rejected task', async () => {
    const { SerialTaskQueue } = makeLoader()(prefix + 'tasks/SerialTaskQueue.ts');
    const queue = new SerialTaskQueue();
    const order = [];
    const first = queue.enqueue(() => { order.push(1); throw new Error('first failed'); });
    const second = queue.enqueue(() => { order.push(2); return 'second'; });
    await assert.rejects(first, /first failed/);
    assert.equal(await second, 'second');
    assert.deepEqual(order, [1, 2]);
});

test('queue close rejects waiting work but lets an already running task finish', async () => {
    const { SerialTaskQueue } = makeLoader()(prefix + 'tasks/SerialTaskQueue.ts');
    const queue = new SerialTaskQueue();
    let finish;
    const first = queue.enqueue(() => new Promise(resolve => { finish = resolve; }));
    const second = queue.enqueue(() => assert.fail('waiting task must not start'));
    const rejected = assert.rejects(second, /closed/);
    await Promise.resolve();
    queue.close();
    finish('done');
    assert.equal(await first, 'done');
    await rejected;
    await assert.rejects(queue.enqueue(() => 1), /closed/);
});

function resourceFixture() {
    const callbacks = [];
    const load = makeLoader({ resources: { load: (_path, _type, callback) => callbacks.push(callback) } });
    const { ResourceScope } = load(prefix + 'resources/ResourceScope.ts');
    class FakeAsset {
        refs = 0;
        addRef() { ++this.refs; }
        decRef() { --this.refs; }
    }
    return { ResourceScope, FakeAsset, callbacks };
}

test('two scopes sharing an asset release only their own references', async () => {
    const { ResourceScope, FakeAsset, callbacks } = resourceFixture();
    const asset = new FakeAsset();
    const a = new ResourceScope(); const b = new ResourceScope();
    const first = a.load('same', FakeAsset); const second = b.load('same', FakeAsset);
    callbacks.shift()(null, asset); callbacks.shift()(null, asset);
    await Promise.all([first, second]);
    assert.equal(asset.refs, 2);
    a.dispose(); a.dispose();
    assert.equal(asset.refs, 1);
    b.dispose();
    assert.equal(asset.refs, 0);
});

test('a resource arriving after its owner closes is rejected with balanced refs', async () => {
    const { ResourceScope, FakeAsset, callbacks } = resourceFixture();
    const asset = new FakeAsset();
    const scope = new ResourceScope();
    const waiting = scope.load('late', FakeAsset);
    const rejected = assert.rejects(waiting, /disposed/);
    scope.dispose();
    callbacks.shift()(null, asset);
    await rejected;
    assert.equal(asset.refs, 0);
    await assert.rejects(scope.load('new', FakeAsset), /disposed/);
    assert.equal(callbacks.length, 0);
});

test('load failure rejects instead of leaving a pending Promise', async () => {
    const { ResourceScope, FakeAsset, callbacks } = resourceFixture();
    const scope = new ResourceScope();
    const waiting = scope.load('missing', FakeAsset);
    const rejected = assert.rejects(waiting, /missing/);
    callbacks.shift()(new Error('missing'));
    await rejected;
    scope.dispose();
});

function nodeFixture() {
    class FakeNode {
        static EventType = { NODE_DESTROYED: 'destroyed' };
        active = true;
        valid = true;
        children = [];
        handlers = new Map();
        once(name, callback) { this.handlers.set(name, callback); }
        addChild(node) { this.children.push(node); node.parent = this; }
        removeFromParent() {
            if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
            this.parent = null;
        }
        destroy() { this.valid = false; this.removeFromParent(); this.handlers.get('destroyed')?.(); }
    }
    const load = makeLoader({ Node: FakeNode, instantiate: () => new FakeNode(), isValid: node => node?.valid === true });
    return { FakeNode, load };
}

test('pool reuses an inactive node and rejects double returns/foreign nodes', () => {
    const { FakeNode, load } = nodeFixture();
    const { PrefabPool } = load(prefix + 'pool/PrefabPool.ts');
    const pool = new PrefabPool({}, 1);
    const first = pool.acquire();
    assert.equal(first.active, false);
    pool.release(first);
    assert.throws(() => pool.release(first), /not borrowed/);
    assert.throws(() => pool.release(new FakeNode()), /not borrowed/);
    assert.equal(pool.acquire(), first);
    pool.dispose();
    assert.equal(first.valid, false);
    assert.throws(() => pool.acquire(), /disposed/);
});

test('pool destroys excess idle nodes and borrowed nodes on disposal', () => {
    const { load } = nodeFixture();
    const { PrefabPool } = load(prefix + 'pool/PrefabPool.ts');
    const pool = new PrefabPool({}, 1);
    const a = pool.acquire(); const b = pool.acquire(); const c = pool.acquire();
    pool.release(a); pool.release(b);
    assert.equal(a.valid, true); assert.equal(b.valid, false);
    pool.dispose();
    assert.equal(a.valid, false); assert.equal(c.valid, false);
});

test('panel host closes only its own nodes and refuses to open after disposal', () => {
    const { FakeNode, load } = nodeFixture();
    const { PanelHost } = load(prefix + 'ui/PanelHost.ts');
    const root = new FakeNode(); const unrelated = new FakeNode(); root.addChild(unrelated);
    const host = new PanelHost(root);
    const panel = host.open({});
    host.close(unrelated);
    assert.equal(unrelated.valid, true);
    host.dispose(); host.dispose();
    assert.equal(panel.valid, false);
    assert.equal(unrelated.valid, true);
    assert.throws(() => host.open({}), /unavailable/);
});

test('scoped component cleans enable-scoped subscriptions on hide and lifetime on destroy', () => {
    const load = makeLoader({ Component: class {} });
    const { ScopedComponent } = load(prefix + 'components/ScopedComponent.ts');
    const component = new ScopedComponent();
    let active = 0; let lifetime = 0;
    component.onActivated = scope => { ++active; scope.add(() => { --active; }); };
    component.lifetime.add(() => { ++lifetime; });
    component.onEnable();
    const ticket = component.requests.begin();
    assert.equal(active, 1);
    component.onDisable();
    assert.equal(active, 0); assert.equal(component.requests.isCurrent(ticket), false);
    component.onEnable(); component.onDestroy();
    assert.equal(active, 0); assert.equal(lifetime, 1);
});

test('audio wrapper controls the provided source without destroying caller-owned clips', () => {
    const calls = [];
    const source = {
        valid: true,
        clip: null,
        stop() { calls.push('stop'); },
        play() { calls.push('play'); },
        playOneShot(clip, volume) { calls.push([clip, volume]); },
    };
    const load = makeLoader({ isValid: object => object?.valid === true });
    const { AudioPlayer } = load(prefix + 'audio/AudioPlayer.ts');
    const player = new AudioPlayer(source);
    const music = {}; const effect = {};
    player.playMusic(music);
    assert.equal(source.clip, music); assert.equal(source.loop, true);
    player.playEffect(effect, 0.5);
    player.setVolume(2); assert.equal(source.volume, 1);
    player.stop(); assert.equal(source.clip, null);
    assert.deepEqual(calls, ['stop', 'play', [effect, 0.5], 'stop']);
    assert.throws(() => player.setVolume(NaN), /finite/);
    source.valid = false;
    assert.throws(() => player.playMusic(music), /destroyed/);
});
