import { sys } from 'cc';
import { Resource } from "./Resource";
export interface IAudioSource {
    play: () => void,
    pause: () => void,
    stop: () => void,
    destroy: () => void,
    ///////////播放事件/////////////
    onEnded(endFun: Function),
    onPlay(playFun: Function)
    onStop(overFun: Function)
    onError(overFun: Function)
    offEnded(endFun?: Function)
    offPlay(endFun?: Function)
    offStop(endFun?: Function)
    offError(endFun?: Function)
    ///////////////////////////////////////////////////
    /**@description 音效资源地址*/
    src: string
    /**@description 播放对象*/
    clip: any,
    /**@description 是否循环 */
    loop: boolean,
    /**@description 播放音量*/
    volume: number,
    /**@description 播放中*/
    playing: boolean
    /**@description 播放ID*/
    id: number
}

export class AudioInfo {
    resCache: Resource.Audio = null
    source: IAudioSource = null;
    isPause = false;
    loop: boolean;

    play(overBack?: () => void): void {
        this.isPause = false;
        if (this.source) {
            this.source.play();
        }
    }

    pause(): void {
        this.isPause = false;
        if (this.source) {
            if (this.source.playing) {
                console.debug(this.resCache.cache.url, "isPlaying to pause");
                this.isPause = true;
                this.source.pause();
            }
        }
    }

    stop(): void {
        this.isPause = false;
        if (this.source) {
            this.source.stop();
        }
    }

    resume() {
        if (this.source && this.isPause) {
            console.debug(this.resCache.cache.url, "resume play")
            this.source.play();
        }
        this.isPause = false;
    }

    set volume(val: number) {
        if (this.source) {
            this.source.volume = val;
        }
    }
    get volume(): number {
        if (this.source) {
            return this.source.volume;
        }
        return 0;
    }

    /**@description 销毁节点*/
    destroy() {
        //先销毁组件
        if (this.source && this.source.destroy) {
            this.source.destroy()
        }
        //再销毁节点
        this.resCache?.node.destroy()
    }
}

/**@description 框架内部使用，外部请不要调用 */
export class CacheAudioMgr {
    private static _instance:CacheAudioMgr = null
    static get ins(){
        if(!CacheAudioMgr._instance){
            CacheAudioMgr._instance = new CacheAudioMgr()
        }
        return CacheAudioMgr._instance
    }

    public musicVolume = 1;
    public effectVolume = 1;
    public voiceVolume = 1;
    public isEffectOn = true;
    public isMusicOn = true;
    public isVoiceOn = true;
    /**@description 保存缓存播放的音乐 */
    public cacheMusicInfos: Map<string, AudioInfo[]> = new Map();
    /**@description 保存缓存播放的音效 */
    public cacheEffectInfos: Map<string, AudioInfo[]> = new Map();
    /**@description 保存缓存人生的音效 */
    public cacheVoiceInfos: Map<string, AudioInfo[]> = new Map();

    /**@description 保存播放的音乐 */
    public onMusicInfos: Map<string, AudioInfo[]> = new Map();
    /**@description 保存播放的音效 */
    public onEffectInfos: Map<string, AudioInfo[]> = new Map();
    /**@description 保存播放的音效 */
    public onVoiceInfos: Map<string, AudioInfo[]> = new Map();

    /**@description 当前正在播放的音效 */
    public curMusic: AudioInfo | null = null;

    private readonly _storeMusicKey: string = "default_save_music";
    private readonly _storeEffectKey: string = "default_save_effect";
    private readonly _storeVoiceKey: string = "default_save_voice";
    private readonly _storeMusicVolumeKey: string = "default_save_music_volume_key";
    private readonly _storeEffectVolumeKey: string = "default_save_effect_volume_key";
    private readonly _storeVoiceVolumeKey: string = "default_save_voice_volume_key";

    init() {
        //音量开关读取（Creator 2.4 localStorage 仅单参数）
        this.isMusicOn = this._readBoolStorage(this._storeMusicKey, true);
        this.isEffectOn = this._readBoolStorage(this._storeEffectKey, true);
        this.isVoiceOn = this._readBoolStorage(this._storeVoiceKey, true);

        //音量读取
        this.musicVolume = this._readNumberStorage(this._storeMusicVolumeKey, 1);
        this.effectVolume = this._readNumberStorage(this._storeEffectVolumeKey, 1);
        this.voiceVolume = this._readNumberStorage(this._storeVoiceVolumeKey, 1);
    }

