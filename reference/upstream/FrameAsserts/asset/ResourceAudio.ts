import { AudioClip, isValid, Node } from 'cc';
import { loadAsset } from "./AssetMgr";
import { AudioInfo, CacheAudioMgr } from "./CacheAudioMgr";
import { CCAudioInfo } from "./platformAsset/PtAudio";
import { Resource } from "./Resource";
/**
 * @description 声音组件
 */
interface PendingMusicPlay {
    loop: boolean;
    volume: number;
    overfun?: () => void;
}

export class ResourceAudio {
    node: Node = null
    /**@description 节点上播放音效*/
    private _loadedAudios: Array<AudioInfo> = new Array<AudioInfo>();
    /**@description 正在加载中的背景音乐 key，避免同 url 并发重复加载 */
    private _pendingMusicLoadKey: string = null;
    private _pendingMusicLoadId: number = 0;
    private _pendingMusicPlay: PendingMusicPlay = null;
    /**@description 正在加载中的音频资源，合并同 key 的并发 loadAsset 请求 */
    private _loadingAudios: Map<string, Array<(pb: Resource.Audio) => void>> = new Map();

    private _name: string = "_Loader"
    initNodeLoader(parent: Node, name: string = '') {
        this._name = name + "_Audio"
        this.node = parent
    }

    destroy() {
        this._pendingMusicLoadKey = null;
        this._pendingMusicLoadId = 0;
        this._pendingMusicPlay = null;
        this._loadingAudios.clear();
        this._loadedAudios.forEach((ele) => {
            let rescatche = ele.resCache
            rescatche.node.removeFromParent()
            rescatche.cache.delRef(rescatche.parentName + rescatche.tag)
            if (rescatche.audioType == 0) {
                this.audioData.cacheToCacheMusic(ele)
            } else if (rescatche.audioType == 1) {
                this.audioData.cacheToCacheEffect(ele)
            } else if (rescatche.audioType == 2) {
                this.audioData.cacheToCacheVoice(ele)
            }
        })
        this._loadedAudios = []
    }
    protected get audioData() {
        return CacheAudioMgr.ins;
    }

    /**@description 背景音乐音量 */
    public get musicVolume() { return this.audioData.musicVolume; }
    public set musicVolume(volume) { this.audioData.setMusicVolume(volume); }
    /**@description 音效音量 */
    public get effectVolume() { return this.audioData.effectVolume; }
    public set effectVolume(volume) { this.audioData.setEffectVolume(volume); }
    /**@description 声音音量 */
    public get voiceVolume() { return this.audioData.voiceVolume; }
    public set voiceVolume(volume) { this.audioData.setVoiceVolume(volume); }

    /**@description 音效开关 */
    public get isEffectOn() { return this.audioData.isEffectOn; }
    public set isEffectOn(value) { this.audioData.setEffectStatus(value); }
    public get isVoiceOn() { return this.audioData.isVoiceOn; }
    public set isVoiceOn(value) { this.audioData.setVoiceStatus(value); }

    /**@description 背景音乐开关 */
    public get isMusicOn() { return this.audioData.isMusicOn; }
    /**@description 设置背景音乐开关 */
    public set isMusicOn(isOn: boolean) { this.audioData.setMusicStatus(isOn); }

    public save(): void { this.audioData.save(); }

    /**@description 停止 */
    public stopEffect(url: string, bundle: string) { this.audioData.stopEffect(url, bundle); }
    public stopVoice(url: string, bundle: string) { this.audioData.stopVoice(url, bundle); }

    public pauseAll() { this.audioData.pauseAll(); }
    public resumeAll() { this.audioData.resumeAll(); }
    public pauseMusic() { this.audioData.pauseAllMusic(); }
    public resumeMusic() { this.audioData.resumeAllMusic(); }
    public stopMusic() { this.audioData.stopMusic(); }    

    public setMusicState(isOn: boolean) { this.audioData.setMusicStatus(isOn); }
    public setEffectState(isOn: boolean) { this.audioData.setEffectStatus(isOn); }

    public toBackToFront(bbakc: boolean) {
        if (bbakc) {
            this.audioData.pauseAll()
        }
        else {
            this.audioData.resumeAll()
        }
    }

