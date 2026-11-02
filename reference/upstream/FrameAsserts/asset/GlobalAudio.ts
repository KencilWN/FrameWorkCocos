import { AudioClip, AudioSource, director, Node } from 'cc';
import { ECtorType } from "../../baseTs/Ctor";
import { Macro } from "./Enums";
import { ResourceAudio } from "./ResourceAudio";

/**
 * @description 全局音频播放组棒
 */
@ctorRegist("GlobalAudio", ECtorType.Instance)
export class GlobalAudio extends ResourceAudio implements IModule {
    modelName: string = "【全局声音】"
    private _directClipSources = new Map<number, AudioSource>();
    private _directClipId = 1;
    
    get curMuiseId(): number {
        let playingMusicId = this.audioData.curMusic?.source?.id;
        if(playingMusicId == null || playingMusicId == undefined){
            return -1;
        }
        return playingMusicId;
    }

    initAudio(){        
        console.log("初始化声音节点")      
        this._directClipSources.forEach((source) => {
            source.stop();
            source.node.destroy();
        });
        this._directClipSources.clear();
        this.node = new Node('audioSound');
        director.getScene().addChild(this.node)
        super.initNodeLoader(this.node,'全局声音')
        this.audioData.init();
    }

    /**@description 播放全局音乐 */
    public playGlobalMusic(url:string,bundle:string=Macro.BUNDLE_RESOURCES,loop:boolean = true){
        return this.playMusic(url,bundle,loop);
    }
    
    /**@description 播放全局音效 */
    public playGlobalEffect(url:string,bundle:string=Macro.BUNDLE_RESOURCES){
        return this.playEffect(url,bundle);
    }

    setBgmMusicVolume(volume: number){
        this.audioData.setMusicVolume(volume);
    }
    getMusicVolume(): number{
        return this.audioData.musicVolume;
    }

    //播放音效
	playSoundEffect(path: string, isLoop: boolean = false, callBack?: ()=>void) {
        return super.playEffect(path, Macro.BUNDLE_RESOURCES, callBack);
    }

    playSoundEffectClip(audio: AudioClip, isLoop: boolean = false, callBack: Function = null) {
		if (!audio || !director.getScene()) return -1;
		const node = new Node('DirectAudioEffect');
		director.getScene().addChild(node);
		const source = node.addComponent(AudioSource);
		const id = this._directClipId++;
		let cleaned = false;
		this._directClipSources.set(id, source);
		source.clip = audio;
		source.loop = isLoop;
		source.volume = this.effectVolume;
		const cleanup = () => {
			if (cleaned) return;
			cleaned = true;
			this._directClipSources.delete(id);
			source.node.off(AudioSource.EventType.ENDED, cleanup, this);
			node.destroy();
			callBack?.();
		};
		source.node.on(AudioSource.EventType.ENDED, cleanup, this);
		source.play();
		return id;
	}

    playBgMusic(path: string, isLoop: boolean = true){
         super.playMusic(path, Macro.BUNDLE_RESOURCES, isLoop);
    }

    stopBgMusic(){
        return this.audioData.stopMusic();
    }

    stopAll(){
        this.audioData.stopMusic();
        this.audioData.stopAllEffects();
        this.audioData.stopAllVoices();
        this._directClipSources.forEach((source) => {
            source.stop();
            source.node.destroy();
        });
        this._directClipSources.clear();
    }

    pauseAll(){
        this.audioData.pauseAll();
    }
    
    resumeAll(){
        this.audioData.resumeAll();
    }
}