    private _readBoolStorage(key: string, defaultVal: boolean): boolean {
        const val = sys.localStorage.getItem(key);
        if (val == null || val === '') return defaultVal;
        return val === 'true' || val === '1' || val === true;
    }

    private _readNumberStorage(key: string, defaultVal: number): number {
        const val = sys.localStorage.getItem(key);
        if (val == null || val === '') return defaultVal;
        const num = parseFloat(val as string);
        return isNaN(num) ? defaultVal : num;
    }

    clearCacheAudio() {
        this.cacheMusicInfos.forEach((infos: AudioInfo[], key, map) => {
            if (infos.length > 0)
                infos[0].resCache.cache.delRef("cacheToCacheMusic")
            infos.forEach((ele) => {
                ele.destroy()
            })
        })
        this.cacheMusicInfos = new Map()
        this.cacheEffectInfos.forEach((infos: AudioInfo[], key, map) => {
            if (infos.length > 0)
                infos[0].resCache.cache.delRef("cacheToCacheEffect")
            infos.forEach((ele) => {
                ele.destroy()
            })
        })
        this.cacheEffectInfos = new Map()
        this.cacheVoiceInfos.forEach((infos: AudioInfo[], key, map) => {
            if (infos.length > 0)
                infos[0].resCache.cache.delRef("cacheToCacheVoice")
            infos.forEach((ele) => {
                ele.destroy()
            })
        })
        this.cacheVoiceInfos = new Map()
    }

    /**@description 缓存中取出*/
    popCacheMusic(url: string, bundle: string): AudioInfo | null {
        let key = this.makeKey(url, bundle);
        let infos = this.cacheMusicInfos.get(key);
        let target = null
        if (infos && infos.length > 0) {
            target = infos.pop();
            if (infos.length == 0)
                target.resCache.cache.delRef("cacheToCacheMusic")
        }
        return target
    }
    /**@description 缓存中取出*/
    popCacheEffect(url: string, bundle: string): AudioInfo | null {
        let key = this.makeKey(url, bundle);
        let infos = this.cacheEffectInfos.get(key);
        let target = null
        if (infos && infos.length > 0) {
            target = infos.pop();
            if (infos.length == 0)
                target.resCache.cache.delRef("cacheToCacheEffect")
        }
        return target
    }
    /**@description 缓存中取出*/
    popCacheVoice(url: string, bundle: string): AudioInfo | null {
        let key = this.makeKey(url, bundle);
        let infos = this.cacheVoiceInfos.get(key);
        let target = null
        if (infos && infos.length > 0) {
            target = infos.pop();
            if (infos.length == 0)
                target.resCache.cache.delRef("cacheToCacheVoice")
        }
        return target
    }
    cacheOnMusic(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let oninfos = this.onMusicInfos.get(key);
        if (!oninfos) {
            oninfos = []
            this.onMusicInfos.set(key, oninfos)
        }
        oninfos.push(info)
    }
    cacheOnEffect(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let oninfos = this.onEffectInfos.get(key);
        if (!oninfos) {
            oninfos = []
            this.onEffectInfos.set(key, oninfos)
        }
        oninfos.push(info)
    }
    cacheOnVoice(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let oninfos = this.onVoiceInfos.get(key);
        if (!oninfos) {
            oninfos = []
            this.onVoiceInfos.set(key, oninfos)
        }
        oninfos.push(info)
    }

    cacheToCacheMusic(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let infos = this.cacheMusicInfos.get(key);
        let oninfos = this.onMusicInfos.get(key);
        let inOnindex = oninfos.indexOf(info)
        if (inOnindex >= 0) {
            oninfos.splice(inOnindex, 1)
            if (!infos) {
                infos = []
                this.cacheMusicInfos.set(key, infos)
            }
            if (infos.length == 0) info.resCache.cache.addRef("cacheToCacheMusic")
            infos.push(info)
        } else {
            console.error("播放的队列中没有" + info.resCache.cache.url)
        }
    }
    cacheToCacheEffect(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let infos = this.cacheEffectInfos.get(key);
        let oninfos = this.onEffectInfos.get(key);
        if (!oninfos) return;
        let inOnindex = oninfos.indexOf(info)
        if (inOnindex >= 0) {
            oninfos.splice(inOnindex, 1)
            if (!infos) {
                infos = []
                this.cacheEffectInfos.set(key, infos)
            }
            if (infos.length == 0) info.resCache.cache.addRef("cacheToCacheEffect")
            infos.push(info)
        } else {
            console.error("播放的队列中没有" + info.resCache.cache.url)
        }
    }
    cacheToCacheVoice(info: AudioInfo) {
        let key = this.makeKey(info.resCache.cache.url, info.resCache.cache.bundle);
        let infos = this.cacheVoiceInfos.get(key);
        let oninfos = this.onVoiceInfos.get(key);
        let inOnindex = oninfos.indexOf(info)
        if (inOnindex >= 0) {
            oninfos.splice(inOnindex, 1)
            if (!infos) {
                infos = []
                this.cacheVoiceInfos.set(key, infos)
            }
            if (infos.length == 0) info.resCache.cache.addRef("cacheToCacheVoice")
            infos.push(info)
        } else {
            console.error("播放的队列中没有" + info.resCache.cache.url)
        }
    }

