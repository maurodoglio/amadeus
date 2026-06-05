/**
 * Dynamic Adaptive Music System
 *
 * Manages layered background music that responds to gameplay state using
 * Web Audio API oscillators and gain nodes for smooth crossfading.
 *
 * States:
 *  - exploration: Piano only (calm)
 *  - tension: Piano + strings (enemies nearby)
 *  - combat: Full orchestra with drums (boss/fight)
 *
 * Features:
 *  - Layered instrument tracks that fade in/out
 *  - Stingers on damage / near-death
 *  - Victory fanfares on combo streaks / enemy defeats
 *  - Tempo changes during low health or timed sections
 *  - 1-2 second crossfades between states
 */
export class AdaptiveMusicManager {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.currentState = 'exploration';
    this.targetState = 'exploration';
    this.transitionDuration = 1.5; // seconds for crossfade

    // Layer gain nodes
    this.layers = {
      piano: null,
      strings: null,
      brass: null,
      drums: null,
    };

    // Layer target volumes per state
    this.stateVolumes = {
      exploration: { piano: 0.25, strings: 0.0, brass: 0.0, drums: 0.0 },
      tension: { piano: 0.2, strings: 0.18, brass: 0.0, drums: 0.0 },
      combat: { piano: 0.12, strings: 0.15, brass: 0.15, drums: 0.18 },
    };

    // Tempo (playback rate multiplier)
    this.baseTempo = 1.0;
    this.currentTempo = 1.0;
    this.targetTempo = 1.0;

    // Music generation state
    this.oscillators = [];
    this.intervalId = null;
    this.beatIndex = 0;
    this.bpm = 120;

    // Detection thresholds
    this.enemyDetectionRange = 300;
    this.combatRange = 150;

    // Stinger cooldown
    this.lastStingerTime = 0;
    this.stingerCooldown = 2000;

