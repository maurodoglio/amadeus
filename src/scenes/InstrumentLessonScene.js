import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Instrument lesson tutorial scene shown after completing a level.
 * Players learn about their new instrument and play notes on a one-octave scale.
 */

const INSTRUMENT_DATA = {
  violin: {
    name: 'Violin',
    family: 'Strings',
    role: 'Lead melody voice in Mozart\'s orchestras, carrying the most beautiful themes.',
    waveform: 'sawtooth',
    filterFreq: 2000,
    filterQ: 1,
    baseFreq: 440,
    color: '#D2691E'
  },
  flute: {
    name: 'Flute',
    family: 'Woodwinds',
    role: 'Bright and airy, adding sparkle and birdsong-like passages to the orchestra.',
    waveform: 'sine',
    vibrato: true,
    vibratoRate: 5,
    vibratoDepth: 3,
    baseFreq: 523,
    color: '#C0C0C0'
  },
  piano: {
    name: 'French Horn',
    family: 'Brass',
    role: 'Warm and noble, providing rich harmonic support in Mozart\'s symphonies.',
    waveform: 'triangle',
    filterFreq: 800,
    filterQ: 2,
    baseFreq: 349,
    color: '#B8860B'
  },
  harpsichord: {
    name: 'Piano',
    family: 'Keyboard',
    role: 'The king of instruments — Mozart\'s own favorite for concertos and sonatas.',
    waveform: 'piano',
    baseFreq: 440,
    color: '#1a1a1a'
  },
  trumpet: {
    name: 'Clarinet',
    family: 'Woodwinds',
    role: 'Smooth and versatile, Mozart wrote his famous concerto for this beloved instrument.',
    waveform: 'square',
    filterFreq: 1200,
    filterQ: 3,
    baseFreq: 466,
    color: '#2F4F4F'
  },
  drums: {
    name: 'Timpani',
    family: 'Percussion',
    role: 'Thunderous drums that add drama and punctuation to orchestral climaxes.',
    waveform: 'timpani',
    baseFreq: 147,
    color: '#8B4513'
  },
  harp: {
    name: 'Full Orchestra',
    family: 'Ensemble',
    role: 'All instruments united — the pinnacle of Mozart\'s compositional genius.',
    waveform: 'orchestra',
    baseFreq: 440,
    color: '#FFD700'
  }
};

// C major scale frequencies (one octave)
const SCALE_RATIOS = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8];
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Mozart challenge phrases (scale degree indices, 0-based)
const CHALLENGE_PHRASES = [
  [0, 2, 4, 2],  // C E G E (opening of Eine Kleine Nachtmusik feel)
  [4, 3, 2, 1],  // G F E D (descending)
  [0, 1, 2, 3],  // C D E F (ascending)
  [4, 4, 5, 6],  // G G A B (rising)
  [2, 1, 0, 4],  // E D C G
  [0, 4, 3, 2],  // C G F E
  [6, 5, 4, 3],  // B A G F (descending from top)
];

