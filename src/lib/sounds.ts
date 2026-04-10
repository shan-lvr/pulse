import { Howl, Howler } from 'howler';

// ElevenLabs-generated audio assets (see scripts/generate-audio.mjs).
// Files live in public/ and are served from the site root.
const SOUND_URLS = {
  WAVE_START: '/sfx/wave-start.mp3',
  WIN: '/sfx/win.mp3',
  COLLAPSE: '/sfx/collapse.mp3',
  BONUS: '/sfx/bonus.mp3',
  PULSE: '/sfx/pulse.mp3',
  BGM: '/bgm.mp3',
};

/**
 * SoundManager
 *
 * SFX use Howler's default Web Audio mode (decoded into AudioBuffer for
 * zero-latency triggering — fine for short clips).
 *
 * BGM uses Howler's HTML5 streaming mode (`html5: true`) so it can start
 * playing as soon as the first few seconds are buffered, instead of waiting
 * for the entire ~1 MB file to be downloaded AND decoded by
 * `decodeAudioData()`. After load we additionally route the underlying
 * `<audio>` element through Howler's Web Audio graph via
 * `createMediaElementSource`, so the MusicVisualizer's analyser tap on
 * `Howler.masterGain` still picks up the BGM.
 */
class SoundManager {
  private sounds: Record<string, Howl> = {};
  private enabled: boolean = true;
  private bgmRouted = false;

  constructor() {
    this.initSounds();
  }

  private initSounds() {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const soundKey = key
        .toLowerCase()
        .replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      const isBgm = soundKey === 'bgm';

      this.sounds[soundKey] = new Howl({
        src: [url],
        loop: isBgm,
        // BGM streams via HTML5 audio element so it can start playing as soon
        // as enough is buffered (no decodeAudioData wait on a ~1MB file).
        html5: isBgm,
        preload: true,
        volume:
          soundKey === 'bgm'
            ? 0.3
            : soundKey === 'win'
              ? 0.6
              : soundKey === 'bonus'
                ? 0.5
                : soundKey === 'pulse'
                  ? 0.15
                  : 0.4,
        onload: () => {
          console.log(`Sound loaded: ${soundKey}`);
          if (isBgm) this.routeBgmThroughWebAudio();
        },
        onloaderror: (_id, error) => {
          console.error(`Error loading sound ${soundKey}:`, error);
        },
        onplayerror: (_id, error) => {
          console.error(`Error playing sound ${soundKey}:`, error);
        },
      });
    });
  }

  /**
   * Pipe the BGM <audio> element through Howler's Web Audio graph so the
   * MusicVisualizer analyser tap on `Howler.masterGain` can read it.
   *
   * Without this, an `html5: true` Howl plays through the bare HTMLMediaElement
   * and skips the Web Audio graph entirely → analyser sees only SFX.
   *
   * Touches Howler internals (`_sounds[0]._node`) — guarded with try/catch.
   */
  private routeBgmThroughWebAudio() {
    if (this.bgmRouted) return;
    try {
      const bgm = this.sounds.bgm as unknown as {
        _sounds?: Array<{ _node?: HTMLAudioElement }>;
      };
      const audioEl = bgm._sounds?.[0]?._node;
      const ctx = (Howler as unknown as { ctx: AudioContext | null }).ctx;
      const masterGain = (Howler as unknown as { masterGain?: GainNode })
        .masterGain;
      if (!audioEl || !ctx || !masterGain) return;
      // CORS: required for createMediaElementSource on cross-origin streams.
      // Same-origin (our /bgm.mp3) doesn't strictly need this, but it's a
      // no-op when same-origin and harmless to set.
      audioEl.crossOrigin = 'anonymous';
      const source = ctx.createMediaElementSource(audioEl);
      source.connect(masterGain);
      this.bgmRouted = true;
      console.log('BGM routed through Web Audio graph (analyser-visible)');
    } catch (e) {
      console.warn('BGM Web Audio routing failed (visualizer will only see SFX):', e);
    }
  }

  play(soundName: string) {
    if (this.enabled && this.sounds[soundName]) {
      // If it's BGM and already playing, don't restart it
      if (soundName === 'bgm' && this.sounds[soundName].playing()) return;

      console.log(`Attempting to play sound: ${soundName}`);
      try {
        this.sounds[soundName].play();
      } catch (e) {
        console.error(`Failed to play sound ${soundName}:`, e);
      }
    } else if (!this.sounds[soundName]) {
      console.warn(`Sound not found: ${soundName}`);
    }
  }

  stop(soundName: string) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
    console.log(`Sound enabled: ${enabled}`);
  }
}

export const soundManager = new SoundManager();