    // Victory fanfare cooldown
    this.lastFanfareTime = 0;
    this.fanfareCooldown = 3000;
  }

  /**
   * Initialize the audio context and gain node graph.
   * Call after user interaction to satisfy autoplay policies.
   */
  init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain for overall volume control
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.audioContext.destination);

    // Create gain nodes for each layer
    for (const layer of Object.keys(this.layers)) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(this.masterGain);
      this.layers[layer] = gainNode;
    }

    // Set initial state volumes
    this.applyStateVolumes('exploration', true);
  }

  /**
   * Start the adaptive music system.
   * When accompaniment mode is true (default), only provides stingers and
   * fanfares without starting its own melody loop — use alongside
   * MozartSoundtracks which handles the primary music.
   */
  start(initialState = 'exploration', { accompanimentOnly = true } = {}) {
    if (this.isPlaying) return;
    if (!this.audioContext) this.init();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentState = initialState;
    this.targetState = initialState;
    this.applyStateVolumes(initialState, true);

    // Only start the independent music loop if not in accompaniment mode.
    // In accompaniment mode, MozartSoundtracks provides the melody and this
    // system only contributes stingers, fanfares, and state tracking.
    if (!accompanimentOnly) {
      this.startMusicLoop();
    }
  }

  /**
   * Stop all music and clean up oscillators.
   */
  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    });
    this.oscillators = [];
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    }
  }

  /**
   * Destroy and release all resources.
   */
  destroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
  }

  /**
   * Transition to a new music state with smooth crossfade.
   */
  setState(newState) {
    if (!this.stateVolumes[newState] || newState === this.targetState) return;
    this.targetState = newState;
    this.applyStateVolumes(newState, false);
    this.currentState = newState;
  }

  /**
   * Adjust tempo (e.g. for low health or timed sections).
   * @param {number} tempoMultiplier - 1.0 = normal, 1.3 = fast
   */
  setTempo(tempoMultiplier) {
    this.targetTempo = Math.max(0.7, Math.min(1.5, tempoMultiplier));
  }

  /**
   * Play a damage stinger (short dissonant phrase).
   */
  playDamageStinger() {
    if (!this.audioContext || !this.isPlaying) return;
    const now = Date.now();
    if (now - this.lastStingerTime < this.stingerCooldown) return;
    this.lastStingerTime = now;

    const ctx = this.audioContext;
    const t = ctx.currentTime;

    // Dissonant descending minor second stinger
    const notes = [660, 622, 554, 494];
    const noteDuration = 0.08;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + i * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * noteDuration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * noteDuration);
      osc.stop(t + (i + 1) * noteDuration + 0.01);
    });
  }

  /**
   * Play a near-death stinger (urgent pulsing low tone).
   */
  playNearDeathStinger() {
    if (!this.audioContext || !this.isPlaying) return;
    const now = Date.now();
    if (now - this.lastStingerTime < this.stingerCooldown) return;
    this.lastStingerTime = now;

    const ctx = this.audioContext;
    const t = ctx.currentTime;

    // Heartbeat-like low pulse
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55 + i * 5;
      const start = t + i * 0.2;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.2);
    }
  }

  /**
   * Play a victory fanfare (ascending major arpeggio).
   */
  playVictoryFanfare() {
    if (!this.audioContext || !this.isPlaying) return;
    const now = Date.now();
    if (now - this.lastFanfareTime < this.fanfareCooldown) return;
    this.lastFanfareTime = now;

    const ctx = this.audioContext;
    const t = ctx.currentTime;

    // Triumphant C major arpeggio: C5 E5 G5 C6
    const notes = [523, 659, 784, 1047];
    const noteDuration = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * noteDuration;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration * 2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + noteDuration * 2.5);
    });
  }

  /**
   * Update method — call from scene.update() to track game state.
   * Automatically detects enemies, health, combo, and adjusts music.
   */
  update(scene) {
    if (!this.isPlaying) return;

    const player = scene.mozart || scene.player;
    if (!player || player.isDead) return;

    // Detect game state from scene
    const newState = this.detectState(scene, player);
    if (newState !== this.currentState) {
      this.setState(newState);
    }

    // Tempo adjustments based on health
    const lives = scene.registry.get('lives') || 3;
    if (lives <= 1) {
      this.setTempo(1.25);
      // Near-death stinger when health is critical
      if (lives === 1 && Math.random() < 0.002) {
        this.playNearDeathStinger();
      }
    } else {
      this.setTempo(1.0);
    }

    // Smoothly interpolate tempo
    if (Math.abs(this.currentTempo - this.targetTempo) > 0.01) {
      this.currentTempo += (this.targetTempo - this.currentTempo) * 0.02;
    }

    // Combo-based fanfares
    const comboCount = scene.registry.get('comboCount') || 0;
    if (comboCount === 5 || comboCount === 8) {
      this.playVictoryFanfare();
    }
  }

  // --- Private methods ---

  /**
   * Detect the appropriate music state based on game conditions.
   */
  detectState(scene, player) {
    // Check for boss fight flag
    if (scene.bossActive || scene.isBossFight) {
      return 'combat';
    }

    // Check enemies proximity
    const enemies = scene.enemies ? scene.enemies.getChildren() : [];
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
      }
    }

    if (closestDist < this.combatRange) {
      return 'combat';
    } else if (closestDist < this.enemyDetectionRange) {
      return 'tension';
    }

    return 'exploration';
  }

  /**
   * Apply gain levels for a given state with optional instant/crossfade.
   */
  applyStateVolumes(state, instant) {
    if (!this.audioContext) return;
    const volumes = this.stateVolumes[state];
    const now = this.audioContext.currentTime;

    for (const [layer, gainNode] of Object.entries(this.layers)) {
      if (!gainNode) continue;
      const targetVol = volumes[layer] || 0;
      if (instant) {
        gainNode.gain.setValueAtTime(targetVol, now);
      } else {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(targetVol, now + this.transitionDuration);
      }
    }
  }

  /**
   * Start the looping music generation using oscillators.
   * Each layer uses different waveforms and note patterns.
   */
  startMusicLoop() {
    const ctx = this.audioContext;
    if (!ctx) return;

    // Key: C minor for dramatic feel (C D Eb F G Ab Bb)
    const scale = [262, 294, 311, 349, 392, 415, 466]; // C4 minor scale
    const bassScale = [131, 147, 156, 175, 196, 208, 233]; // C3 minor scale

    // Piano pattern: gentle arpeggiated chords
    const pianoPattern = [0, 2, 4, 2, 0, 4, 2, 4, 5, 4, 2, 0, 4, 2, 0, 2];
    // Strings pattern: sustained notes from scale
    const stringsPattern = [0, 0, 2, 2, 4, 4, 5, 5, 4, 4, 2, 2, 0, 0, 4, 4];
    // Brass pattern: power notes
    const brassPattern = [0, -1, 4, -1, 0, -1, 2, -1, 4, -1, 5, -1, 4, -1, 2, -1];
    // Drums pattern: kick/snare (-1 = rest, 0 = kick, 1 = snare)
    const drumsPattern = [0, -1, 1, -1, 0, 0, 1, -1, 0, -1, 1, -1, 0, 0, 1, 0];

    const beatInterval = () => (60 / (this.bpm * this.currentTempo)) * 1000;

    const scheduleNote = () => {
      if (!this.isPlaying || !this.audioContext) return;
      const t = ctx.currentTime;
      const beatDur = 60 / (this.bpm * this.currentTempo);
      const idx = this.beatIndex % 16;

      // Piano layer
      const pianoNote = pianoPattern[idx];
      if (pianoNote >= 0) {
        this.playLayerNote('piano', scale[pianoNote], beatDur * 0.8, 'triangle');
      }

      // Strings layer (sustained)
      const strNote = stringsPattern[idx];
      if (strNote >= 0 && idx % 2 === 0) {
        this.playLayerNote('strings', scale[strNote] * 0.5, beatDur * 1.8, 'sine');
      }

      // Brass layer
      const brNote = brassPattern[idx];
      if (brNote >= 0) {
        this.playLayerNote('brass', bassScale[brNote], beatDur * 0.6, 'sawtooth');
      }

      // Drums layer (noise-based percussion)
      const drumHit = drumsPattern[idx];
      if (drumHit >= 0) {
        this.playDrumHit(drumHit === 0 ? 'kick' : 'snare', beatDur * 0.3);
      }

      this.beatIndex++;

      // Schedule next beat
      this.intervalId = setTimeout(scheduleNote, beatInterval());
    };

    scheduleNote();
  }

  /**
   * Play a single note on the specified layer.
   */
  playLayerNote(layer, freq, duration, waveType) {
    const ctx = this.audioContext;
    if (!ctx || !this.layers[layer]) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, t);

    // ADSR-like envelope
    const attack = 0.02;
    const decay = duration * 0.2;
    const sustain = 0.7;
    const release = duration * 0.3;

    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1.0, t + attack);
    noteGain.gain.linearRampToValueAtTime(sustain, t + attack + decay);
    noteGain.gain.setValueAtTime(sustain, t + duration - release);
    noteGain.gain.linearRampToValueAtTime(0, t + duration);

    osc.connect(noteGain);
    noteGain.connect(this.layers[layer]);
    osc.start(t);
    osc.stop(t + duration + 0.01);

    this.oscillators.push(osc);
    // Clean up finished oscillators periodically
    if (this.oscillators.length > 50) {
      this.oscillators = this.oscillators.slice(-20);
    }
  }

  /**
   * Play a percussive drum hit using noise or low oscillator.
   */
  playDrumHit(type, duration) {
    const ctx = this.audioContext;
    if (!ctx || !this.layers.drums) return;

    const t = ctx.currentTime;
    const noteGain = ctx.createGain();

    if (type === 'kick') {
      // Low sine with pitch drop
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + duration);
      noteGain.gain.setValueAtTime(1.0, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(noteGain);
      noteGain.connect(this.layers.drums);
      osc.start(t);
      osc.stop(t + duration + 0.01);
      this.oscillators.push(osc);
    } else {
      // Noise burst for snare
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      noteGain.gain.setValueAtTime(0.8, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      source.connect(noteGain);
      noteGain.connect(this.layers.drums);
      source.start(t);
      source.stop(t + duration + 0.01);
    }
  }

  /**
   * Set overall volume (0-1).
   */
  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, vol)),
        this.audioContext.currentTime
      );
    }
  }
}
