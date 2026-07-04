/**
 * Mozart Chiptune Soundtracks
 *
 * Authentic chiptune/8-bit arrangements of real Mozart compositions using
 * Web Audio API oscillators. Each level gets a unique piece with looping
 * playback and boss-fight tempo intensification.
 *
 * Pieces:
 *  Level 1: Eine kleine Nachtmusik K.525 (1st mvt allegro)
 *  Level 2: The Magic Flute overture K.620
 *  Level 3: Piano Sonata No.11 'Alla Turca' K.331 (3rd mvt)
 *  Level 4: Marriage of Figaro overture K.492
 *  Level 5: Symphony No.40 in G minor K.550 (1st mvt)
 *  Level 6: Lacrimosa from Requiem K.626
 *  Level 7: Jupiter Symphony K.551 (4th mvt fugue)
 *  Menu: Medley/overture combining themes
 */
export class MozartSoundtracks {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isBossMode = false;
    this.scheduledNotes = [];
    this.loopTimeout = null;
    this.currentTrack = null;
    this.tempoMultiplier = 1.0;
  }

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Start playing the specified track.
   * @param {string} trackName - One of: menu, level1..level7
   */
  play(trackName) {
    if (!this.audioContext) this.init();
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.stop();
    this.currentTrack = trackName;
    this.isPlaying = true;
    this.isBossMode = false;
    this.tempoMultiplier = 1.0;
    this.scheduleTrack(trackName);
  }

  /**
   * Switch to intensified boss variation of current track.
   */
  setBossMode(enabled) {
    if (this.isBossMode === enabled) return;
    this.isBossMode = enabled;
    this.tempoMultiplier = enabled ? 1.4 : 1.0;
    // Restart with new tempo
    if (this.isPlaying && this.currentTrack) {
      this.stopScheduled();
      this.scheduleTrack(this.currentTrack);
    }
  }

  stop() {
    this.isPlaying = false;
    this.stopScheduled();
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value, this.audioContext.currentTime
      );
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }
  }

  destroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
  }

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.audioContext.currentTime);
    }
  }

  // --- Private ---

  stopScheduled() {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    this.scheduledNotes.forEach(osc => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    });
    this.scheduledNotes = [];
  }

  scheduleTrack(trackName) {
    const track = this.getTrack(trackName);
    if (!track) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime + 0.05;
    const tempo = this.tempoMultiplier;
    const bossOctaveShift = this.isBossMode ? 1.0 : 0;

    // Schedule melody
    track.melody.forEach(note => {
      if (!note || note.freq === 0 || !note.duration) return;
      const freq = note.freq * (bossOctaveShift ? 1.0 : 1.0);
      const start = now + note.time / tempo;
      const dur = note.duration / tempo;
      this.playNote(freq, start, dur, 'square', 0.18);
    });

    // Schedule bass if present
    if (track.bass) {
      track.bass.forEach(note => {
        if (!note || note.freq === 0 || !note.duration) return;
        const start = now + note.time / tempo;
        const dur = note.duration / tempo;
        this.playNote(note.freq, start, dur, 'triangle', 0.12);
      });
    }

    // Schedule harmony if present
    if (track.harmony) {
      track.harmony.forEach(note => {
        if (!note || note.freq === 0 || !note.duration) return;
        const start = now + note.time / tempo;
        const dur = note.duration / tempo;
        this.playNote(note.freq, start, dur, 'triangle', 0.08);
      });
    }

    // Loop
    const trackDuration = (track.duration || 10) / tempo;
    this.loopTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.scheduledNotes = this.scheduledNotes.filter(osc => {
          try { osc.stop(); } catch (e) { /* ok */ }
          return false;
        });
        this.scheduleTrack(trackName);
      }
    }, trackDuration * 1000);
  }

  playNote(freq, startTime, duration, waveType, volume) {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    // Chiptune envelope: fast attack, sustain, quick release
    const attack = 0.008;
    const release = Math.min(0.05, duration * 0.2);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.setValueAtTime(volume, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    this.scheduledNotes.push(osc);

    // Cleanup refs
    if (this.scheduledNotes.length > 200) {
      this.scheduledNotes = this.scheduledNotes.slice(-100);
    }
  }

  // --- Note frequency helpers ---
  // Standard pitch: A4 = 440Hz
  static NOTE = {
    C3: 131, D3: 147, Eb3: 156, E3: 165, F3: 175, Fs3: 185, G3: 196, Ab3: 208, A3: 220, Bb3: 233, B3: 247,
    C4: 262, Cs4: 277, D4: 294, Ds4: 311, Eb4: 311, E4: 330, F4: 349, Fs4: 370, G4: 392, Gs4: 415, Ab4: 415, A4: 440, Bb4: 466, B4: 494,
    C5: 523, Cs5: 554, D5: 587, Ds5: 622, Eb5: 622, E5: 659, F5: 698, Fs5: 740, G5: 784, Gs5: 831, Ab5: 831, A5: 880, Bb5: 932, B5: 988,
    C6: 1047, D6: 1175, E6: 1319, F6: 1397, G6: 1568,
  };

  getTrack(name) {
    const tracks = {
      menu: this.getMenuTrack(),
      level1: this.getLevel1Track(),
      level2: this.getLevel2Track(),
      level3: this.getLevel3Track(),
      level4: this.getLevel4Track(),
      level5: this.getLevel5Track(),
      level6: this.getLevel6Track(),
      level7: this.getLevel7Track(),
    };
    return tracks[name] || null;
  }

  /**
   * Level 1: Eine kleine Nachtmusik K.525 - 1st movement Allegro
   * Famous opening: G-D G-D G-B-D | D-A D-A D-F#-A
   */
  getLevel1Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 140;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    let t = 0;

    // Opening theme - iconic rhythmic motif
    const melodyNotes = [
      // Bar 1: G4-D4 G4-D4 G4-B4-D5 (dotted rhythm)
      { f: N.G4, d: beat * 0.5 }, { f: 0, d: beat * 0.15 },
      { f: N.D4, d: beat * 0.35 },
      { f: N.G4, d: beat * 0.5 }, { f: 0, d: beat * 0.15 },
      { f: N.D4, d: beat * 0.35 },
      { f: N.G4, d: beat * 0.25 }, { f: N.B4, d: beat * 0.25 }, { f: N.D5, d: beat * 0.5 },
      // Bar 2: D5-A4 D5-A4 D5-Fs5-A5
      { f: N.D5, d: beat * 0.5 }, { f: 0, d: beat * 0.15 },
      { f: N.A4, d: beat * 0.35 },
      { f: N.D5, d: beat * 0.5 }, { f: 0, d: beat * 0.15 },
      { f: N.A4, d: beat * 0.35 },
      { f: N.D5, d: beat * 0.25 }, { f: N.Fs4, d: beat * 0.25 }, { f: N.A4, d: beat * 0.5 },
      // Bar 3-4: scalar passage G4-A4-B4-C5-D5-E5-Fs5-G5
      { f: N.G4, d: beat * 0.25 }, { f: N.A4, d: beat * 0.25 },
      { f: N.B4, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.25 }, { f: N.E5, d: beat * 0.25 },
      { f: N.Fs5, d: beat * 0.25 }, { f: N.G5, d: beat * 0.75 },
      // Bar 5-6: descending sequence
      { f: N.G5, d: beat * 0.25 }, { f: N.Fs5, d: beat * 0.25 },
      { f: N.E5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.C5, d: beat * 0.5 }, { f: N.B4, d: beat * 0.5 },
      { f: N.A4, d: beat * 0.5 }, { f: N.G4, d: beat * 1.0 },
    ];

    for (const note of melodyNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.9 });
      t += note.d;
    }

    // Bass line
    let bt = 0;
    const bassNotes = [
      { f: N.G3, d: beat * 2 }, { f: N.D3, d: beat * 2 },
      { f: N.G3, d: beat * 2 }, { f: N.D3, d: beat * 2 },
      { f: N.G3, d: beat }, { f: N.A3, d: beat },
      { f: N.B3, d: beat }, { f: N.C4, d: beat },
      { f: N.D4, d: beat * 2 }, { f: N.G3, d: beat * 2 },
    ];
    for (const note of bassNotes) {
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.8 });
      bt += note.d;
    }

    return { melody, bass, duration: t };
  }

  /**
   * Level 2: The Magic Flute overture K.620
   * Opens with three solemn chords then allegro fugal theme
   */
  getLevel2Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 130;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    const harmony = [];
    let t = 0;

    // Three solemn opening chords (Eb major)
    const chords = [
      { notes: [N.Eb4, N.G4, N.Bb4], d: beat * 1.5 },
      { notes: [N.Eb4, N.G4, N.Bb4], d: beat * 1.5 },
      { notes: [N.Eb4, N.G4, N.Bb4], d: beat * 1.5 },
    ];
    for (const chord of chords) {
      melody.push({ freq: chord.notes[2], time: t, duration: chord.d * 0.8 });
      harmony.push({ freq: chord.notes[0], time: t, duration: chord.d * 0.8 });
      bass.push({ freq: N.Eb3, time: t, duration: chord.d * 0.8 });
      t += chord.d + beat * 0.5;
    }

    // Allegro fugal theme in Eb
    const allegroNotes = [
      { f: N.Eb4, d: beat * 0.25 }, { f: N.F4, d: beat * 0.25 },
      { f: N.G4, d: beat * 0.25 }, { f: N.Ab4, d: beat * 0.25 },
      { f: N.Bb4, d: beat * 0.5 }, { f: N.G4, d: beat * 0.25 },
      { f: N.Eb5, d: beat * 0.5 }, { f: N.D5, d: beat * 0.25 },
      { f: N.C5, d: beat * 0.25 }, { f: N.Bb4, d: beat * 0.25 },
      { f: N.Ab4, d: beat * 0.25 }, { f: N.G4, d: beat * 0.5 },
      { f: N.F4, d: beat * 0.25 }, { f: N.Eb4, d: beat * 0.5 },
      // Second phrase
      { f: N.Bb4, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.25 }, { f: N.Eb5, d: beat * 0.5 },
      { f: N.D5, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.Bb4, d: beat * 0.5 }, { f: N.Ab4, d: beat * 0.25 },
      { f: N.G4, d: beat * 0.25 }, { f: N.F4, d: beat * 0.25 },
      { f: N.Eb4, d: beat * 0.75 },
    ];

    for (const note of allegroNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Bass line for allegro section
    let bt = chords.length * (beat * 2);
    const bassPat = [
      { f: N.Eb3, d: beat }, { f: N.Bb3, d: beat * 0.5 }, { f: N.Eb3, d: beat * 0.5 },
      { f: N.Ab3, d: beat }, { f: N.Eb3, d: beat },
      { f: N.Bb3, d: beat }, { f: N.G3, d: beat * 0.5 }, { f: N.Eb3, d: beat * 0.5 },
      { f: N.Ab3, d: beat }, { f: N.Bb3, d: beat }, { f: N.Eb3, d: beat },
    ];
    for (const note of bassPat) {
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.7 });
      bt += note.d;
    }

    return { melody, bass, harmony, duration: t };
  }

  /**
   * Level 3: Piano Sonata No.11 'Alla Turca' K.331 - 3rd movement Rondo
   * Famous A minor presto theme
   */
  getLevel3Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 160;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    let t = 0;

    // Alla Turca main theme
    const melodyNotes = [
      // Pickup + Bar 1: B4-A4-Gs4-A4 C5
      { f: N.B4, d: beat * 0.25 }, { f: N.A4, d: beat * 0.25 },
      { f: N.Gs4, d: beat * 0.25 }, { f: N.A4, d: beat * 0.25 },
      { f: N.C5, d: beat * 0.5 },
      // Bar 2: D5-C5-B4-C5 E5
      { f: N.D5, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.B4, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.E5, d: beat * 0.5 },
      // Bar 3: F5-E5-Ds5-E5 B5-A5-Gs5-A5-B5-A5-Gs5-A5-C6
      { f: N.F5, d: beat * 0.25 }, { f: N.E5, d: beat * 0.25 },
      { f: N.Ds5, d: beat * 0.25 }, { f: N.E5, d: beat * 0.25 },
      // Fast scalar run (simplified)
      { f: N.B5, d: beat * 0.2 }, { f: N.A5, d: beat * 0.2 },
      { f: N.Gs5, d: beat * 0.2 }, { f: N.A5, d: beat * 0.2 },
      { f: N.C6, d: beat * 0.5 },
      // Descending resolution
      { f: N.A5, d: beat * 0.25 }, { f: N.G5, d: beat * 0.25 },
      { f: N.F5, d: beat * 0.25 }, { f: N.E5, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.B4, d: beat * 0.25 }, { f: N.A4, d: beat * 0.75 },
    ];

    for (const note of melodyNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Left hand bass pattern (Alberti-style)
    let bt = 0;
    const bassPat = [
      { f: N.A3, d: beat * 0.25 }, { f: N.E3, d: beat * 0.25 },
      { f: N.A3, d: beat * 0.25 }, { f: N.E3, d: beat * 0.25 },
      { f: N.A3, d: beat * 0.25 }, { f: N.E3, d: beat * 0.25 },
      { f: N.A3, d: beat * 0.25 }, { f: N.E3, d: beat * 0.25 },
      { f: N.D3, d: beat * 0.25 }, { f: N.A3, d: beat * 0.25 },
      { f: N.D3, d: beat * 0.25 }, { f: N.A3, d: beat * 0.25 },
      { f: N.E3, d: beat * 0.25 }, { f: N.B3, d: beat * 0.25 },
      { f: N.E3, d: beat * 0.25 }, { f: N.B3, d: beat * 0.25 },
      { f: N.A3, d: beat * 0.5 }, { f: N.E3, d: beat * 0.5 },
      { f: N.A3, d: beat * 0.5 }, { f: N.E3, d: beat * 0.5 },
    ];
    for (const note of bassPat) {
      if (bt >= t) break;
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.7 });
      bt += note.d;
    }

    return { melody, bass, duration: t };
  }

  /**
   * Level 4: Marriage of Figaro overture K.492
   * Presto opening in D major - rapid scalar runs
   */
  getLevel4Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 168;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    let t = 0;

    // Figaro presto - rapid whispering theme
    const melodyNotes = [
      // Opening rapid piano figure
      { f: N.D4, d: beat * 0.2 }, { f: N.E4, d: beat * 0.2 },
      { f: N.Fs4, d: beat * 0.2 }, { f: N.G4, d: beat * 0.2 },
      { f: N.A4, d: beat * 0.2 },
      { f: N.D5, d: beat * 0.4 }, { f: 0, d: beat * 0.2 },
      // Repeat up octave
      { f: N.D5, d: beat * 0.2 }, { f: N.E5, d: beat * 0.2 },
      { f: N.Fs5, d: beat * 0.2 }, { f: N.G5, d: beat * 0.2 },
      { f: N.A5, d: beat * 0.3 },
      { f: N.D5, d: beat * 0.4 }, { f: 0, d: beat * 0.2 },
      // Scalar descent
      { f: N.A5, d: beat * 0.2 }, { f: N.G5, d: beat * 0.2 },
      { f: N.Fs5, d: beat * 0.2 }, { f: N.E5, d: beat * 0.2 },
      { f: N.D5, d: beat * 0.2 }, { f: N.C5, d: beat * 0.2 },
      { f: N.B4, d: beat * 0.2 }, { f: N.A4, d: beat * 0.4 },
      // Tutti response
      { f: N.D5, d: beat * 0.5 }, { f: N.Fs5, d: beat * 0.5 },
      { f: N.A5, d: beat * 0.5 }, { f: N.D5, d: beat * 0.3 },
      { f: N.A4, d: beat * 0.3 }, { f: N.D4, d: beat * 0.6 },
    ];

    for (const note of melodyNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Bass: strong downbeats
    let bt = 0;
    const bassPat = [
      { f: N.D3, d: beat * 1.0 }, { f: N.A3, d: beat * 0.5 },
      { f: N.D3, d: beat * 0.5 }, { f: N.G3, d: beat * 1.0 },
      { f: N.D3, d: beat * 1.0 }, { f: N.A3, d: beat * 0.5 },
      { f: N.Fs3, d: beat * 0.5 }, { f: N.D3, d: beat * 1.0 },
      { f: N.A3, d: beat * 0.5 }, { f: N.D3, d: beat * 1.0 },
    ];
    for (const note of bassPat) {
      if (bt >= t) break;
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.7 });
      bt += note.d;
    }

    return { melody, bass, duration: t };
  }

  /**
   * Level 5: Symphony No.40 in G minor K.550 - 1st movement
   * Iconic anxious repeated-note theme in G minor
   */
  getLevel5Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 132;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    const harmony = [];
    let t = 0;

    // Famous opening: repeated Eb-D motif with rising line
    const melodyNotes = [
      // Anacrusis + Bar 1: Eb5-D5 | Eb5-D5 | D5---
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.75 },
      // Bar 2: Eb5-D5 | Eb5-D5 | Bb4---
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.Bb4, d: beat * 0.75 },
      // Bar 3-4: rising sequence D5-C5-D5-Eb5-F5
      { f: N.D5, d: beat * 0.25 }, { f: N.C5, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.25 }, { f: N.Eb5, d: beat * 0.25 },
      { f: N.F5, d: beat * 0.75 },
      // Bar 5: F5-Eb5-F5-G5 Ab5
      { f: N.F5, d: beat * 0.25 }, { f: N.Eb5, d: beat * 0.25 },
      { f: N.F5, d: beat * 0.25 }, { f: N.G5, d: beat * 0.25 },
      { f: N.Ab5, d: beat * 0.75 },
      // Bar 6-7: descending answer
      { f: N.Ab5, d: beat * 0.25 }, { f: N.G5, d: beat * 0.25 },
      { f: N.F5, d: beat * 0.25 }, { f: N.Eb5, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.5 }, { f: N.C5, d: beat * 0.5 },
      { f: N.Bb4, d: beat * 0.5 }, { f: N.A4, d: beat * 0.25 },
      { f: N.G4, d: beat * 0.75 },
    ];

    for (const note of melodyNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.9 });
      t += note.d;
    }

    // Pulsing accompaniment (famous repeated 8th notes)
    let bt = 0;
    const stepDur = beat * 0.25;
    const accompNotes = [N.Bb4, N.Bb4, N.Bb4, N.Bb4, N.A4, N.A4, N.A4, N.A4,
      N.G4, N.G4, N.G4, N.G4, N.Fs4, N.Fs4, N.Fs4, N.Fs4,
      N.G4, N.G4, N.G4, N.G4, N.Ab4, N.Ab4, N.Ab4, N.Ab4,
      N.G4, N.G4, N.F4, N.F4, N.Eb4, N.Eb4, N.D4, N.D4];
    for (const freq of accompNotes) {
      if (bt >= t) break;
      harmony.push({ freq, time: bt, duration: stepDur * 0.6 });
      bt += stepDur;
    }

    // Bass
    let bbt = 0;
    const bassPat = [
      { f: N.G3, d: beat * 2 }, { f: N.D3, d: beat * 2 },
      { f: N.Eb3, d: beat * 2 }, { f: N.F3, d: beat * 1 },
      { f: N.G3, d: beat * 1 }, { f: N.D3, d: beat * 2 },
      { f: N.G3, d: beat * 2 },
    ];
    for (const note of bassPat) {
      if (bbt >= t) break;
      bass.push({ freq: note.f, time: bbt, duration: note.d * 0.8 });
      bbt += note.d;
    }

    return { melody, bass, harmony, duration: t };
  }

  /**
   * Level 6: Lacrimosa from Requiem K.626
   * Descending chromatic melody in D minor, 12/8 feel
   */
  getLevel6Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 72;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    const harmony = [];
    let t = 0;

    // Lacrimosa descending theme (simplified from choral parts)
    const melodyNotes = [
      // "La-cri-mo-sa" descending line
      { f: N.D5, d: beat * 0.67 }, { f: N.Cs5, d: beat * 0.33 },
      { f: N.D5, d: beat * 0.5 }, { f: N.E5, d: beat * 0.5 },
      { f: N.F5, d: beat * 1.0 },
      // Continuing descent
      { f: N.E5, d: beat * 0.67 }, { f: N.D5, d: beat * 0.33 },
      { f: N.Cs5, d: beat * 0.5 }, { f: N.D5, d: beat * 0.5 },
      { f: N.Bb4, d: beat * 1.0 },
      // Further descent with chromatic coloring
      { f: N.A4, d: beat * 0.67 }, { f: N.G4, d: beat * 0.33 },
      { f: N.F4, d: beat * 0.5 }, { f: N.E4, d: beat * 0.5 },
      { f: N.D4, d: beat * 1.5 },
      // Rising sigh motif
      { f: N.A4, d: beat * 0.5 }, { f: N.Bb4, d: beat * 1.0 },
      { f: N.A4, d: beat * 0.5 }, { f: N.G4, d: beat * 0.5 },
      { f: N.F4, d: beat * 0.5 }, { f: N.E4, d: beat * 0.5 },
      { f: N.D4, d: beat * 1.5 },
    ];

    for (const note of melodyNotes) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.9 });
      t += note.d;
    }

    // Sustained chords beneath
    let ht = 0;
    const harmPat = [
      { f: N.F4, d: beat * 2 }, { f: N.E4, d: beat * 2 },
      { f: N.D4, d: beat * 2 }, { f: N.Cs4, d: beat * 2 },
      { f: N.D4, d: beat * 2 }, { f: N.Bb3, d: beat * 2 },
    ];
    for (const note of harmPat) {
      if (ht >= t) break;
      harmony.push({ freq: note.f, time: ht, duration: note.d * 0.85 });
      ht += note.d;
    }

    // Deep bass
    let bt = 0;
    const bassPat = [
      { f: N.D3, d: beat * 2 }, { f: N.A3, d: beat * 2 },
      { f: N.Bb3, d: beat * 2 }, { f: N.G3, d: beat * 2 },
      { f: N.D3, d: beat * 2 }, { f: N.A3, d: beat * 1 },
      { f: N.D3, d: beat * 2 },
    ];
    for (const note of bassPat) {
      if (bt >= t) break;
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.8 });
      bt += note.d;
    }

    return { melody, bass, harmony, duration: t };
  }

  /**
   * Level 7: Jupiter Symphony K.551 - 4th movement fugue subject
   * The famous C-D-F-E subject
   */
  getLevel7Track() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 144;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    const harmony = [];
    let t = 0;

    // Jupiter fugue subject: C-D-F-E (whole notes in the original)
    // Presented in stretto (overlapping entries) for richness
    const subject = [
      { f: N.C5, d: beat * 1.0 }, { f: N.D5, d: beat * 1.0 },
      { f: N.F5, d: beat * 1.0 }, { f: N.E5, d: beat * 1.0 },
    ];

    // First entry (soprano)
    for (const note of subject) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.9 });
      t += note.d;
    }

    // Continuation: countersubject-like scalar passage
    const continuation = [
      { f: N.G5, d: beat * 0.5 }, { f: N.F5, d: beat * 0.5 },
      { f: N.E5, d: beat * 0.5 }, { f: N.D5, d: beat * 0.5 },
      { f: N.C5, d: beat * 0.5 }, { f: N.B4, d: beat * 0.5 },
      { f: N.A4, d: beat * 0.5 }, { f: N.G4, d: beat * 0.5 },
    ];
    for (const note of continuation) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Second subject entry (alto) starting at beat 4
    let ht = beat * 4;
    const altoSubject = [
      { f: N.G4, d: beat * 1.0 }, { f: N.A4, d: beat * 1.0 },
      { f: N.C5, d: beat * 1.0 }, { f: N.B4, d: beat * 1.0 },
    ];
    for (const note of altoSubject) {
      harmony.push({ freq: note.f, time: ht, duration: note.d * 0.85 });
      ht += note.d;
    }

    // Bass entry at beat 8
    let bt = 0;
    const bassSubject = [
      { f: N.C3, d: beat * 1.0 }, { f: N.D3, d: beat * 1.0 },
      { f: N.F3, d: beat * 1.0 }, { f: N.E3, d: beat * 1.0 },
      { f: N.G3, d: beat * 0.5 }, { f: N.F3, d: beat * 0.5 },
      { f: N.E3, d: beat * 0.5 }, { f: N.D3, d: beat * 0.5 },
      { f: N.C3, d: beat * 1.0 }, { f: N.G3, d: beat * 1.0 },
      { f: N.C3, d: beat * 1.0 },
    ];
    for (const note of bassSubject) {
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.8 });
      bt += note.d;
    }

    return { melody, bass, harmony, duration: t };
  }

  /**
   * Menu: Medley overture combining snippets from all 7 pieces
   */
  getMenuTrack() {
    const N = MozartSoundtracks.NOTE;
    const bpm = 130;
    const beat = 60 / bpm;
    const melody = [];
    const bass = [];
    let t = 0;

    // Snippet 1: Eine kleine opening (Level 1)
    const snippet1 = [
      { f: N.G4, d: beat * 0.5 }, { f: N.D4, d: beat * 0.35 },
      { f: N.G4, d: beat * 0.5 }, { f: N.D4, d: beat * 0.35 },
      { f: N.G4, d: beat * 0.25 }, { f: N.B4, d: beat * 0.25 },
      { f: N.D5, d: beat * 0.6 }, { f: 0, d: beat * 0.3 },
    ];
    for (const note of snippet1) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Snippet 2: Symphony 40 theme (Level 5)
    const snippet2 = [
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.5 },
      { f: N.Eb5, d: beat * 0.25 }, { f: N.D5, d: beat * 0.25 },
      { f: N.Bb4, d: beat * 0.6 }, { f: 0, d: beat * 0.3 },
    ];
    for (const note of snippet2) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Snippet 3: Alla Turca (Level 3)
    const snippet3 = [
      { f: N.B4, d: beat * 0.2 }, { f: N.A4, d: beat * 0.2 },
      { f: N.Gs4, d: beat * 0.2 }, { f: N.A4, d: beat * 0.2 },
      { f: N.C5, d: beat * 0.4 },
      { f: N.D5, d: beat * 0.2 }, { f: N.C5, d: beat * 0.2 },
      { f: N.B4, d: beat * 0.2 }, { f: N.C5, d: beat * 0.2 },
      { f: N.E5, d: beat * 0.5 }, { f: 0, d: beat * 0.3 },
    ];
    for (const note of snippet3) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Snippet 4: Jupiter subject (Level 7)
    const snippet4 = [
      { f: N.C5, d: beat * 0.75 }, { f: N.D5, d: beat * 0.75 },
      { f: N.F5, d: beat * 0.75 }, { f: N.E5, d: beat * 0.75 },
      { f: 0, d: beat * 0.3 },
    ];
    for (const note of snippet4) {
      melody.push({ freq: note.f, time: t, duration: note.d * 0.85 });
      t += note.d;
    }

    // Simple bass throughout
    let bt = 0;
    const bassLoop = [
      { f: N.G3, d: beat }, { f: N.D3, d: beat },
      { f: N.G3, d: beat }, { f: N.D3, d: beat },
      { f: N.Eb3, d: beat }, { f: N.Bb3, d: beat },
      { f: N.A3, d: beat }, { f: N.E3, d: beat },
      { f: N.C3, d: beat }, { f: N.G3, d: beat },
      { f: N.C3, d: beat }, { f: N.G3, d: beat },
    ];
    for (const note of bassLoop) {
      if (bt >= t) break;
      bass.push({ freq: note.f, time: bt, duration: note.d * 0.7 });
      bt += note.d;
    }

    return { melody, bass, duration: t };
  }
}
