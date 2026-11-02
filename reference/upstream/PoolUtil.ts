import { instantiate } from 'cc';
import { Global } from './Global';

export class PoolUtil {
	cache = {};
	loadSceneListen = false;
	itemToNode(parent /*node*/, items /*node/prefab array*/, index) {
		for (var i = 0; i < parent.children.length; i++) {
			parent.children[i].active = false;
		}
		var map = this.cache[parent.__instanceId];
		if (!map) {
			for (var i = 0; i < parent.children.length; i++) {
				parent.children[i].destroy();
			}
			map = {};
			this.cache[parent.__instanceId] = map;
		}
		var siblingIndex = map[index];
		if (typeof siblingIndex != 'undefined') {
			parent.children[siblingIndex].active = true;
		} else {
			var node = instantiate(items[index]);
			parent.addChild(node);
			map[index] = parent.children.length - 1;
		}
		parent.active = true;
	}

	create(parent /*node*/, item /*node/prefab*/, componentName, getItemArgs, scrollView1, bottomOriginOrTopOrigin: Boolean = false) {
		var ret = {
			pool: [],
			hideIndex: {},
			hideCount: 0,
			showIndex: [],
			parent: parent,
			item: item,
			componentName: componentName,

			showAll: function (dataCount) {
				this.hideAll();
				var addDataCount = dataCount - scrollView1.itemCount;
				if (addDataCount > 0 && bottomOriginOrTopOrigin) {
					if (scrollView1.vertical) {
						var emptyHeight = scrollView1._getHowMuchOutOfBoundary().y;
						if (emptyHeight > 0) {
							//向下拉动
							var addViewCount = parseInt((emptyHeight / scrollView1.childHeight).toString());
							scrollView1.offsetIndex = addDataCount - addViewCount;
						}
					} else if (scrollView1.horizontal) {
						var emptywidth = scrollView1._getHowMuchOutOfBoundary().x;
						if (emptywidth > 0) {
							//向下拉动
							var addViewCount = parseInt((emptywidth / scrollView1.childHeight).toString());
							scrollView1.offsetIndex = addDataCount - addViewCount;
						}
					}
				}
				scrollView1.itemCount = dataCount;
				if (!scrollView1.__inited) {
					if (bottomOriginOrTopOrigin) {
						//数据方向 时间 从老到新
						scrollView1.offsetIndex = scrollView1.itemCount - scrollView1.entityCount;
						if (scrollView1.offsetIndex < 0) {
							scrollView1.offsetIndex = 0;
						}
					} else {
						//数据方向 时间 从新到老
						scrollView1.offsetIndex = 0;
					}
				}
				var i = scrollView1.offsetIndex;

				for (var j = 0; i < dataCount && j < scrollView1.entityCount; i++, j++) {
					var ret = this.getOrGen();
					var args = getItemArgs(i);
					this.fillComponent(ret, args);
					var node = ret.node;
					node.setSiblingIndex(j);
					node.active = true;
				}

				if (!scrollView1.__inited) {
					if (bottomOriginOrTopOrigin) {
						if (scrollView1.vertical) {
							scrollView1.scrollToBottom();
						} else if (scrollView1.horizontal) {
							scrollView1.scrollToRight();
						}
					} else {
						if (scrollView1.vertical) {
							scrollView1.scrollToTop();
						} else if (scrollView1.horizontal) {
							scrollView1.scrollToLeft();
						}
					}
					scrollView1.__inited = true;
				}
			},

			wrapContentCallback: function (node, i) {
				console.log('ScrollView  555555555 = ', i);
				var args = getItemArgs(i);
				this.fillNode(node, args);
			},

			getOrGen: function () {
				var ret = null;
				if (this.hideCount == 0) {
					var node = instantiate(this.item);
					this.parent.addChild(node);
					var component = node.getComponent(this.componentName);
					component.__index = this.pool.length;
					this.showIndex.push(this.pool.length);
					this.pool.push(component);
					ret = component;
				} else {
					this.hideCount--;
					var index: any = -1;
					for (index in this.hideIndex) {
						break;
					}
					ret = this.pool[index];
					this.showIndex.push(index);
					delete this.hideIndex[index];
				}
				return ret;
			},

			show: function () {
				var ret = this.getOrGen();
				var args = [];
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}
				this.fillComponent(ret, args);
				ret.node.active = true;
				return ret;
			},

			fillNode: function (node, args) {
				var component = node.getComponent(this.componentName);
				this.fillComponent(component, args);
			},

			fillComponent: function (component, args) {
				console.log('fillComponent ', args);
				switch (args.length) {
					case 0:
						component.fill();
						break;
					case 1:
						component.fill(args[0]);
						break;
					case 2:
						component.fill(args[0], args[1]);
						break;
					case 3:
						component.fill(args[0], args[1], args[2]);
						break;
					case 4:
						component.fill(args[0], args[1], args[2], args[3]);
						break;
					case 5:
						component.fill(args[0], args[1], args[2], args[3], args[4]);
						break;
					default:
						component.fill(args);
						break;
				}
			},

			hideLast: function () {
				console.log('ScrollView hideLast');
				var index = this.showIndex.pop();
				this.hideIndex[index] = index;
				this.hideCount++;
				this.pool[index].node.active = false;
			},

			hideAll: function () {
				console.log('ScrollView hideAll');
				this.showIndex = [];
				this.hideIndex = {};
				var count = this.pool.length;
				this.hideCount = count;
				for (var i = 0; i < count; ++i) {
					this.hideIndex[i] = i;
					this.pool[i].node.active = false;
				}
			},

			hideOne: function (index) {
				console.log('ScrollView hideOne');
				if (typeof index == 'object') {
					index = index.__index;
				}
				if (this.hideIndex[index]) {
					return;
				}
				var showCount = this.showIndex.length;
				var i = 0;
				for (; i < showCount; i++) {
					if (this.showIndex[i] == index) {
						break;
					}
				}
				this.showIndex.splice(i, 1);
				this.hideIndex[index] = index;
				this.hideCount++;
				this.pool[index].node.active = false;
			},

			reset: function () {
				this.pool = [];
				this.showIndex = [];
				this.hideIndex = {};
				var count = this.parent.children.length;
				this.hideCount = count;
				for (var i = 0; i < count; i++) {
					var node = parent.children[i];
					var component = node.getComponent(this.componentName);
					if (component) {
						this.hideIndex[i] = i;
						this.pool.push(component);
						node.active = false;
					}
				}
			},
		};
		if (scrollView1) {
			scrollView1.itemCount = 0;
			scrollView1.wrapContentCallback = ret.wrapContentCallback.bind(ret);
		}
		return ret;
	}
}
//export let poolUtil: PoolUtil = new PoolUtil();
