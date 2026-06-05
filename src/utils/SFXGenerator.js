import { settingsManager } from './SettingsManager.js';

/**
 * Generates musical sound effects using Web Audio API oscillators and envelopes.
 * All sounds are 50-300ms, orchestral/classical in character, and cached as WAV buffers.
 */
export class SFXGenerator {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.generated = false;
  }

  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  generateAll() {
    if (this.generated) return;
    this.init();

    this.generateJumpSFX();
    this.generateLandSFX();
    this.generateAttackSFX();
    this.generateHitEnemySFX();
    this.generateTakeDamageSFX();
    this.generateDefeatEnemySFX();
    this.generateCollectNoteSFX();
    this.generateCollectSheetMusicSFX();
    this.generateHealthPickupSFX();
    this.generateMenuHoverSFX();
    this.generateMenuSelectSFX();
    this.generateCheckpointSFX();
    this.generateDoorOpenSFX();
    this.generateNPCInteractionSFX();
    this.generateBossHitSFX();

    this.generated = true;
  }

  createBuffer(duration, generator) {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    generator(data, sampleRate, length);
    return buffer;
  }

  bufferToBase64(buffer) {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  addSoundToScene(key, buffer) {
    const dataUri = this.bufferToBase64(buffer);
    this.scene.sound.decodeAudio(key, dataUri);
  }

  // --- Sound generation methods ---

  /** Jump: Quick ascending 3-note harp arpeggio (100ms) */
  generateJumpSFX() {
    const buffer = this.createBuffer(0.12, (data, sampleRate, length) => {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const noteLen = Math.floor(length / 3);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const noteIdx = Math.min(Math.floor(i / noteLen), 2);
        const freq = notes[noteIdx];
        const localT = (i - noteIdx * noteLen) / noteLen;
        // Harp-like: fast attack, quick decay
        const envelope = Math.exp(-localT * 8) * 0.8;
        // Triangle + sine harmonics for harp timbre
        const tri = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
        const sin2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
        data[i] = (tri * 0.6 + sin2) * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_jump', buffer);
  }

  /** Land: Soft timpani thud (80ms) */
  generateLandSFX() {
    const buffer = this.createBuffer(0.1, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Low frequency descending tone
        const freq = 120 - 60 * progress;
        const envelope = Math.exp(-progress * 12);
        // Mix sine with noise for timpani character
        const sine = Math.sin(2 * Math.PI * freq * t);
        const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 20);
        data[i] = (sine * 0.7 + noise * 0.3) * envelope * 0.3;
      }
    });
    this.addSoundToScene('sfx_land', buffer);
  }

  /** Attack: Sharp staccato violin pluck (70ms) */
  generateAttackSFX() {
    const buffer = this.createBuffer(0.08, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        const freq = 880; // A5
        // Very fast attack, quick decay — pizzicato character
        const envelope = Math.exp(-progress * 15);
        // Sawtooth-like for violin timbre
        const saw = 2 * ((freq * t) % 1) - 1;
        const sin3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;
        data[i] = (saw * 0.5 + sin3) * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_attack', buffer);
  }

  /** Hit enemy: Cymbal crash + ascending chord (200ms) */
  generateHitEnemySFX() {
    const buffer = this.createBuffer(0.2, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Cymbal: filtered noise with fast decay
        const cymbal = (Math.random() * 2 - 1) * Math.exp(-progress * 8) * 0.3;
        // Ascending chord: C5 + E5 + G5 sweeping up
        const freqBase = 523 + 200 * progress;
        const chord = (
          Math.sin(2 * Math.PI * freqBase * t) +
          Math.sin(2 * Math.PI * freqBase * 1.26 * t) * 0.8 +
          Math.sin(2 * Math.PI * freqBase * 1.5 * t) * 0.6
        ) * Math.exp(-progress * 5) * 0.15;
        data[i] = cymbal + chord;
      }
    });
    this.addSoundToScene('sfx_hitEnemy', buffer);
  }

  /** Take damage: Dissonant minor second (150ms) */
  generateTakeDamageSFX() {
    const buffer = this.createBuffer(0.15, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Two tones a minor second apart — jarring dissonance
        const f1 = 330; // E4
        const f2 = 349.23; // F4
        const envelope = (1 - progress) * Math.exp(-progress * 4);
        const tone1 = Math.sin(2 * Math.PI * f1 * t);
        const tone2 = Math.sin(2 * Math.PI * f2 * t);
        // Add slight noise for impact
        const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 15) * 0.2;
        data[i] = (tone1 + tone2) * envelope * 0.2 + noise;
      }
    });
    this.addSoundToScene('sfx_takeDamage', buffer);
  }

  /** Defeat enemy: Quick major chord resolution (180ms) */
  generateDefeatEnemySFX() {
    const buffer = this.createBuffer(0.18, (data, sampleRate, length) => {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        const envelope = Math.exp(-progress * 4) * 0.8;
        let sample = 0;
        notes.forEach((freq, idx) => {
          // Stagger entry slightly for arpeggio feel
          const delay = idx * 0.015;
          if (t > delay) {
            const localEnv = Math.exp(-(t - delay) * 6);
            sample += Math.sin(2 * Math.PI * freq * (t - delay)) * localEnv / notes.length;
          }
        });
        data[i] = sample * envelope * 0.3;
      }
    });
    this.addSoundToScene('sfx_defeatEnemy', buffer);
  }

  /** Collect note: Ascending bell tone (100ms) */
  generateCollectNoteSFX() {
    const buffer = this.createBuffer(0.12, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Bell-like: fundamental + inharmonic partials
        const freq = 1200 + 400 * progress;
        const envelope = Math.exp(-progress * 6);
        const fundamental = Math.sin(2 * Math.PI * freq * t);
        const partial2 = Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.4;
        const partial3 = Math.sin(2 * Math.PI * freq * 5.4 * t) * 0.15;
        data[i] = (fundamental + partial2 + partial3) * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_collectNote', buffer);
  }

  /** Collect sheet music: Harp flourish (250ms) */
  generateCollectSheetMusicSFX() {
    const buffer = this.createBuffer(0.25, (data, sampleRate, length) => {
      // Rapid ascending arpeggio C major scale
      const notes = [523, 587, 659, 698, 784, 880, 988, 1047]; // C5 through C6
      const noteLen = Math.floor(length / notes.length);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const noteIdx = Math.min(Math.floor(i / noteLen), notes.length - 1);
        const freq = notes[noteIdx];
        const localProgress = (i - noteIdx * noteLen) / noteLen;
        // Harp envelope: quick attack, medium decay
        const envelope = Math.exp(-localProgress * 5) * (1 - i / length * 0.3);
        const tri = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
        const sin = Math.sin(2 * Math.PI * freq * t);
        data[i] = (tri * 0.4 + sin * 0.6) * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_collectSheetMusic', buffer);
  }

  /** Health pickup: Warm major chord swell (200ms) */
  generateHealthPickupSFX() {
    const buffer = this.createBuffer(0.2, (data, sampleRate, length) => {
      const notes = [261.63, 329.63, 392.0]; // C4, E4, G4
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Swell envelope: crescendo then decrescendo
        const envelope = Math.sin(Math.PI * progress) * 0.8;
        let sample = 0;
        notes.forEach(freq => {
          sample += Math.sin(2 * Math.PI * freq * t);
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.3; // 2nd harmonic warmth
        });
        data[i] = sample / notes.length * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_healthPickup', buffer);
  }

  /** Menu hover: Soft harpsichord key (60ms) */
  generateMenuHoverSFX() {
    const buffer = this.createBuffer(0.06, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        const freq = 880; // A5
        // Harpsichord: bright attack with quick decay
        const envelope = Math.exp(-progress * 12);
        // Square-ish wave for harpsichord brightness
        const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
        const sin = Math.sin(2 * Math.PI * freq * t);
        data[i] = (square * 0.3 + sin * 0.7) * envelope * 0.15;
      }
    });
    this.addSoundToScene('sfx_menuHover', buffer);
  }

  /** Menu select: Piano chord (150ms) */
  generateMenuSelectSFX() {
    const buffer = this.createBuffer(0.15, (data, sampleRate, length) => {
      const notes = [261.63, 329.63, 392.0]; // C4, E4, G4
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Piano-like: fast attack, moderate sustain, natural decay
        const envelope = Math.exp(-progress * 5) * (progress < 0.02 ? progress / 0.02 : 1);
        let sample = 0;
        notes.forEach(freq => {
          sample += Math.sin(2 * Math.PI * freq * t);
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.5;
          sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;
        });
        data[i] = sample / (notes.length * 1.7) * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_menuSelect', buffer);
  }

  /** Checkpoint: Chime progression — music box (300ms) */
  generateCheckpointSFX() {
    const buffer = this.createBuffer(0.3, (data, sampleRate, length) => {
      const notes = [1047, 1175, 1319, 1568]; // C6, D6, E6, G6
      const noteLen = Math.floor(length / notes.length);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const noteIdx = Math.min(Math.floor(i / noteLen), notes.length - 1);
        const freq = notes[noteIdx];
        const localProgress = (i - noteIdx * noteLen) / noteLen;
        // Music box: bell-like with high frequencies
        const envelope = Math.exp(-localProgress * 6);
        const fundamental = Math.sin(2 * Math.PI * freq * t);
        const harmonic = Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;
        data[i] = (fundamental + harmonic) * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_checkpoint', buffer);
  }

  /** Door open: Dramatic ascending scale (250ms) */
  generateDoorOpenSFX() {
    const buffer = this.createBuffer(0.25, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Sweeping frequency from low to high
        const freq = 200 + 800 * progress * progress;
        const envelope = Math.sin(Math.PI * progress);
        // Rich tone with harmonics
        const tone = Math.sin(2 * Math.PI * freq * t) +
          Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.4 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
        data[i] = tone * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_doorOpen', buffer);
  }

  /** NPC interaction: Gentle harp pluck (80ms) */
  generateNPCInteractionSFX() {
    const buffer = this.createBuffer(0.1, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        const freq = 587.33; // D5
        // Gentle pluck: quick attack, soft decay
        const envelope = Math.exp(-progress * 10) * 0.7;
        const tri = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
        const sin = Math.sin(2 * Math.PI * freq * t);
        data[i] = (tri * 0.3 + sin * 0.7) * envelope * 0.18;
      }
    });
    this.addSoundToScene('sfx_npcInteraction', buffer);
  }

  /** Boss hit: Dramatic orchestral hit (200ms) */
  generateBossHitSFX() {
    const buffer = this.createBuffer(0.2, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const progress = i / length;
        // Orchestral hit: layered low + mid + high with noise
        const envelope = Math.exp(-progress * 6) * (progress < 0.01 ? progress / 0.01 : 1);
        const low = Math.sin(2 * Math.PI * 110 * t) * 0.4; // A2
        const mid = Math.sin(2 * Math.PI * 440 * t) * 0.3; // A4
        const high = Math.sin(2 * Math.PI * 880 * t) * 0.2; // A5
        const fifth = Math.sin(2 * Math.PI * 660 * t) * 0.25; // E5
        const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 12) * 0.15;
        data[i] = (low + mid + high + fifth + noise) * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_bossHit', buffer);
  }

  /**
   * Play a sound effect, respecting volume settings.
   * @param {Phaser.Scene} scene - Current scene
   * @param {string} key - Sound key
   * @param {number} baseVolume - Base volume (0-1), will be scaled by settings
   */
  static play(scene, key, baseVolume = 0.25) {
    const sfxVolume = settingsManager.get('sfxVolume');
    if (sfxVolume <= 0) return;
    if (scene.sound.get(key)) {
      scene.sound.play(key, { volume: baseVolume * sfxVolume });
    }
  }
}