    /**@description 存储 */
    public save() {
        try {
            sys.localStorage.setItem(this._storeMusicKey, this.isMusicOn);
            sys.localStorage.setItem(this._storeEffectKey, this.isEffectOn);
            sys.localStorage.setItem(this._storeVoiceKey, this.isVoiceOn);

            sys.localStorage.setItem(this._storeMusicVolumeKey, this.musicVolume);
            sys.localStorage.setItem(this._storeEffectVolumeKey, this.effectVolume);
            sys.localStorage.setItem(this._storeVoiceVolumeKey, this.voiceVolume);
        } catch (error) {
        }
    }

    public setMusicVolume(volume: number) {
        this.onMusicInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.volume = volume;
            })
        });
        this.musicVolume = volume;
        this.save();
    }

    public setEffectVolume(volume: number) {
        this.onEffectInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.volume = volume;
            })
        });
        this.effectVolume = volume;
        this.save();
    }

    public setVoiceVolume(volume: number) {
        this.onVoiceInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.volume = volume;
            })
        });
        this.voiceVolume = volume;
        this.save();
    }

    public setMusicStatus(isOn: boolean) {
        if (this.isMusicOn == isOn) {
            return;
        }
        this.isMusicOn = isOn;
        this.save();
        if (isOn) {
            if (this.curMusic) {
                this.curMusic.play();
            }
        } else {
            this.stopMusic();
        }
    }

    public setEffectStatus(isOn: boolean) {
        if (this.isEffectOn == isOn) {
            return;
        }
        this.isEffectOn = isOn;
        this.save();
        if (!isOn) {
            this.stopAllEffects();
        }
    }

    public setVoiceStatus(isOn: boolean) {
        if (this.isVoiceOn == isOn) {
            return;
        }
        this.isVoiceOn = isOn;
        this.save();
        if (!isOn) {
            this.stopAllVoices();
        }
    }

    public stopAllEffects() {
        this.onEffectInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.stop();
            })
        });
    }

    public stopAllVoices() {
        this.onVoiceInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.stop();
            })
        });
    }

    public stopMusic() {
        this.onMusicInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.stop();
            })
        });
    }

    public makeKey(url: string, bundle: string) {
        return `${bundle}_${url}`;
    }

    public stopEffect(url: string, bundle: string) {
        let key = this.makeKey(url, bundle);
        let infos = this.onEffectInfos.get(key);
        infos?.forEach((ele) => {
            ele.stop()
        })
    }
    public stopVoice(url: string, bundle: string) {
        let key = this.makeKey(url, bundle);
        let infos = this.onVoiceInfos.get(key);
        infos.forEach((ele) => {
            ele.stop()
        })
    }

    public resumeAll() {
        this.onMusicInfos.forEach((infos, key, source) => {
            if (this.isMusicOn) {
                infos.forEach((ele) => {
                    ele.resume();
                })
            }
        });
        this.onEffectInfos.forEach((infos, key, source) => {
            if (this.isEffectOn) {
                infos.forEach((ele) => {
                    ele.resume();
                })
            }
        });
        this.onVoiceInfos.forEach((infos, key, source) => {
            if (this.isVoiceOn) {
                infos.forEach((ele) => {
                    ele.resume();
                })
            }
        });
    }

    public pauseAll() {
        this.onMusicInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
        this.onEffectInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
        this.onVoiceInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
    }

    public pauseAllMusic() {
        this.onMusicInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
    }

    public resumeAllMusic() {
        this.onMusicInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.resume();
            })
        });
    }

    public pauseAllEffect() {
        this.onEffectInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
    }

    public resumeAllEffect() {
        this.onEffectInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.resume();
            })
        });
    }

    public pauseAllVoice() {
        this.onVoiceInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.pause();
            })
        });
    }

    public resumeAllVoice() {
        this.onVoiceInfos.forEach((infos, key, source) => {
            infos.forEach((ele) => {
                ele.resume();
            })
        });
    }
}