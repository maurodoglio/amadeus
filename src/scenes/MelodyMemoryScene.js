import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Melody Memory Mini-Game (Simon-says with Mozart phrases)
 *
 * Players watch a sequence of notes highlighted on a visual piano, then
 * replay them from memory. Progressive difficulty from 3 to 8 notes.
 * Triggered from level scenes via a special musical portal.
 */
export class MelodyMemoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MelodyMemoryScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'Level1Scene';
    this.difficulty = data.difficulty || 1; // 1-5
    this.playerX = data.playerX || 100;
    this.playerY = data.playerY || 300;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0221');

    // Audio context for Web Audio note playback
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Note frequencies (C4 to B4 - one octave)
    this.noteData = [
      { name: 'C', freq: 262, color: 0xffffff },
      { name: 'D', freq: 294, color: 0xffffff },
      { name: 'E', freq: 330, color: 0xffffff },
      { name: 'F', freq: 349, color: 0xffffff },
      { name: 'G', freq: 392, color: 0xffffff },
      { name: 'A', freq: 440, color: 0xffffff },
      { name: 'B', freq: 494, color: 0xffffff },
    ];

    // Mozart melody phrases (note indices 0-6 mapped to C-B)
    this.mozartPhrases = [
      // Eine kleine Nachtmusik opening (simplified)
      [4, 2, 4, 2, 4, 6, 2],
      // Twinkle Twinkle (Mozart K.265 theme)
      [0, 0, 4, 4, 5, 5, 4],
      // Piano Sonata No.11 Alla Turca
      [6, 5, 4, 5, 0, 2, 4],
      // Symphony 40 opening
      [2, 1, 2, 3, 4, 3, 2],
      // Magic Flute Papageno
      [4, 3, 2, 1, 0, 1, 2],
      // Jupiter Symphony theme
      [0, 1, 2, 3, 4, 5, 4],
      // Marriage of Figaro
      [0, 2, 4, 5, 4, 2, 0],
      // Lacrimosa
      [5, 4, 3, 2, 3, 4, 5],
    ];

    // Game state
    this.currentRound = 0;
    this.sequenceLength = Math.min(3 + Math.floor(this.difficulty / 2), 3); // Start with 3
    this.maxSequenceLength = Math.min(3 + this.difficulty + 2, 8);
    this.sequence = [];
    this.playerInput = [];
    this.isPlayingSequence = false;
    this.isPlayerTurn = false;
    this.streak = 0;
    this.score = 0;
    this.totalRounds = 5;
    this.roundsCompleted = 0;
    this.gameOver = false;

    // Timing based on difficulty
    this.notePlayDuration = Math.max(300, 600 - this.difficulty * 60); // ms per note
    this.noteGap = Math.max(150, 350 - this.difficulty * 40); // ms between notes

    this.createUI();
    this.createPiano();
    this.setupInput();

    // Start first round after brief delay
    this.time.delayedCall(1500, () => this.startRound());
  }

  createUI() {
    // Stage frame
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 30, GAME_HEIGHT - 30, 0x1a0533)
      .setStrokeStyle(3, 0xffd700);

    // Title
    this.add.text(GAME_WIDTH / 2, 25, '♪ Melody Memory ♪', {
      font: '22px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Instructions
    this.instructionText = this.add.text(GAME_WIDTH / 2, 55, 'Watch and listen to the melody...', {
      font: '14px monospace',
      fill: '#AAAAFF'
    }).setOrigin(0.5);

    // Score display
    this.scoreText = this.add.text(GAME_WIDTH - 30, 25, 'Score: 0', {
      font: '14px monospace',
      fill: '#FFFFFF'
    }).setOrigin(1, 0);

    // Streak display
    this.streakText = this.add.text(GAME_WIDTH - 30, 45, 'Streak: 0', {
      font: '14px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 0);

    // Round display
    this.roundText = this.add.text(30, 25, 'Round: 1', {
      font: '14px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0, 0);

    // Feedback text (center)
    this.feedbackText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      font: '24px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    // Sequence progress dots
    this.progressDots = [];
  }

  createPiano() {
    const keyWidth = 70;
    const keyHeight = 140;
    const startX = (GAME_WIDTH - keyWidth * 7) / 2 + keyWidth / 2;
    const startY = GAME_HEIGHT - 100;

    this.pianoKeys = [];

    for (let i = 0; i < 7; i++) {
      const x = startX + i * keyWidth;
      const y = startY;

      // Key background (white piano key look)
      const key = this.add.rectangle(x, y, keyWidth - 4, keyHeight, 0xfafafa)
        .setStrokeStyle(2, 0x333333)
        .setInteractive({ useHandCursor: true });

      // Note label on key
      const label = this.add.text(x, y + keyHeight / 2 - 20, this.noteData[i].name, {
        font: '18px monospace',
        fill: '#333333',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Key number hint
      const numLabel = this.add.text(x, y + keyHeight / 2 - 45, `${i + 1}`, {
        font: '12px monospace',
        fill: '#888888'
      }).setOrigin(0.5);

      // Click handler
      key.on('pointerdown', () => this.onNotePressed(i));

      this.pianoKeys.push({ key, label, numLabel, x, y });
    }
  }

  setupInput() {
    // Keyboard: keys 1-7 for notes C-B
    const keyCodes = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
    ];

    this.noteKeys = keyCodes.map((code, idx) => {
      const k = this.input.keyboard?.addKey(code);
      if (k) k.on('down', () => this.onNotePressed(idx));
      return k;
    });

    // Also support A-G letter keys
    const letterCodes = [
      Phaser.Input.Keyboard.KeyCodes.A, // maps to A (index 5)
      Phaser.Input.Keyboard.KeyCodes.B, // maps to B (index 6)
      Phaser.Input.Keyboard.KeyCodes.C, // maps to C (index 0)
      Phaser.Input.Keyboard.KeyCodes.D, // maps to D (index 1)
      Phaser.Input.Keyboard.KeyCodes.E, // maps to E (index 2)
      Phaser.Input.Keyboard.KeyCodes.F, // maps to F (index 3)
      Phaser.Input.Keyboard.KeyCodes.G, // maps to G (index 4)
    ];
    const letterToIndex = [5, 6, 0, 1, 2, 3, 4];

    this.letterKeys = letterCodes.map((code, idx) => {
      const k = this.input.keyboard?.addKey(code);
      if (k) k.on('down', () => this.onNotePressed(letterToIndex[idx]));
      return k;
    });
  }

  startRound() {
    if (this.gameOver) return;

    this.currentRound++;
    this.roundText.setText(`Round: ${this.currentRound}`);
    this.playerInput = [];
    this.isPlayerTurn = false;

    // Generate sequence from Mozart phrases
    this.generateSequence();

    // Update progress dots
    this.updateProgressDots();

    // Play the sequence
    this.instructionText.setText('Watch and listen...');
    this.time.delayedCall(500, () => this.playSequence());
  }

  generateSequence() {
    // Pick a random Mozart phrase and take a slice
    const phrase = Phaser.Utils.Array.GetRandom(this.mozartPhrases);
    this.sequence = [];

    for (let i = 0; i < this.sequenceLength; i++) {
      this.sequence.push(phrase[i % phrase.length]);
    }
  }

  updateProgressDots() {
    // Remove old dots
    this.progressDots.forEach(d => d.destroy());
    this.progressDots = [];

    const dotSpacing = 20;
    const startX = GAME_WIDTH / 2 - (this.sequenceLength - 1) * dotSpacing / 2;

    for (let i = 0; i < this.sequenceLength; i++) {
      const dot = this.add.circle(startX + i * dotSpacing, 80, 6, 0x444466)
        .setStrokeStyle(1, 0x6666aa);
      this.progressDots.push(dot);
    }
  }

  playSequence() {
    this.isPlayingSequence = true;
    let delay = 0;

    this.sequence.forEach((noteIdx, i) => {
      this.time.delayedCall(delay, () => {
        this.highlightKey(noteIdx, true);
        this.playNoteSound(noteIdx);

        this.time.delayedCall(this.notePlayDuration, () => {
          this.highlightKey(noteIdx, false);
        });
      });
      delay += this.notePlayDuration + this.noteGap;
    });

    // After sequence finishes, let player respond
    this.time.delayedCall(delay + 300, () => {
      this.isPlayingSequence = false;
      this.isPlayerTurn = true;
      this.instructionText.setText('Your turn! Replay the melody');
    });
  }

  highlightKey(noteIdx, active) {
    const pianoKey = this.pianoKeys[noteIdx];
    if (active) {
      pianoKey.key.setFillStyle(0x6699ff);
      pianoKey.label.setColor('#FFFFFF');

      // Glow effect
      if (!pianoKey.glow) {
        pianoKey.glow = this.add.rectangle(pianoKey.x, pianoKey.y, 74, 144, 0x4488ff, 0.3);
        pianoKey.glow.setDepth(-1);
      }
    } else {
      pianoKey.key.setFillStyle(0xfafafa);
      pianoKey.label.setColor('#333333');

      if (pianoKey.glow) {
        pianoKey.glow.destroy();
        pianoKey.glow = null;
      }
    }
  }

  playNoteSound(noteIdx) {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const freq = this.noteData[noteIdx].freq;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const duration = this.notePlayDuration / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Pleasant envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.setValueAtTime(0.3, now + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  onNotePressed(noteIdx) {
    if (!this.isPlayerTurn || this.isPlayingSequence || this.gameOver) return;

    // Visual feedback on press
    this.flashKey(noteIdx);
    this.playNoteSound(noteIdx);

    const expectedIdx = this.sequence[this.playerInput.length];
    this.playerInput.push(noteIdx);

    if (noteIdx === expectedIdx) {
      // Correct note
      this.showCorrectFeedback(noteIdx);

      // Update progress dot
      if (this.playerInput.length - 1 < this.progressDots.length) {
        this.progressDots[this.playerInput.length - 1].setFillStyle(0x44ff44);
      }

      // Check if full sequence completed
      if (this.playerInput.length === this.sequence.length) {
        this.onRoundSuccess();
      }
    } else {
      // Wrong note
      this.onRoundFail(noteIdx);
    }
  }

  flashKey(noteIdx) {
    const pianoKey = this.pianoKeys[noteIdx];
    pianoKey.key.setFillStyle(0xaaccff);
    this.time.delayedCall(150, () => {
      if (this.isPlayerTurn) {
        pianoKey.key.setFillStyle(0xfafafa);
      }
    });
  }

  showCorrectFeedback(noteIdx) {
    const pianoKey = this.pianoKeys[noteIdx];

    // Green glow
    const glow = this.add.rectangle(pianoKey.x, pianoKey.y, 74, 144, 0x44ff44, 0.4);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 300,
      onComplete: () => glow.destroy()
    });
  }

  onRoundSuccess() {
    this.isPlayerTurn = false;
    this.streak++;
    this.roundsCompleted++;

    const roundScore = this.sequenceLength * 50 * (1 + Math.floor(this.streak / 3));
    this.score += roundScore;

    this.scoreText.setText(`Score: ${this.score}`);
    this.streakText.setText(`Streak: ${this.streak}`);

    this.showFeedback('♪ Bravo! ♪', '#44FF44');

    // Play success jingle
    this.playSuccessJingle();

    // Increase difficulty for next round
    if (this.sequenceLength < this.maxSequenceLength) {
      this.sequenceLength++;
    }

    // Check if game complete
    if (this.roundsCompleted >= this.totalRounds) {
      this.time.delayedCall(1500, () => this.showResults(true));
    } else {
      this.time.delayedCall(1500, () => this.startRound());
    }
  }

  onRoundFail(wrongIdx) {
    this.isPlayerTurn = false;
    this.streak = 0;
    this.streakText.setText(`Streak: ${this.streak}`);

    // Red flash on wrong key
    const pianoKey = this.pianoKeys[wrongIdx];
    const flash = this.add.rectangle(pianoKey.x, pianoKey.y, 74, 144, 0xff4444, 0.5);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });

    // Mark wrong dot
    if (this.playerInput.length - 1 < this.progressDots.length) {
      this.progressDots[this.playerInput.length - 1].setFillStyle(0xff4444);
    }

    this.showFeedback('✗ Wrong note!', '#FF4444');

    // Play dissonant sound
    this.playDissonantSound();

    // Show correct note briefly
    this.time.delayedCall(800, () => {
      const correctIdx = this.sequence[this.playerInput.length - 1];
      this.highlightKey(correctIdx, true);
      this.time.delayedCall(600, () => {
        this.highlightKey(correctIdx, false);
      });
    });

    // After short pause, either retry or end
    this.roundsCompleted++;
    if (this.roundsCompleted >= this.totalRounds) {
      this.time.delayedCall(2000, () => this.showResults(false));
    } else {
      // Reset sequence length on fail
      this.sequenceLength = Math.max(3, this.sequenceLength - 1);
      this.time.delayedCall(2000, () => this.startRound());
    }
  }

  playSuccessJingle() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const notes = [392, 494, 523]; // G4, B4, C5 - ascending triad

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
    });
  }

  playDissonantSound() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Dissonant minor second
    [260, 277].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2'
    });
  }

  showResults(success) {
    this.gameOver = true;

    // Dim background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    // Results panel
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 280, 0x0d0221, 0.95)
      .setStrokeStyle(3, 0xffd700);

    const title = success ? '♪ Maestro! ♪' : '♪ Good Effort! ♪';
    const titleColor = success ? '#FFD700' : '#AAAAFF';

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, title, {
      font: '24px monospace',
      fill: titleColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const lines = [
      `Score: ${this.score}`,
      `Best Streak: ${this.streak}`,
      `Rounds: ${this.roundsCompleted}/${this.totalRounds}`,
      `Max Sequence: ${this.sequenceLength} notes`,
    ];

    lines.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60 + i * 28, line, {
        font: '14px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
    });

    // Reward: score bonus handed back to the main level on resume
    const bonus = success ? this.score : Math.floor(this.score / 2);
    this.bonusAward = bonus;

    // Composition fragment reward for success
    if (success) {
      const fragments = this.registry.get('melodyFragments') || 0;
      this.registry.set('melodyFragments', fragments + 1);

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '🎵 Melody Fragment Earned!', {
        font: '14px monospace',
        fill: '#FFD700'
      }).setOrigin(0.5);
    }

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, `+${bonus} points earned!`, {
      font: '12px monospace',
      fill: '#90EE90'
    }).setOrigin(0.5);

    // Return button
    const returnBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, '[ Press ENTER to return ]', {
      font: '14px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    returnBtn.on('pointerdown', () => this.returnToLevel());
    this.input.keyboard?.on('keydown-ENTER', () => this.returnToLevel());
  }

  returnToLevel() {
    // Clean up audio context
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;

    // Store reward info for the level to pick up on resume
    if (this.bonusAward > 0) {
      this.registry.set('melodyMemoryBonus', this.bonusAward);
    }

    this.scene.stop();
    this.scene.resume(this.returnScene);
  }

  shutdown() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
  }
}