    getDatakey(rc: Resource.Data) {
        let urlKey = Resource.getKey(rc.url, rc.type!, rc.bundle);
        return urlKey
    }
    /**@description 播放音效Clip*/
    private loadResourceAudio(audioData: Resource.Data, complet: (pb: Resource.Audio) => void) {
        audioData.type = AudioClip
        const key = this.getDatakey(audioData);
        const pending = this._loadingAudios.get(key);
        if (pending) {
            pending.push(complet);
            return;
        }
        this._loadingAudios.set(key, [complet]);
        loadAsset(audioData, (cache: Resource.Cache) => {
            const callbacks = this._loadingAudios.get(key) || [];
            this._loadingAudios.delete(key);
            if (!cache) {
                return;
            }
            callbacks.forEach((cb) => {
                const res = new Resource.Audio();
                res.cache = cache;
                res.node = new Node();
                cb(res);
            });
        });
    }

    private onMusicLoaded(audioInfo: AudioInfo, overfun?: () => void): void {
        const self = this;
        self.addToList(audioInfo, 0);
        self.play(audioInfo, true, () => {
            self.deleteToCache(audioInfo, 0);
            if (overfun) overfun();
        });
    }
    deleteToCache(info: AudioInfo, eType: number) {
        let idx = this._loadedAudios.indexOf(info)
        if (idx >= 0) {
            let rescatche = info.resCache
            rescatche.node.removeFromParent()
            rescatche.cache.delRef(rescatche.parentName + rescatche.tag)
            this._loadedAudios.splice(idx, 1)
            if (eType == 0) {
                this.audioData.cacheToCacheMusic(info)
            } else if (eType == 1) {
                this.audioData.cacheToCacheEffect(info)
            } else if (eType == 2) {
                this.audioData.cacheToCacheVoice(info)
            }
        } else {
            console.error("要移除的AUdioInfo是空", info.resCache.cache.url)
        }
    }
    addToList(info: AudioInfo, eType: number) {
        let idx = this._loadedAudios.indexOf(info)
        if (idx >= 0) {
            console.error("audioInfo已经存在", info.resCache.cache.url)
        } else {
            let rescatche = info.resCache
            let urlKey = this.getDatakey({ url: rescatche.cache.url, bundle: rescatche.cache.bundle, type: AudioClip });
            rescatche.parentName = urlKey + this._name
            rescatche.tag = '_Audio_'
            rescatche.cache.addRef(rescatche.parentName + rescatche.tag)
            this._loadedAudios.push(info)
            if (eType == 0) {
                this.audioData.cacheOnMusic(info)
            } else if (eType == 1) {
                this.audioData.cacheOnEffect(info)
            } else if (eType == 2) {
                this.audioData.cacheOnVoice(info)
            }
        }
    }

    public playMusic(url: string, bundle: string, loop: boolean = true, overfun?: () => void, musicValue?: number) {
        if (!isValid(this.node)) {
            return;
        }
        const loadKey = this.getDatakey({ url, bundle, type: AudioClip });
        const curvalue = musicValue == null || musicValue == undefined ? this.musicVolume : musicValue;
        if (this._pendingMusicLoadKey === loadKey) {
            console.debug("背景音乐正在加载中，重复播放无效")
            this._pendingMusicPlay = { loop, volume: curvalue, overfun };
            return;
        }
        if (loop) {
            if (this.audioData.curMusic && this.audioData.curMusic.source && this.audioData.curMusic.source.playing && this.audioData.curMusic.resCache.cache.url == url && this.audioData.curMusic.resCache.cache.bundle == bundle) {
                console.debug("背景音乐正在播放中，重复播放无效")
                return;
            } else if (this.audioData.curMusic) {//背景音效替换
                this.audioData.curMusic.stop()
                this.deleteToCache(this.audioData.curMusic, 0);
                this.audioData.curMusic = null
            }
        }
        let self = this
        let audioInfo = this.audioData.popCacheMusic(url, bundle);
        if (!audioInfo) {
            const loadId = ++this._pendingMusicLoadId;
            this._pendingMusicLoadKey = loadKey;
            this._pendingMusicPlay = { loop, volume: curvalue, overfun };
            this.loadResourceAudio({ url: url, bundle: bundle }, (audio: Resource.Audio) => {
                if (loadId !== self._pendingMusicLoadId) {
                    audio?.node?.destroy();
                    return;
                }
                const pendingPlay = self._pendingMusicPlay;
                self._pendingMusicLoadKey = null;
                self._pendingMusicPlay = null;
                if (!isValid(self.node) || !audio) {
                    return;
                }
                audioInfo = new CCAudioInfo()
                audioInfo.resCache = audio
                audioInfo.resCache.audioType = 0
                audioInfo.loop = pendingPlay ? pendingPlay.loop : loop;
                audioInfo.volume = pendingPlay ? pendingPlay.volume : curvalue
                audioInfo.resCache.node.parent = self.node
                if (audioInfo.loop) self.audioData.curMusic = audioInfo
                self.onMusicLoaded(audioInfo, pendingPlay ? pendingPlay.overfun : overfun);
            })
        } else {
            audioInfo.resCache.node.parent = this.node
            audioInfo.resCache.audioType = 0
            audioInfo.loop = loop;
            audioInfo.volume = curvalue
            if (loop) this.audioData.curMusic = audioInfo
            self.onMusicLoaded(audioInfo, overfun);
        }
    }

