/**
 * Generates chiptune-style audio using the Web Audio API.
 */
export class AudioGenerator {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
  }

  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  generateAll() {
    this.init();
    this.generateJumpSound();
    this.generateCoinSound();
    this.generateHitSound();
    this.generateDeathSound();
    this.generateLevelComplete();
    this.generateMenuMusic();
  }

  createBuffer(duration, generator) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
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

    // WAV header
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

    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    // Convert to base64 data URI
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

  generateJumpSound() {
    const buffer = this.createBuffer(0.15, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const freq = 300 + (600 * (i / length));
        data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - i / length) * 0.3;
      }
    });
    this.addSoundToScene('sfx_jump', buffer);
  }

  generateCoinSound() {
    const buffer = this.createBuffer(0.2, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const freq = i < length / 2 ? 800 : 1200;
        data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - i / length) * 0.25;
      }
    });
    this.addSoundToScene('sfx_coin', buffer);
  }

  generateHitSound() {
    const buffer = this.createBuffer(0.3, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const freq = 200 - (150 * (i / length));
        data[i] = (Math.random() * 0.5 + Math.sin(2 * Math.PI * freq * t) * 0.5) * (1 - i / length) * 0.3;
      }
    });
    this.addSoundToScene('sfx_hit', buffer);
  }

  generateDeathSound() {
    const buffer = this.createBuffer(0.5, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const freq = 400 - (350 * (i / length));
        data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - i / length) * 0.3;
      }
    });
    this.addSoundToScene('sfx_death', buffer);
  }

  generateLevelComplete() {
    const buffer = this.createBuffer(1.0, (data, sampleRate, length) => {
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      const noteLength = length / notes.length;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const noteIndex = Math.min(Math.floor(i / noteLength), notes.length - 1);
        const freq = notes[noteIndex];
        const envelope = 1 - ((i % noteLength) / noteLength) * 0.5;
        data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_levelComplete', buffer);
  }

  generateMenuMusic() {
    // Simple Mozart-inspired melody loop
    const buffer = this.createBuffer(4.0, (data, sampleRate, length) => {
      // Eine kleine Nachtmusik opening notes (simplified)
      const melody = [
        { freq: 392, dur: 0.25 }, // G4
        { freq: 0, dur: 0.05 },
        { freq: 294, dur: 0.12 }, // D4
        { freq: 392, dur: 0.25 }, // G4
        { freq: 0, dur: 0.05 },
        { freq: 294, dur: 0.12 }, // D4
        { freq: 392, dur: 0.12 }, // G4
        { freq: 494, dur: 0.12 }, // B4
        { freq: 587, dur: 0.25 }, // D5
        { freq: 0, dur: 0.1 },
        { freq: 587, dur: 0.25 }, // D5
        { freq: 0, dur: 0.05 },
        { freq: 440, dur: 0.12 }, // A4
        { freq: 587, dur: 0.25 }, // D5
        { freq: 0, dur: 0.05 },
        { freq: 440, dur: 0.12 }, // A4
        { freq: 587, dur: 0.12 }, // D5
        { freq: 659, dur: 0.12 }, // E5 (approx F#5 simplified)
        { freq: 784, dur: 0.5 },  // G5
      ];

      let samplePos = 0;
      for (const note of melody) {
        const noteSamples = Math.floor(note.dur * sampleRate);
        for (let i = 0; i < noteSamples && samplePos < length; i++) {
          const t = samplePos / sampleRate;
          if (note.freq > 0) {
            const envelope = Math.min(1, i / (sampleRate * 0.01)) * Math.max(0, 1 - i / (noteSamples * 0.8));
            // Square wave with softening
            const wave = Math.sin(2 * Math.PI * note.freq * t) * 0.7 +
                         Math.sin(4 * Math.PI * note.freq * t) * 0.2 +
                         Math.sin(6 * Math.PI * note.freq * t) * 0.1;
            data[samplePos] = wave * envelope * 0.2;
          } else {
            data[samplePos] = 0;
          }
          samplePos++;
        }
      }
    });
    this.addSoundToScene('music_menu', buffer);
  }
}
