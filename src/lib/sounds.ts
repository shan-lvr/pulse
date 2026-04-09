import { Howl } from 'howler';

// Sci-fi sound effects URLs
const SOUND_URLS = {
  // Sci-fi whoosh / transition - Trying a different URL
  WAVE_START: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', 
  // Success chime
  WIN: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',        
  // Sci-fi explosion / glitch / fail
  COLLAPSE: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',   
  // Digital alert / notification
  BONUS: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',      
  // Rhythmic pulse sound
  PULSE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  // Background Music
  BGM: '/Background.wav',
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
