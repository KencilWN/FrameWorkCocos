import { AudioClip, AudioSource, isValid } from 'cc';

/** Teaching adaptation of ResourceAudio: caller provides the source and owns clip lifetime. */
export class AudioPlayer {
    constructor(private readonly source: AudioSource) {}

    public playMusic(clip: AudioClip, loop = true): void {
        this.assertSource();
        this.source.stop();
        this.source.clip = clip;
        this.source.loop = loop;
        this.source.play();
    }

    public playEffect(clip: AudioClip, volumeScale = 1): void {
        this.assertSource();
        this.source.playOneShot(clip, volumeScale);
    }

    public setVolume(volume: number): void {
        if (!Number.isFinite(volume)) throw new Error('Volume must be finite');
        this.assertSource();
        this.source.volume = Math.max(0, Math.min(1, volume));
    }

    /** Stops music, not playOneShot effects; source and clips remain caller-owned. */
    public stop(): void {
        if (!isValid(this.source, true)) return;
        this.source.stop();
        this.source.clip = null;
    }

    private assertSource(): void {
        if (!isValid(this.source, true)) throw new Error('AudioSource is destroyed');
    }
}