    public playEffect(url: string, bundle: string, overfun?: () => void, effectValue?: number) {
        if (!isValid(this.node)) {
            return;
        }
        let curvalue = effectValue == null || effectValue == undefined ? this.effectVolume : effectValue
        //检查是否已经加载过
        let audioInfo = this.audioData.popCacheEffect(url, bundle);
        let self = this
        if (!audioInfo) {
            this.loadResourceAudio({ url: url, bundle: bundle }, (audio: Resource.Audio) => {
                
                audioInfo = new CCAudioInfo()
                audioInfo.resCache = audio
                audioInfo.resCache.audioType = 1
                audioInfo.volume = curvalue
                audioInfo.resCache.node.parent = self.node
                self.addToList(audioInfo, 1)
                self.play(audioInfo, false, () => {
                    self.deleteToCache(audioInfo, 1);
                    if (overfun) overfun()
                })
            })
        } else {
            audioInfo.resCache.node.parent = this.node
            self.addToList(audioInfo, 1)
            audioInfo.volume = curvalue
            audioInfo.resCache.audioType = 1
            self.play(audioInfo, false, () => {
                self.deleteToCache(audioInfo, 1);
                if (overfun) overfun()
            })
        }
    }

    public playVoice(url: string, bundle: string, overfun?: () => void, voiceValue?: number) {
        if (!isValid(this.node)) {
            return;
        }
        let curvalue = voiceValue == null || voiceValue == undefined ? this.voiceVolume : voiceValue
        //检查是否已经加载过
        let audioInfo = this.audioData.popCacheVoice(url, bundle);
        let self = this
        if (!audioInfo) {
            this.loadResourceAudio({ url: url, bundle: bundle }, (audio: Resource.Audio) => {
                audioInfo = new CCAudioInfo()
                audioInfo.resCache = audio
                audioInfo.resCache.audioType = 2
                audioInfo.volume = curvalue
                audioInfo.resCache.node.parent = self.node
                self.addToList(audioInfo, 2)
                self.play(audioInfo, false, () => {
                    self.deleteToCache(audioInfo, 2);
                    if (overfun) overfun()
                })
            })
        } else {
            audioInfo.resCache.node.parent = this.node
            self.addToList(audioInfo, 2)
            audioInfo.volume = curvalue
            audioInfo.resCache.audioType = 2
            self.play(audioInfo, false, () => {
                self.deleteToCache(audioInfo, 2);
                if (overfun) overfun()
            })
        }
    }

    protected play(info: AudioInfo, isMusic: boolean, over: () => void) {
        if (info) {
            if (isMusic) {
                if (this.isMusicOn) {
                    info.play(over);
                } else {
                    over();
                }
            } else if (info.resCache.audioType === 2) {
                if (this.isVoiceOn) {
                    info.play(over);
                } else {
                    over();
                }
            } else {
                if (this.isEffectOn) {
                    info.play(over);
                } else {
                    over();
                }
            }
        } else {
            over();
        }
    }
}
