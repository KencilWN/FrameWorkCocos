import { AudioClip, AudioSource, Node, director, isValid } from 'cc';
import { AudioInfo, IAudioSource } from "../CacheAudioMgr";

declare const wx: any;

const INVALID_AUDIO_ID = -1;

/** Creator 3.8 AudioSource adapter implementing the existing IAudioSource contract. */
export function createCCAudioSource(node?: Node): IAudioSource {
    let audioId = INVALID_AUDIO_ID;
    let clip: AudioClip = null;
    let loop = false;
    let volume = 1;
    let endCallback: Function = null;
    let playCallback: Function = null;
    let stopCallback: Function = null;
    let errorCallback: Function = null;

    const host = node && isValid(node) ? node : new Node('AudioSource');
    if (!host.parent && director.getScene()) director.getScene().addChild(host);
    const audioSource = host.getComponent(AudioSource) || host.addComponent(AudioSource);
    const endedEvent = AudioSource.EventType.ENDED;
    let destroyed = false;
    const emitEnded = () => {
        if (audioId === INVALID_AUDIO_ID) return;
        audioId = INVALID_AUDIO_ID;
        endCallback?.();
    };
    host.on(endedEvent, emitEnded, host);

    const source: IAudioSource = {
        get id() { return audioId; },
        get clip() { return clip; },
        set clip(v) { clip = v; },
        get src() { return clip ? clip.nativeUrl : ''; },
        set src(_v: string) { },
        get loop() { return loop; },
        set loop(v: boolean) {
            loop = v;
            audioSource.loop = v;
        },
        get volume() { return volume; },
        set volume(v: number) {
            volume = Math.max(0, v ?? 0);
            audioSource.volume = volume;
        },
        get playing() { return !destroyed && audioId !== INVALID_AUDIO_ID && audioSource.playing; },
        set playing(_v: boolean) { },

        play() {
            if (destroyed) return;
            if (!clip) {
                if (errorCallback) errorCallback();
                return;
            }
            // AudioSource.play resumes a paused clip itself. Calling stop here
            // discards its cursor, so only restart an already playing session
            // or one whose clip has changed.
            if (audioId !== INVALID_AUDIO_ID && (audioSource.playing || audioSource.clip !== clip)) {
                audioSource.stop();
                audioId = INVALID_AUDIO_ID;
            }
            audioSource.clip = clip;
            audioSource.loop = loop;
            audioSource.volume = volume;
            audioId = 1;
            if (playCallback) playCallback();
            audioSource.play();
        },
        pause() {
            if (audioId !== INVALID_AUDIO_ID) audioSource.pause();
        },
        stop() {
            if (audioId !== INVALID_AUDIO_ID) {
                audioSource.stop();
                audioId = INVALID_AUDIO_ID;
            }
            if (stopCallback) stopCallback();
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            host.off(endedEvent, emitEnded, host);
            audioSource.stop();
            audioId = INVALID_AUDIO_ID;
            endCallback = null;
            playCallback = null;
            stopCallback = null;
            errorCallback = null;
            if (isValid(host) && host !== node) host.destroy();
        },
        onEnded(fn: Function) { endCallback = fn; },
        onPlay(fn: Function) { playCallback = fn; },
        onStop(fn: Function) { stopCallback = fn; },
        onError(fn: Function) { errorCallback = fn; },
        offEnded() { endCallback = null; },
        offPlay() { playCallback = null; },
        offStop() { stopCallback = null; },
        offError() { errorCallback = null; },
    };
    return source;
}

export class WxAudioInfo extends AudioInfo {   
    play(overBack?:()=>void): void {
        this.isPause = false;
        
        let self = this
        let eventPlay = function(eState){
            let audio = self.source
            if(!audio)return
            if(eState==0 || eState == 2){//close
                console.log("结束播放：",)
                audio.playing = false
                console.log("=============audio.destroy")
                self.source.offEnded()
                self.resCache.node.removeFromParent()
            }
            else if(eState == 1){//play
                console.log("开始播放:",this.url)
                self.source.offPlay()
                audio.playing = true
            }            
        }
        let endFun = function(){
            //播放结束，销毁该实例
            eventPlay(0)
            if(overBack)overBack()
        }  
        let playFun = function(){
            eventPlay(1)
        }
        let stopFun = function(){
            eventPlay(2)
        }
        let buim = this.resCache.audioType==1?true:false
        if(!this.source){            
            this.source = (wx as any).createInnerAudioContext({
                useWebAudioImplement:buim,//audioType==1?true:false,//对于短音频、播放频繁的音频建议开启此选项获得更优的性能表现
            })
        }        
        
        this.source.playing = false          
        this.source.clip = this.resCache.cache.data as AudioClip;
        this.source.src = this.source.clip.nativeUrl
        this.source.loop = this.loop
        this.source.volume = this.volume
        this.source.onEnded(endFun)
        this.source.onPlay(playFun)
        this.source.onStop(stopFun)            
        this.source.onError(endFun)      
        
        this.source.play();
    }
}

export class CCAudioInfo extends AudioInfo {
    play(overBack?:()=>void): void {
        this.isPause = false;
        
        let self = this
        let eventPlay = function(eState){
            let audio = self.source
            if(!audio)return
            if(eState==0 || eState == 2){//close
                console.log("结束播放：",self.resCache.cache.url)
                audio.offEnded()
                console.log("=============audio.destroy")    
                self.resCache.node.removeFromParent()
            }
            else if(eState == 1){//play
                console.log("开始播放:",self.resCache.cache.url)
                audio.offPlay()
            }            
        }
        let endFun = function(){
            //播放结束，销毁该实例              
            eventPlay(0)
            if(overBack)overBack()
        }  
        let playFun = function(){             
            eventPlay(1)
        }
        let stopFun = function(){
            eventPlay(2)
        }
        if(!this.source){
            this.source = createCCAudioSource(this.resCache.node)
        }
        const clip = this.resCache.cache.data as AudioClip;
        this.source.clip = clip;
        this.source.src = clip ? clip.nativeUrl : '';
        this.source.loop = self.loop
        this.source.volume = self.volume
        this.source.onEnded(endFun)
        this.source.onPlay(playFun)
        this.source.onStop(stopFun)            
        this.source.onError(endFun)      

        this.source.play(); 
    }
}
