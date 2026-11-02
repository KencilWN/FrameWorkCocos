import { sys } from 'cc';
export enum GLStorageKey {
	LastLoginType = 'last_login_type',//上次登录类型
	DailyGameTimeSeconds = 'daily_game_time_seconds', //当日总时长
	SingleGameTimeSeconds = 'single_game_time_seconds',//单次游戏时长
	LastLoginyearmonthday = 'last_login_yearmonthday',//上次登录年月日

	SingleRecharge = 'single_recharge_amount',//单次充值累计
	TotalRecharge = 'total_recharge_amount',//总充值累计
	DailyWithdrawal = 'daily_withdrawal_amount',//每日提现累计
	TotalWithdrawal = 'total_withdrawal_amount',//总提现累计

	UiDayCount = 'uiDayCount' //当日UI打开次数
}

/**
 * 该类是localstorage工具封装;
 * 现在近支持默认的存储方式;
 * todo:扩展到其他的存储方式;
 */
export class GLStorage {
	bUseDefault = true; //是否使用默认存储方式
	_cache: Map<string, any> = new Map(); // 内存缓存，key为完整存储键，value为解析后的值
	_currentPrefix: string = ''; // 当前用户前缀，用于检测用户切换
	_userId: string = '';
	_uid:string = '';

	init() {
		this.bUseDefault = true;
		this._cache.clear();
		this.clearKey();
		this._currentPrefix = this.getPrefix();
	}
	setUseDefault(use) {
		this.bUseDefault = use;
	}
	getUseDefault(use) {
		return this.bUseDefault;
	}

	getLocalStorageKey(key: string) {
		return this.getPrefix() + '_' + key;
	}
	setUserId(userid:string){
		this._userId = userid;
	}
	setUid(uid:string){
		this._uid = uid;
	}
	clearKey(){
		this._userId = '0';
		this._uid = '';
	}
	
	getPrefix() {
		let prefix = this._userId;
		let _uId = this._uid;
		if (_uId) {
			prefix += '_' + _uId;
		}
		// 检测用户切换，如果前缀变化则清除缓存
		if (this._currentPrefix && this._currentPrefix !== prefix) {
			this._cache.clear();
		}
		this._currentPrefix = prefix;
		return prefix;
	}
	/** 不带用户前缀的读取，用于 app 级数据 */
	getGlobalItem(key: string) {
		if (this._cache.has(key)) {
			return this._cache.get(key);
		}
		var info = sys.localStorage.getItem(key);
		if (info) {
			try {
				info = JSON.parse(info);
			} catch (e) {
				console.error('Failed to parse localStorage item:', key, e);
				info = null;
			}
		}
		this._cache.set(key, info);
		return info;
	}
	/** 不带用户前缀的写入，用于 app 级数据 */
	setGlobalItem(key: string, data: any) {
		sys.localStorage.setItem(key, JSON.stringify(data));
		this._cache.set(key, data);
	}
	/**
	 * get;
	 */
	getItem(key: string) {
		if (this.bUseDefault) {
			var _key = this.getPrefix() + '_' + key;
			
			// 先检查缓存
			if (this._cache.has(_key)) {
				return this._cache.get(_key);
			}
			
			// 缓存未命中，从本地存储读取
			var info = sys.localStorage.getItem(_key);
			if (info) {
				try {
					info = JSON.parse(info);
				} catch (e) {
					console.error('Failed to parse localStorage item:', _key, e);
					info = null;
				}
			}
			
			// 存入缓存（包括 null 值，避免重复读取）
			this._cache.set(_key, info);
			return info;
		} else {
		}
	}
	/**
	 * set;
	 */
	setItem(key: string, data: any) {
		if (this.bUseDefault) {
			var _key = this.getPrefix() + '_' + key;
			sys.localStorage.setItem(_key, JSON.stringify(data));
			// 更新缓存
			this._cache.set(_key, data);
		} else {
		}
	}
	/**
	 * remove;
	 */
	removeItem(key) {
		if (this.bUseDefault) {
			var _key = this.getPrefix() + '_' + key;
			sys.localStorage.removeItem(_key);
			// 清除缓存
			this._cache.delete(_key);
		} else {
		}
	}
	/**
	 * 获取数组存储对象
	 */
	getArrItem(key) {
		if (this.bUseDefault) {
			var _key = this.getPrefix() + '_' + key;
			
			// 先检查缓存
			if (this._cache.has(_key)) {
				var cached = this._cache.get(_key);
				if (Array.isArray(cached)) {
					return cached;
				}
			}
			
			// 缓存未命中，从本地存储读取
			var dataArr = [];
			var datastr = sys.localStorage.getItem(_key);
			if (datastr != null && datastr != undefined) {
				dataArr = datastr.split(',');
			}
			console.log('getArrItem dataArr:' + JSON.stringify(dataArr));
			
			// 存入缓存
			this._cache.set(_key, dataArr);
			return dataArr;
		} else {
		}
	}
	/**
	 * 存储数组到本地
	 */
	setArrItem(key, data) {
		if (this.bUseDefault) {
			var datastr = '';
			if (data.length > 0) {
				datastr = data[0];
				for (var i = 1; i < data.length; i++) {
					datastr = datastr + ',' + data[i];
				}
			} else {
				datastr = data;
			}
			var _key = this.getPrefix() + '_' + key;
			sys.localStorage.setItem(_key, datastr);
			// 更新缓存（存储解析后的数组）
			var dataArr = [];
			if (datastr) {
				dataArr = datastr.split(',');
			}
			this._cache.set(_key, dataArr);
		} else {
		}
	}

	/**
	 * 清除缓存
	 * @param keys 不需要清除的缓存,不传入默认全部清除
	 */
	clearItems(keys?: Array<string>) {
		if (!keys || keys.length <= 0) {
			sys.localStorage.clear();
			// 清除所有缓存
			this._cache.clear();
			return;
		}

		let retainMap: Map<string, string> = new Map();
		let retainKeys: Set<string> = new Set(); // 保存需要保留的键集合
		let prefix = this.getPrefix();
		keys.forEach((key) => {
			// 注意：这里传入的key可能是完整key或相对key，需要处理两种情况
			let fullKey = key.indexOf(prefix) === 0 ? key : prefix + '_' + key;
			let value = sys.localStorage.getItem(fullKey);
			retainMap.set(fullKey, value);
			retainKeys.add(fullKey); // 保存需要保留的键
		});
		sys.localStorage.clear();

		retainMap.forEach((value, key) => {
			sys.localStorage.setItem(key, value);
		});
		retainMap.clear();
		
		// 清除缓存中不在保留列表的项
		this._cache.forEach((value, cachedKey) => {
			if (!retainKeys.has(cachedKey)) {
				this._cache.delete(cachedKey);
			}
		});
	}
	
	/**
	 * 清除内存缓存（不删除本地存储）
	 * 用于内存清理或强制刷新缓存
	 */
	clearCache() {
		this._cache.clear();
	}
}
//export let glCusStorage: GLCusStorage = new GLCusStorage();
