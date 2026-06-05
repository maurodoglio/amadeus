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
    this.generateViennaMusic();
    this.generateForestMusic();
    this.generatePalaceMusic();
    this.generateBossMusic();
    this.generateConcertMusic();
    this.generateRhythmMusic();
    this.generateCompositionNotes();
    this.generateDissonanceSound();
    this.generateChordConsonant();
    this.generateChordDissonant();
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

  generateViennaMusic() {
    // Light classical waltz in 3/4 time, inspired by Viennese style
    const buffer = this.createBuffer(8.0, (data, sampleRate, length) => {
      const bpm = 140;
      const beatDur = 60 / bpm;
      // Waltz melody in G major
      const melody = [
        392, 440, 494, 587, 494, 440,  // G4 A4 B4 D5 B4 A4
        392, 494, 587, 659, 587, 494,  // G4 B4 D5 E5 D5 B4
        523, 587, 659, 784, 659, 587,  // C5 D5 E5 G5 E5 D5
        494, 440, 392, 494, 440, 392,  // B4 A4 G4 B4 A4 G4
      ];
      const bass = [196, 247, 294, 196, 247, 294, 262, 330, 294, 196, 247, 294];
      const noteDur = beatDur * 0.8;

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos) % melody.length;
        const bassIdx = Math.floor(beatPos / 2) % bass.length;
        const notePhase = (beatPos % 1);

        // Melody: bright square-ish wave with envelope
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.05 ? notePhase / 0.05 : Math.max(0, 1 - (notePhase - 0.05) / 0.75);
        const mWave = Math.sin(2 * Math.PI * mFreq * t) * 0.6 +
                      Math.sin(4 * Math.PI * mFreq * t) * 0.25 +
                      Math.sin(6 * Math.PI * mFreq * t) * 0.15;

        // Bass: waltz oom-pah-pah pattern
        const bFreq = bass[bassIdx];
        const waltzBeat = Math.floor(beatPos) % 3;
        const bEnv = waltzBeat === 0 ? mEnv * 1.0 : mEnv * 0.6;
        const bWave = Math.sin(2 * Math.PI * bFreq * t);

        data[i] = (mWave * mEnv * 0.15 + bWave * bEnv * 0.08);
      }
    });
    this.addSoundToScene('music_vienna', buffer);
  }

  generateForestMusic() {
    // Mysterious, whimsical melody with minor key and arpeggios
    const buffer = this.createBuffer(8.0, (data, sampleRate, length) => {
      const bpm = 100;
      const beatDur = 60 / bpm;
      // E minor mysterious melody
      const melody = [
        330, 370, 415, 494, 415, 370,  // E4 F#4 G#4 B4 G#4 F#4
        330, 294, 262, 294, 330, 370,  // E4 D4 C4 D4 E4 F#4
        415, 494, 554, 494, 415, 370,  // G#4 B4 C#5 B4 G#4 F#4
        330, 262, 247, 262, 294, 330,  // E4 C4 B3 C4 D4 E4
      ];
      // Arpeggiated bass pattern
      const arp = [165, 208, 247, 330, 247, 208, 165, 208, 247, 330, 294, 247];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos * 0.75) % melody.length;
        const arpIdx = Math.floor(beatPos * 2) % arp.length;
        const notePhase = (beatPos % 1);

        // Melody: soft triangle-like wave
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.03 ? notePhase / 0.03 : Math.max(0, 1 - (notePhase - 0.03) / 0.9);
        const mWave = Math.sin(2 * Math.PI * mFreq * t) * 0.8 +
                      Math.sin(3 * Math.PI * mFreq * t) * 0.15 +
                      Math.sin(5 * Math.PI * mFreq * t) * 0.05;

        // Arpeggio: plucky short notes
        const aFreq = arp[arpIdx];
        const arpPhase = (beatPos * 2) % 1;
        const aEnv = arpPhase < 0.02 ? arpPhase / 0.02 : Math.max(0, 1 - arpPhase / 0.3);
        const aWave = Math.sin(2 * Math.PI * aFreq * t);

        // Add subtle vibrato to melody
        const vibrato = Math.sin(2 * Math.PI * 5 * t) * 0.002;
        const mWaveVib = Math.sin(2 * Math.PI * (mFreq + mFreq * vibrato) * t) * 0.8;

        data[i] = (mWaveVib * mEnv * 0.12 + aWave * aEnv * 0.08);
      }
    });
    this.addSoundToScene('music_forest', buffer);
  }

  generatePalaceMusic() {
    // Dramatic, building intensity with staccato and fanfare elements
    const buffer = this.createBuffer(8.0, (data, sampleRate, length) => {
      const bpm = 120;
      const beatDur = 60 / bpm;
      // D minor dramatic melody
      const melody = [
        294, 349, 440, 523, 440, 349,  // D4 F4 A4 C5 A4 F4
        294, 330, 392, 494, 440, 392,  // D4 E4 G4 B4 A4 G4
        349, 440, 523, 587, 523, 440,  // F4 A4 C5 D5 C5 A4
        587, 523, 440, 349, 330, 294,  // D5 C5 A4 F4 E4 D4
      ];
      const bass = [147, 175, 220, 147, 165, 196, 175, 220, 262, 147, 165, 147];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos) % melody.length;
        const bassIdx = Math.floor(beatPos / 1.5) % bass.length;
        const notePhase = (beatPos % 1);

        // Melody: rich harmonics, staccato
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.02 ? notePhase / 0.02 :
                     notePhase < 0.5 ? 1.0 : Math.max(0, 1 - (notePhase - 0.5) / 0.3);
        const mWave = Math.sin(2 * Math.PI * mFreq * t) * 0.5 +
                      Math.sin(4 * Math.PI * mFreq * t) * 0.3 +
                      Math.sin(6 * Math.PI * mFreq * t) * 0.15 +
                      Math.sin(8 * Math.PI * mFreq * t) * 0.05;

        // Bass: strong octave hits
        const bFreq = bass[bassIdx];
        const bPhase = (beatPos / 1.5) % 1;
        const bEnv = bPhase < 0.02 ? bPhase / 0.02 : Math.max(0, 1 - bPhase / 0.6);
        const bWave = Math.sin(2 * Math.PI * bFreq * t) * 0.7 +
                      Math.sin(2 * Math.PI * bFreq * 2 * t) * 0.3;

        // Build intensity over time
        const intensity = 0.7 + 0.3 * (i / length);

        data[i] = (mWave * mEnv * 0.13 + bWave * bEnv * 0.09) * intensity;
      }
    });
    this.addSoundToScene('music_palace', buffer);
  }

  generateBossMusic() {
    // Fast-paced, tense, driving rhythm
    const buffer = this.createBuffer(6.0, (data, sampleRate, length) => {
      const bpm = 170;
      const beatDur = 60 / bpm;
      // A minor aggressive pattern
      const melody = [
        440, 523, 659, 523, 440, 392,  // A4 C5 E5 C5 A4 G4
        440, 494, 587, 659, 587, 494,  // A4 B4 D5 E5 D5 B4
        523, 659, 784, 659, 523, 440,  // C5 E5 G5 E5 C5 A4
        392, 440, 523, 587, 523, 440,  // G4 A4 C5 D5 C5 A4
      ];
      const bass = [110, 131, 165, 110, 147, 165, 131, 165, 196, 110, 131, 110];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos * 1.5) % melody.length;
        const bassIdx = Math.floor(beatPos) % bass.length;
        const notePhase = (beatPos * 1.5) % 1;

        // Melody: aggressive saw-like wave
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.01 ? notePhase / 0.01 : Math.max(0, 1 - notePhase / 0.6);
        let mWave = 0;
        for (let h = 1; h <= 6; h++) {
          mWave += Math.sin(2 * Math.PI * mFreq * h * t) / h;
        }

        // Driving bass with fast pulse
        const bFreq = bass[bassIdx];
        const bPhase = (beatPos) % 1;
        const bEnv = bPhase < 0.01 ? bPhase / 0.01 : Math.max(0, 1 - bPhase / 0.4);
        const bWave = Math.sin(2 * Math.PI * bFreq * t) * 0.6 +
                      Math.sin(4 * Math.PI * bFreq * t) * 0.4;

        // Percussion: kick-like thump on every beat
        const percPhase = beatPos % 1;
        const percEnv = percPhase < 0.05 ? 1 - percPhase / 0.05 : 0;
        const percFreq = 80 - 60 * percPhase;
        const perc = Math.sin(2 * Math.PI * percFreq * t) * percEnv;

        data[i] = (mWave * mEnv * 0.1 + bWave * bEnv * 0.1 + perc * 0.08);
      }
    });
    this.addSoundToScene('music_boss', buffer);
  }

  generateConcertMusic() {
    // Full triumphant arrangement, major key, celebratory
    const buffer = this.createBuffer(10.0, (data, sampleRate, length) => {
      const bpm = 130;
      const beatDur = 60 / bpm;
      // C major triumphant fanfare
      const melody = [
        523, 587, 659, 784, 659, 784,  // C5 D5 E5 G5 E5 G5
        880, 784, 659, 587, 523, 587,  // A5 G5 E5 D5 C5 D5
        659, 784, 880, 1047, 880, 784, // E5 G5 A5 C6 A5 G5
        784, 659, 587, 523, 587, 659,  // G5 E5 D5 C5 D5 E5
      ];
      const harmony = [
        262, 330, 392, 262, 330, 392,  // C4 E4 G4
        349, 440, 523, 349, 440, 523,  // F4 A4 C5
        392, 494, 587, 392, 494, 587,  // G4 B4 D5
        262, 330, 392, 262, 330, 392,  // C4 E4 G4
      ];
      const bass = [131, 131, 175, 175, 196, 196, 131, 131, 165, 165, 196, 131];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos) % melody.length;
        const harmIdx = Math.floor(beatPos) % harmony.length;
        const bassIdx = Math.floor(beatPos / 2) % bass.length;
        const notePhase = beatPos % 1;

        // Melody: bright, full sound
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.02 ? notePhase / 0.02 :
                     notePhase < 0.7 ? 1.0 : Math.max(0, 1 - (notePhase - 0.7) / 0.3);
        const mWave = Math.sin(2 * Math.PI * mFreq * t) * 0.5 +
                      Math.sin(4 * Math.PI * mFreq * t) * 0.3 +
                      Math.sin(6 * Math.PI * mFreq * t) * 0.2;

        // Harmony: sustained chords
        const hFreq = harmony[harmIdx];
        const hEnv = mEnv * 0.7;
        const hWave = Math.sin(2 * Math.PI * hFreq * t) * 0.7 +
                      Math.sin(3 * Math.PI * hFreq * t) * 0.3;

        // Bass: strong root notes
        const bFreq = bass[bassIdx];
        const bPhase = (beatPos / 2) % 1;
        const bEnv = bPhase < 0.02 ? bPhase / 0.02 : Math.max(0, 1 - bPhase / 0.8);
        const bWave = Math.sin(2 * Math.PI * bFreq * t);

        // Gradual crescendo
        const crescendo = 0.6 + 0.4 * (i / length);

        data[i] = (mWave * mEnv * 0.1 + hWave * hEnv * 0.06 + bWave * bEnv * 0.07) * crescendo;
      }
    });
    this.addSoundToScene('music_concert', buffer);
  }

  generateRhythmMusic() {
    // Upbeat rhythmic backing track for the rhythm mini-game
    const buffer = this.createBuffer(12.0, (data, sampleRate, length) => {
      const bpm = 130;
      const beatDur = 60 / bpm;

      // Catchy rhythm pattern in C major with strong beat
      const melody = [
        523, 587, 659, 784, 659, 587, 523, 494,  // C5 D5 E5 G5 E5 D5 C5 B4
        440, 494, 523, 587, 659, 587, 523, 494,  // A4 B4 C5 D5 E5 D5 C5 B4
        392, 440, 494, 523, 587, 523, 494, 440,  // G4 A4 B4 C5 D5 C5 B4 A4
        523, 659, 784, 880, 784, 659, 523, 587,  // C5 E5 G5 A5 G5 E5 C5 D5
      ];
      const bass = [131, 165, 196, 220, 196, 165, 131, 165, 175, 220, 262, 175];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beatPos = t / beatDur;
        const melodyIdx = Math.floor(beatPos * 2) % melody.length;
        const bassIdx = Math.floor(beatPos) % bass.length;
        const notePhase = (beatPos * 2) % 1;

        // Melody: bright staccato
        const mFreq = melody[melodyIdx];
        const mEnv = notePhase < 0.02 ? notePhase / 0.02 :
                     notePhase < 0.4 ? 1.0 : Math.max(0, 1 - (notePhase - 0.4) / 0.3);
        const mWave = Math.sin(2 * Math.PI * mFreq * t) * 0.5 +
                      Math.sin(4 * Math.PI * mFreq * t) * 0.3 +
                      Math.sin(6 * Math.PI * mFreq * t) * 0.2;

        // Bass: steady pulse
        const bFreq = bass[bassIdx];
        const bPhase = beatPos % 1;
        const bEnv = bPhase < 0.02 ? bPhase / 0.02 : Math.max(0, 1 - bPhase / 0.5);
        const bWave = Math.sin(2 * Math.PI * bFreq * t) * 0.7 +
                      Math.sin(2 * Math.PI * bFreq * 2 * t) * 0.3;

        // Percussion: kick on beat, hi-hat on off-beat
        const percPhase = beatPos % 1;
        const kickEnv = percPhase < 0.05 ? 1 - percPhase / 0.05 : 0;
        const kickFreq = 80 - 50 * percPhase;
        const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv;

        const hihatPhase = (beatPos + 0.5) % 1;
        const hihatEnv = hihatPhase < 0.03 ? 1 - hihatPhase / 0.03 : 0;
        const hihat = (Math.random() * 2 - 1) * hihatEnv * 0.3;

        data[i] = (mWave * mEnv * 0.1 + bWave * bEnv * 0.08 + kick * 0.07 + hihat * 0.04);
      }
    });
    this.addSoundToScene('music_rhythm', buffer);
  }

  generateCompositionNotes() {
    // Generate individual note sounds for MIDI notes used in melodies
    // Covers range from MIDI 58 (Bb3) to MIDI 74 (D5)
    for (let midi = 58; midi <= 74; midi++) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const buffer = this.createBuffer(0.4, (data, sampleRate, length) => {
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Bell-like envelope: quick attack, slow decay
          const attack = Math.min(1, i / (sampleRate * 0.01));
          const decay = Math.max(0, 1 - i / (length * 0.7));
          const envelope = attack * decay;
          // Rich tone with harmonics (piano-like)
          const wave = Math.sin(2 * Math.PI * freq * t) * 0.6 +
                       Math.sin(4 * Math.PI * freq * t) * 0.25 +
                       Math.sin(6 * Math.PI * freq * t) * 0.1 +
                       Math.sin(8 * Math.PI * freq * t) * 0.05;
          data[i] = wave * envelope * 0.3;
        }
      });
      this.addSoundToScene(`composition_note_${midi}`, buffer);
    }
  }

  generateDissonanceSound() {
    const buffer = this.createBuffer(0.5, (data, sampleRate, length) => {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.max(0, 1 - i / length);
        // Clashing frequencies for dissonant sound
        const wave = Math.sin(2 * Math.PI * 277 * t) * 0.3 +
                     Math.sin(2 * Math.PI * 293 * t) * 0.3 +
                     Math.sin(2 * Math.PI * 311 * t) * 0.2 +
                     (Math.random() * 0.2 - 0.1);
        data[i] = wave * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_dissonance', buffer);
  }

  generateChordConsonant() {
    // Consonant C major chord sound for successful chord door unlock
    const buffer = this.createBuffer(1.0, (data, sampleRate, length) => {
      const freqs = [261.63, 329.63, 392.00]; // C4, E4, G4
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const attack = Math.min(1, i / (sampleRate * 0.02));
        const decay = Math.max(0, 1 - i / (length * 0.8));
        const envelope = attack * decay;
        let wave = 0;
        freqs.forEach(freq => {
          wave += Math.sin(2 * Math.PI * freq * t) * 0.5 +
                  Math.sin(4 * Math.PI * freq * t) * 0.2;
        });
        data[i] = wave / freqs.length * envelope * 0.25;
      }
    });
    this.addSoundToScene('sfx_chordConsonant', buffer);
  }

  generateChordDissonant() {
    // Dissonant chord sound for failed chord door attempt
    const buffer = this.createBuffer(0.6, (data, sampleRate, length) => {
      const freqs = [261.63, 277.18, 293.66]; // C4, C#4, D4 — clashing semitones
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const envelope = Math.max(0, 1 - i / length);
        let wave = 0;
        freqs.forEach(freq => {
          wave += Math.sin(2 * Math.PI * freq * t) * 0.4 +
                  Math.sin(3 * Math.PI * freq * t) * 0.2;
        });
        wave += (Math.random() * 0.15 - 0.075);
        data[i] = wave / freqs.length * envelope * 0.2;
      }
    });
    this.addSoundToScene('sfx_chordDissonant', buffer);
  }
}
