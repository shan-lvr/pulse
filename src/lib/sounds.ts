import { Howl } from 'howler';

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

class SoundManager {
  private sounds: Record<string, Howl> = {};
  private enabled: boolean = true;

  constructor() {
    this.initSounds();
  }

  private initSounds() {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const soundKey = key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      this.sounds[soundKey] = new Howl({
        src: [url],
        loop: soundKey === 'bgm',
        volume: soundKey === 'bgm' ? 0.3 : (soundKey === 'win' ? 0.6 : (soundKey === 'bonus' ? 0.5 : (soundKey === 'pulse' ? 0.15 : 0.4))),
        onload: () => console.log(`Sound loaded: ${soundKey}`),
        onloaderror: (id, error) => {
          console.error(`Error loading sound ${soundKey}:`, error);
        },
        onplayerror: (id, error) => {
          console.error(`Error playing sound ${soundKey}:`, error);
        }
      });
    });
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