export class InstrumentLessonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstrumentLessonScene' });
  }

  init(data) {
    this.instrumentKey = data.instrument || 'violin';
    this.levelNumber = data.level || 1;
    this.difficulty = data.difficulty || this.levelNumber;
    this.returnScene = data.returnScene || null;
    this.nextScene = data.nextScene || 'MapScene';
    this.nextSceneData = data.nextSceneData || {};
    this.cutscene = data.cutscene || null;
    this.lessonBonusValue = data.lessonBonus ?? (this.difficulty * 100);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    this.instrument = INSTRUMENT_DATA[this.instrumentKey] || INSTRUMENT_DATA.violin;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.activeOscillators = {};

    this.phase = 'info'; // info -> freeplay -> challenge -> complete
    this.freeplayTimer = 0;
    this.freeplayDuration = 18000; // 18 seconds
    this.challengePhrase = CHALLENGE_PHRASES[(this.levelNumber - 1) % CHALLENGE_PHRASES.length];
    this.challengeProgress = 0;
    this.challengeAttempts = 0;

    this.createInfoCard();
    this.createKeyBindings();
  }

  createInfoCard() {
    const inst = this.instrument;

    // Instrument name title
    this.add.text(GAME_WIDTH / 2, 40, `✦ NEW INSTRUMENT ✦`, {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 70, inst.name, {
      font: '32px monospace',
      fill: inst.color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Family
    this.add.text(GAME_WIDTH / 2, 105, `Family: ${inst.family}`, {
      font: '14px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5);

    // Draw instrument sprite using Phaser graphics
    this.createInstrumentGraphic(GAME_WIDTH / 2, 175);

    // Role description
    this.add.text(GAME_WIDTH / 2, 255, inst.role, {
      font: '13px monospace',
      fill: '#FFFFFF',
      wordWrap: { width: 500 },
      align: 'center'
    }).setOrigin(0.5);

    // Continue prompt
    const isMobile = !this.sys.game.device.os.desktop;
    const continueText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30,
      isMobile ? 'Tap to try playing!' : 'Press SPACE to try playing!', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: continueText,
      alpha: 1,
      duration: 500,
      delay: 1500
    });

    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      delay: 2000,
      yoyo: true,
      repeat: -1
    });

    this.time.delayedCall(1500, () => {
      this.input.keyboard?.once('keydown-SPACE', () => this.startFreeplay());
      this.input.keyboard?.once('keydown-ENTER', () => this.startFreeplay());
      this.input.once('pointerdown', () => this.startFreeplay());
    });
  }

  createInstrumentGraphic(x, y) {
    const g = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(this.instrument.color).color;

    // Generic instrument silhouette based on family
    switch (this.instrument.family) {
      case 'Strings':
        // Violin shape
        g.fillStyle(color, 1);
        g.fillEllipse(x, y, 30, 50);
        g.fillEllipse(x, y - 15, 22, 35);
        g.fillRect(x - 2, y - 55, 4, 40);
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(x - 3, y - 55, 3);
        g.fillCircle(x + 3, y - 55, 3);
        break;
      case 'Woodwinds':
        // Flute/clarinet tube shape
        g.fillStyle(color, 1);
        g.fillRoundedRect(x - 40, y - 5, 80, 10, 5);
        g.fillStyle(0xFFD700, 1);
        for (let i = 0; i < 6; i++) {
          g.fillCircle(x - 30 + i * 12, y, 3);
        }
        break;
      case 'Brass':
        // Horn shape
        g.fillStyle(color, 1);
        g.fillEllipse(x, y, 50, 45);
        g.fillStyle(0x000000, 1);
        g.fillEllipse(x + 5, y, 30, 28);
        g.fillStyle(color, 1);
        g.fillRect(x - 30, y - 5, 20, 6);
        break;
      case 'Keyboard':
        // Piano keys
        g.fillStyle(0xFFFFFF, 1);
        for (let i = 0; i < 7; i++) {
          g.fillRect(x - 35 + i * 10, y - 20, 9, 40);
        }
        g.fillStyle(0x000000, 1);
        const blackKeys = [0, 1, 3, 4, 5];
        blackKeys.forEach(i => {
          g.fillRect(x - 30 + i * 10, y - 20, 6, 25);
        });
        break;
      case 'Percussion':
        // Timpani drum
        g.fillStyle(color, 1);
        g.fillEllipse(x, y + 10, 55, 35);
        g.fillStyle(0xDEB887, 1);
        g.fillEllipse(x, y - 5, 50, 15);
        g.lineStyle(2, 0x8B4513, 1);
        g.strokeEllipse(x, y - 5, 50, 15);
        break;
      case 'Ensemble':
        // Multiple small instruments
        g.fillStyle(0xD2691E, 1);
        g.fillEllipse(x - 25, y, 12, 20);
        g.fillStyle(0xC0C0C0, 1);
        g.fillRoundedRect(x - 5, y - 3, 30, 6, 3);
        g.fillStyle(0xB8860B, 1);
        g.fillEllipse(x + 25, y + 5, 18, 16);
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(x, y - 15, 8);
        break;
      default:
        g.fillStyle(color, 1);
        g.fillEllipse(x, y, 30, 40);
    }
  }

  startFreeplay() {
    this.phase = 'freeplay';
    // Clear existing scene content
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0d1117');

    this.add.text(GAME_WIDTH / 2, 30, `♪ Free Play: ${this.instrument.name} ♪`, {
      font: '22px monospace',
      fill: this.instrument.color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 60, 'Press keys 1-7 to play notes!', {
      font: '14px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5);

    // Note display area
    this.noteDisplays = [];
    const startX = GAME_WIDTH / 2 - 180;
    for (let i = 0; i < 7; i++) {
      const nx = startX + i * 60;
      const keyLabel = `${i + 1}`;
      const noteLabel = NOTE_NAMES[i];

      const bg = this.add.rectangle(nx, 200, 50, 70, 0x1a2a3a).setStrokeStyle(2, 0x87CEEB);
      const txt = this.add.text(nx, 185, noteLabel, {
        font: '20px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      const keyTxt = this.add.text(nx, 220, keyLabel, {
        font: '14px monospace',
        fill: '#666666'
      }).setOrigin(0.5);

      this.noteDisplays.push({ bg, txt, keyTxt });
    }

    // Timer bar
    this.timerBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 600, 16, 0x333333)
      .setStrokeStyle(1, 0x555555);
    this.timerFill = this.add.rectangle(GAME_WIDTH / 2 - 300, GAME_HEIGHT - 60, 600, 14, 0x4CAF50)
      .setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, 'Experiment with the notes!', {
      font: '12px monospace',
      fill: '#888888'
    }).setOrigin(0.5);

    this.freeplayStartTime = this.time.now;
  }

  startChallenge() {
    this.phase = 'challenge';
    this.challengeProgress = 0;
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0d1117');

    this.add.text(GAME_WIDTH / 2, 30, `♪ Mozart Challenge ♪`, {
      font: '22px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 60, 'Play this melody to master the instrument!', {
      font: '14px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5);

    // Show the target phrase
    this.phraseDisplays = [];
    const startX = GAME_WIDTH / 2 - 90;
    for (let i = 0; i < 4; i++) {
      const nx = startX + i * 60;
      const noteIdx = this.challengePhrase[i];
      const bg = this.add.rectangle(nx, 140, 50, 50, 0x2a2a3a).setStrokeStyle(2, 0x555555);
      const txt = this.add.text(nx, 140, NOTE_NAMES[noteIdx], {
        font: '24px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      this.phraseDisplays.push({ bg, txt });
    }

    // Keyboard display
    this.noteDisplays = [];
    const kbStartX = GAME_WIDTH / 2 - 180;
    for (let i = 0; i < 7; i++) {
      const nx = kbStartX + i * 60;
      const bg = this.add.rectangle(nx, 280, 50, 70, 0x1a2a3a).setStrokeStyle(2, 0x87CEEB);
      const txt = this.add.text(nx, 265, NOTE_NAMES[i], {
        font: '20px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      const keyTxt = this.add.text(nx, 300, `${i + 1}`, {
        font: '14px monospace',
        fill: '#666666'
      }).setOrigin(0.5);
      this.noteDisplays.push({ bg, txt, keyTxt });
    }

    this.feedbackText = this.add.text(GAME_WIDTH / 2, 360, '', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);

    this.attemptsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Press ESCAPE to skip', {
      font: '12px monospace',
      fill: '#666666'
    }).setOrigin(0.5);
  }

  createKeyBindings() {
    // Bind keys 1-7 for notes
    for (let i = 1; i <= 7; i++) {
      this.input.keyboard?.on(`keydown-${i === 1 ? 'ONE' : i === 2 ? 'TWO' : i === 3 ? 'THREE' : i === 4 ? 'FOUR' : i === 5 ? 'FIVE' : i === 6 ? 'SIX' : 'SEVEN'}`, () => {
        this.playNote(i - 1);
      });
    }

    // Also bind A-G as alternative
    const letterKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    // Map C D E F G A B to indices 0-6
    const letterMap = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    Object.entries(letterMap).forEach(([letter, idx]) => {
      this.input.keyboard?.on(`keydown-${letter}`, () => {
        if (this.phase === 'freeplay' || this.phase === 'challenge') {
          this.playNote(idx);
        }
      });
    });

    // Escape to skip challenge
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.phase === 'challenge') {
        this.completeLesson();
      }
    });
  }

  playNote(noteIndex) {
    if (this.phase !== 'freeplay' && this.phase !== 'challenge') return;
    if (noteIndex < 0 || noteIndex > 6) return;

    // Visual feedback
    if (this.noteDisplays && this.noteDisplays[noteIndex]) {
      const display = this.noteDisplays[noteIndex];
      this.tweens.add({
        targets: display.bg,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      display.bg.setFillStyle(0x4CAF50);
      this.time.delayedCall(200, () => {
        if (display.bg && display.bg.active) {
          display.bg.setFillStyle(0x1a2a3a);
        }
      });
    }

    // Play audio
    this.playInstrumentNote(noteIndex);

    // Challenge logic
    if (this.phase === 'challenge') {
      this.handleChallengeInput(noteIndex);
    }
  }

  playInstrumentNote(noteIndex) {
    const inst = this.instrument;
    const baseFreq = inst.baseFreq || 440;
    const freq = baseFreq * SCALE_RATIOS[noteIndex];

    // Stop previous note on same key
    if (this.activeOscillators[noteIndex]) {
      try { this.activeOscillators[noteIndex].stop(); } catch (e) { /* ignore */ }
    }

    const ctx = this.audioContext;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    let oscillator;

    switch (inst.waveform) {
      case 'sawtooth':
        // Violin: sawtooth + filter
        oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freq, now);
        const violinFilter = ctx.createBiquadFilter();
        violinFilter.type = 'lowpass';
        violinFilter.frequency.setValueAtTime(inst.filterFreq || 2000, now);
        violinFilter.Q.setValueAtTime(inst.filterQ || 1, now);
        oscillator.connect(violinFilter);
        violinFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;

      case 'sine':
        // Flute: sine + vibrato
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        if (inst.vibrato) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(inst.vibratoRate || 5, now);
          lfoGain.gain.setValueAtTime(inst.vibratoDepth || 3, now);
          lfo.connect(lfoGain);
          lfoGain.connect(oscillator.frequency);
          lfo.start(now);
          lfo.stop(now + 0.8);
        }
        oscillator.connect(gainNode);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        break;

      case 'triangle':
        // French Horn: triangle + low-pass
        oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, now);
        const hornFilter = ctx.createBiquadFilter();
        hornFilter.type = 'lowpass';
        hornFilter.frequency.setValueAtTime(inst.filterFreq || 800, now);
        hornFilter.Q.setValueAtTime(inst.filterQ || 2, now);
        oscillator.connect(hornFilter);
        hornFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.35, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        oscillator.start(now);
        oscillator.stop(now + 1.0);
        break;

      case 'piano':
        // Piano: multiple harmonics with decay
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        for (let h = 1; h <= 4; h++) {
          const osc = ctx.createOscillator();
          const hGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * h, now);
          hGain.gain.setValueAtTime(0.25 / h, now);
          hGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 / h);
          osc.connect(hGain);
          hGain.connect(gainNode);
          osc.start(now);
          osc.stop(now + 1.2);
        }
        oscillator = { stop() {} }; // dummy
        break;

      case 'square':
        // Clarinet: square wave + filter
        oscillator = ctx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, now);
        const clarinetFilter = ctx.createBiquadFilter();
        clarinetFilter.type = 'lowpass';
        clarinetFilter.frequency.setValueAtTime(inst.filterFreq || 1200, now);
        clarinetFilter.Q.setValueAtTime(inst.filterQ || 3, now);
        oscillator.connect(clarinetFilter);
        clarinetFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        oscillator.start(now);
        oscillator.stop(now + 0.7);
        break;

      case 'timpani':
        // Timpani: low sine + noise burst
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.3);
        oscillator.connect(gainNode);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        // Noise burst
        const bufferSize = ctx.sampleRate * 0.1;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        noiseSource.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);
        break;

      case 'orchestra':
        // Full orchestra: layered waveforms
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        const types = ['sawtooth', 'sine', 'triangle', 'square'];
        types.forEach((type, idx) => {
          const osc = ctx.createOscillator();
          const hGain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq * (idx === 3 ? 2 : 1), now);
          hGain.gain.setValueAtTime(0.12, now);
          osc.connect(hGain);
          hGain.connect(gainNode);
          osc.start(now);
          osc.stop(now + 1.0);
        });
        oscillator = { stop() {} }; // dummy
        break;

      default:
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.connect(gainNode);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }

    this.activeOscillators[noteIndex] = oscillator;
  }

  handleChallengeInput(noteIndex) {
    const expectedNote = this.challengePhrase[this.challengeProgress];

    if (noteIndex === expectedNote) {
      // Correct note
      this.challengeProgress++;
      if (this.phraseDisplays && this.phraseDisplays[this.challengeProgress - 1]) {
        this.phraseDisplays[this.challengeProgress - 1].bg.setStrokeStyle(3, 0x4CAF50);
        this.phraseDisplays[this.challengeProgress - 1].txt.setColor('#4CAF50');
      }

      if (this.challengeProgress >= this.challengePhrase.length) {
        // Challenge complete!
        this.feedbackText.setText('🎵 Bravo! Instrument mastered! 🎵');
        this.feedbackText.setColor('#FFD700');
        this.time.delayedCall(1500, () => this.completeLesson());
      } else {
        this.feedbackText.setText(`${this.challengeProgress}/4 correct!`);
        this.feedbackText.setColor('#4CAF50');
      }
    } else {
      // Wrong note — reset progress
      this.challengeProgress = 0;
      this.challengeAttempts++;
      if (this.phraseDisplays) {
        this.phraseDisplays.forEach(d => {
          d.bg.setStrokeStyle(2, 0x555555);
          d.txt.setColor('#FFFFFF');
        });
      }
      this.feedbackText.setText('Try again from the beginning!');
      this.feedbackText.setColor('#FF6B6B');

      // After 5 failed attempts, allow skipping more prominently
      if (this.challengeAttempts >= 5 && this.attemptsText) {
        this.attemptsText.setText('Press ESCAPE to skip (no penalty)');
        this.attemptsText.setColor('#87CEEB');
      }
    }
  }

  completeLesson() {
    this.phase = 'complete';
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0d1117');

    const successText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `${this.instrument.name} Learned!`, {
      font: '28px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: successText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Added to your orchestra!', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subText,
      alpha: 1,
      duration: 500,
      delay: 500
    });

    this.time.delayedCall(2000, () => this.proceed());
  }

  proceed() {
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    if (this.returnScene) {
      if (this.lessonBonusValue > 0) {
        this.registry.set('lessonBonus', this.lessonBonusValue);
      }
      this.scene.stop();
      this.scene.resume(this.returnScene);
      return;
    }

    if (this.cutscene) {
      this.scene.start('CutsceneScene', { cutscene: this.cutscene, nextScene: this.nextScene });
    } else {
      this.scene.start(this.nextScene, this.nextSceneData);
    }
  }

  update(time) {
    if (this.phase === 'freeplay') {
      const elapsed = time - (this.freeplayStartTime || time);
      const progress = Math.min(elapsed / this.freeplayDuration, 1);

      // Update timer bar
      if (this.timerFill) {
        this.timerFill.width = 600 * (1 - progress);
        // Color transition from green to yellow to red
        if (progress > 0.7) {
          this.timerFill.setFillStyle(0xFF6B6B);
        } else if (progress > 0.4) {
          this.timerFill.setFillStyle(0xFFD700);
        }
      }

      if (progress >= 1) {
        this.startChallenge();
      }
    }
  }

  shutdown() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
