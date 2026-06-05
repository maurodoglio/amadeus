import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';

/**
 * Chord definitions by difficulty tier.
 * Each chord: { name, displayName, notes (letter names), formula }
 */
const CHORD_LIBRARY = {
  // L1-2: Major triads, 4 note options
  easy: [
    { name: 'C Major', notes: ['C', 'E', 'G'], formula: 'Root + Major 3rd + Perfect 5th', freqs: [261.63, 329.63, 392.00] },
    { name: 'G Major', notes: ['G', 'B', 'D'], formula: 'Root + Major 3rd + Perfect 5th', freqs: [392.00, 493.88, 293.66] },
    { name: 'F Major', notes: ['F', 'A', 'C'], formula: 'Root + Major 3rd + Perfect 5th', freqs: [349.23, 440.00, 523.25] },
    { name: 'D Major', notes: ['D', 'F#', 'A'], formula: 'Root + Major 3rd + Perfect 5th', freqs: [293.66, 369.99, 440.00] },
  ],
  // L3-4: Major/minor triads, 5 options
  medium: [
    { name: 'A Minor', notes: ['A', 'C', 'E'], formula: 'Root + Minor 3rd + Perfect 5th', freqs: [440.00, 523.25, 659.25] },
    { name: 'E Minor', notes: ['E', 'G', 'B'], formula: 'Root + Minor 3rd + Perfect 5th', freqs: [329.63, 392.00, 493.88] },
    { name: 'D Minor', notes: ['D', 'F', 'A'], formula: 'Root + Minor 3rd + Perfect 5th', freqs: [293.66, 349.23, 440.00] },
    { name: 'Eb Major', notes: ['Eb', 'G', 'Bb'], formula: 'Root + Major 3rd + Perfect 5th', freqs: [311.13, 392.00, 466.16] },
  ],
  // L5-6: 7th chords, 6 options (4 notes in chord)
  hard: [
    { name: 'G7', notes: ['G', 'B', 'D', 'F'], formula: 'Root + Major 3rd + Perfect 5th + Minor 7th', freqs: [392.00, 493.88, 293.66, 349.23] },
    { name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], formula: 'Root + Major 3rd + Perfect 5th + Major 7th', freqs: [261.63, 329.63, 392.00, 493.88] },
    { name: 'Am7', notes: ['A', 'C', 'E', 'G'], formula: 'Root + Minor 3rd + Perfect 5th + Minor 7th', freqs: [440.00, 523.25, 659.25, 392.00] },
    { name: 'Dm7', notes: ['D', 'F', 'A', 'C'], formula: 'Root + Minor 3rd + Perfect 5th + Minor 7th', freqs: [293.66, 349.23, 440.00, 523.25] },
  ],
  // L7: Diminished/augmented, 7 options
  expert: [
    { name: 'B Dim', notes: ['B', 'D', 'F'], formula: 'Root + Minor 3rd + Diminished 5th', freqs: [493.88, 293.66, 349.23] },
    { name: 'C Aug', notes: ['C', 'E', 'G#'], formula: 'Root + Major 3rd + Augmented 5th', freqs: [261.63, 329.63, 415.30] },
    { name: 'F# Dim', notes: ['F#', 'A', 'C'], formula: 'Root + Minor 3rd + Diminished 5th', freqs: [369.99, 440.00, 523.25] },
    { name: 'D Aug', notes: ['D', 'F#', 'A#'], formula: 'Root + Major 3rd + Augmented 5th', freqs: [293.66, 369.99, 466.16] },
  ]
};

// All available note letters for distractors
const ALL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#', 'G#', 'A#'];

// Note colors for visual distinction
const NOTE_COLORS = {
  'C': 0xFF4444, 'D': 0xFF8844, 'E': 0xFFDD44,
  'F': 0x44FF44, 'G': 0x4488FF, 'A': 0x8844FF,
  'B': 0xFF44FF, 'Bb': 0x44DDDD, 'Eb': 0xDD44DD,
  'F#': 0xDDDD44, 'G#': 0x44FFDD, 'A#': 0xDD8844
};

/**
 * Gets difficulty tier for a level number.
 */
function getDifficultyTier(level) {
  if (level <= 2) return 'easy';
  if (level <= 4) return 'medium';
  if (level <= 6) return 'hard';
  return 'expert';
}

/**
 * Gets number of note options for a level.
 */
function getNoteOptionCount(level) {
  if (level <= 2) return 4;
  if (level <= 4) return 5;
  if (level <= 6) return 6;
  return 7;
}

/**
 * ChordDoor — a locked door that requires the player to collect the correct
 * notes of a chord to unlock it, revealing a bonus room behind it.
 */
export class ChordDoor {
  constructor(scene, level, doorX, doorY, bonusRewards) {
    this.scene = scene;
    this.level = level;
    this.doorX = doorX;
    this.doorY = doorY;
    this.bonusRewards = bonusRewards || {};
    this.isOpen = false;
    this.isShowingOverlay = false;
    this.collectedNotes = [];
    this.noteSprites = [];

    // Pick a random chord for this level's difficulty
    const tier = getDifficultyTier(level);
    const chords = CHORD_LIBRARY[tier];
    this.chord = chords[Math.floor(Math.random() * chords.length)];
    this.requiredNotes = [...this.chord.notes];
    this.optionCount = getNoteOptionCount(level);

    this.create();
  }

  create() {
    const { scene, doorX, doorY, chord } = this;

    // Create the door sprite (a tall rectangle)
    this.door = scene.add.rectangle(doorX, doorY, TILE_SIZE * 2, TILE_SIZE * 3, 0x8B4513)
      .setOrigin(0.5, 1)
      .setStrokeStyle(3, 0xFFD700);

    // Door lock indicator
    this.lockIcon = scene.add.text(doorX, doorY - TILE_SIZE * 2.5, '🔒', {
      font: '20px monospace'
    }).setOrigin(0.5);

    // Chord name label above door
    this.chordLabel = scene.add.text(doorX, doorY - TILE_SIZE * 3.2, chord.name, {
      font: 'bold 14px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Mini staff showing target notes
    this.staffDisplay = this.createMiniStaff(doorX, doorY - TILE_SIZE * 1.5);

    // Door collision body (blocks passage until opened)
    this.doorBody = scene.physics.add.staticImage(doorX, doorY - TILE_SIZE * 1.5, null);
    this.doorBody.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 3);
    this.doorBody.setVisible(false);
    this.doorBody.refreshBody();

    // Trigger zone for delivering notes
    this.triggerZone = scene.physics.add.staticImage(doorX, doorY - TILE_SIZE * 1.5, null);
    this.triggerZone.setDisplaySize(TILE_SIZE * 3, TILE_SIZE * 3.5);
    this.triggerZone.setVisible(false);
    this.triggerZone.refreshBody();

    // Create floating note sprites
    this.createNoteSprites();

    // Collected notes indicator (bottom of screen)
    this.collectedDisplay = scene.add.text(doorX, doorY + 10, '', {
      font: '11px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.updateCollectedDisplay();
  }

  createMiniStaff(x, y) {
    const group = [];
    const staffWidth = 60;
    const lineSpacing = 6;

    // Draw 5 staff lines
    for (let i = 0; i < 5; i++) {
      const line = this.scene.add.rectangle(x, y + i * lineSpacing - 12, staffWidth, 1, 0xFFFFFF)
        .setAlpha(0.6);
      group.push(line);
    }

    // Show target notes on the staff
    const noteSpacing = staffWidth / (this.chord.notes.length + 1);
    this.chord.notes.forEach((note, i) => {
      const noteX = x - staffWidth / 2 + noteSpacing * (i + 1);
      const noteY = y - 4;
      const noteCircle = this.scene.add.circle(noteX, noteY, 4, NOTE_COLORS[note] || 0xFFFFFF);
      const noteLabel = this.scene.add.text(noteX, noteY + 10, note, {
        font: '8px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5);
      group.push(noteCircle, noteLabel);
    });

    return group;
  }

  createNoteSprites() {
    const { scene, doorX, doorY, chord, optionCount } = this;

    // Build note options: correct notes + random distractors
    const correctNotes = [...chord.notes];
    const distractors = ALL_NOTES.filter(n => !correctNotes.includes(n));
    Phaser.Utils.Array.Shuffle(distractors);

    const numDistractors = optionCount - correctNotes.length;
    const noteOptions = [...correctNotes, ...distractors.slice(0, numDistractors)];
    Phaser.Utils.Array.Shuffle(noteOptions);

    // Spread notes around the door area
    const spreadX = 200;
    const startX = doorX - spreadX;
    const spacing = (spreadX * 2) / (noteOptions.length - 1 || 1);

    noteOptions.forEach((noteName, i) => {
      const nx = startX + i * spacing;
      const ny = doorY - TILE_SIZE * 4 - Math.random() * TILE_SIZE * 2;

      // Create note sprite as a colored circle with label
      const noteSprite = scene.physics.add.sprite(nx, ny, null);
      noteSprite.body.setAllowGravity(false);
      noteSprite.setDisplaySize(28, 28);
      noteSprite.setVisible(false);

      // Visual representation
      const color = NOTE_COLORS[noteName] || 0xFFFFFF;
      const noteVisual = scene.add.circle(nx, ny, 14, color).setStrokeStyle(2, 0xFFFFFF);
      const noteText = scene.add.text(nx, ny, noteName, {
        font: 'bold 10px monospace',
        fill: '#000000'
      }).setOrigin(0.5);

      // Float animation
      scene.tweens.add({
        targets: [noteSprite, noteVisual, noteText],
        y: ny - 8,
        duration: 1200 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Sparkle effect
      scene.tweens.add({
        targets: noteVisual,
        alpha: { from: 0.8, to: 1 },
        duration: 500 + Math.random() * 300,
        yoyo: true,
        repeat: -1
      });

      noteSprite.setData('noteName', noteName);
      noteSprite.setData('visual', noteVisual);
      noteSprite.setData('text', noteText);
      noteSprite.setData('isCorrect', correctNotes.includes(noteName));
      noteSprite.setData('baseX', nx);
      noteSprite.setData('baseY', ny);

      this.noteSprites.push(noteSprite);
    });
  }

  /**
   * Sets up physics overlaps with the player.
   */
  setupOverlap(player) {
    const { scene } = this;

    // Player collides with closed door
    this.doorCollider = scene.physics.add.collider(player, this.doorBody);

    // Player collects note sprites
    this.noteSprites.forEach(noteSprite => {
      scene.physics.add.overlap(player, noteSprite, () => {
        this.collectNote(noteSprite);
      });
    });

    // Player brings notes to door trigger zone
    scene.physics.add.overlap(player, this.triggerZone, () => {
      if (!this.isOpen && this.collectedNotes.length >= this.requiredNotes.length) {
        this.attemptUnlock();
      }
    });
  }

  collectNote(noteSprite) {
    if (this.isOpen) return;
    const noteName = noteSprite.getData('noteName');
    if (this.collectedNotes.includes(noteName)) return;

    this.collectedNotes.push(noteName);

    // Play the note sound
    this.playNoteSound(noteName);

    // Visual feedback: note flies to HUD area
    const visual = noteSprite.getData('visual');
    const text = noteSprite.getData('text');

    this.scene.tweens.add({
      targets: [visual, text],
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.6,
      duration: 300
    });

    // Disable further collection
    noteSprite.body.enable = false;

    this.updateCollectedDisplay();

    // Auto-check when we have enough notes at the door
    if (this.collectedNotes.length >= this.requiredNotes.length) {
      // Brief delay then check
      this.scene.time.delayedCall(300, () => this.attemptUnlock());
    }
  }

  attemptUnlock() {
    if (this.isOpen) return;

    // Check if collected notes match the chord
    const correct = this.requiredNotes.every(n => this.collectedNotes.includes(n));

    if (correct) {
      this.openDoor();
    } else {
      this.failedAttempt();
    }
  }

  openDoor() {
    this.isOpen = true;
    const { scene } = this;

    // Play consonant chord sound
    this.playChordSound(true);

    // Door opening animation
    scene.tweens.add({
      targets: this.door,
      scaleX: 0,
      alpha: 0,
      duration: 800,
      ease: 'Power2'
    });

    scene.tweens.add({
      targets: [this.lockIcon, this.chordLabel, ...this.staffDisplay],
      alpha: 0,
      duration: 400
    });

    // Remove door collider
    if (this.doorCollider) {
      this.doorCollider.destroy();
    }
    this.doorBody.destroy();

    // Remove remaining note sprites
    this.noteSprites.forEach(ns => {
      const visual = ns.getData('visual');
      const textObj = ns.getData('text');
      scene.tweens.add({
        targets: [visual, textObj],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (visual) visual.destroy();
          if (textObj) textObj.destroy();
        }
      });
      ns.destroy();
    });

    // Success particles
    for (let i = 0; i < 12; i++) {
      const px = this.doorX + (Math.random() - 0.5) * 60;
      const py = this.doorY - TILE_SIZE * 1.5 + (Math.random() - 0.5) * 60;
      const particle = scene.add.circle(px, py, 3, 0xFFD700);
      scene.tweens.add({
        targets: particle,
        y: py - 40,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        onComplete: () => particle.destroy()
      });
    }

    // Show educational overlay
    scene.time.delayedCall(600, () => this.showEducationalOverlay());

    // Spawn bonus rewards behind door
    scene.time.delayedCall(1200, () => this.spawnBonusRoom());
  }

  failedAttempt() {
    const { scene } = this;

    // Play dissonant sound
    this.playChordSound(false);

    // Shake the door
    scene.tweens.add({
      targets: this.door,
      x: this.doorX - 3,
      duration: 50,
      yoyo: true,
      repeat: 5,
      onComplete: () => { this.door.x = this.doorX; }
    });

    // Flash lock red
    this.lockIcon.setText('❌');
    scene.time.delayedCall(800, () => {
      if (this.lockIcon) this.lockIcon.setText('🔒');
    });

    // Respawn collected notes
    this.collectedNotes = [];
    this.noteSprites.forEach(ns => {
      if (!ns.active) return;
      const visual = ns.getData('visual');
      const text = ns.getData('text');
      const baseX = ns.getData('baseX');
      const baseY = ns.getData('baseY');

      ns.body.enable = true;
      scene.tweens.add({
        targets: [visual, text],
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        x: baseX,
        y: baseY,
        duration: 500
      });
      ns.setPosition(baseX, baseY);
    });

    this.updateCollectedDisplay();
  }

  showEducationalOverlay() {
    if (this.isShowingOverlay) return;
    this.isShowingOverlay = true;
    const { scene, chord } = this;

    // Semi-transparent background
    const overlay = scene.add.rectangle(
      scene.cameras.main.scrollX + GAME_WIDTH / 2,
      scene.cameras.main.scrollY + GAME_HEIGHT / 2,
      GAME_WIDTH * 0.7,
      140,
      0x000000,
      0.85
    ).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    // Chord formula text
    const formulaText = `${chord.name} = ${chord.notes.join(' + ')}`;
    const title = scene.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 - 35,
      '♪ Chord Unlocked! ♪',
      { font: 'bold 16px monospace', fill: '#FFD700', stroke: '#000', strokeThickness: 2 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const formula = scene.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      formulaText,
      { font: '14px monospace', fill: '#FFFFFF' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const explanation = scene.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25,
      `(${chord.formula})`,
      { font: '11px monospace', fill: '#AADDFF' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Auto-dismiss after 3.5 seconds
    scene.time.delayedCall(3500, () => {
      scene.tweens.add({
        targets: [overlay, title, formula, explanation],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          title.destroy();
          formula.destroy();
          explanation.destroy();
          this.isShowingOverlay = false;
        }
      });
    });
  }

  spawnBonusRoom() {
    const { scene, doorX, doorY, bonusRewards } = this;
    const bonusX = doorX;
    const bonusY = doorY - TILE_SIZE * 1.5;

    // Health pickup
    if (bonusRewards.health !== false) {
      const heart = scene.physics.add.sprite(bonusX - 20, bonusY, 'heart');
      heart.body.setAllowGravity(false);
      heart.setDisplaySize(20, 20);
      scene.tweens.add({
        targets: heart,
        y: bonusY - 6,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      scene.physics.add.overlap(scene.mozart, heart, () => {
        heart.destroy();
        const lives = scene.registry.get('lives') || 0;
        scene.registry.set('lives', Math.min(lives + 1, 5));
        if (scene.sound.get('sfx_coin')) {
          scene.sound.play('sfx_coin', { volume: 0.3 });
        }
      });
    }

    // Score bonus
    if (bonusRewards.score !== false) {
      const gem = scene.physics.add.sprite(bonusX + 20, bonusY, 'musicNote');
      gem.body.setAllowGravity(false);
      gem.setDisplaySize(20, 24);
      gem.setTint(0xFFD700);
      scene.tweens.add({
        targets: gem,
        y: bonusY - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      scene.physics.add.overlap(scene.mozart, gem, () => {
        gem.destroy();
        const score = scene.registry.get('score') + 500;
        scene.registry.set('score', score);
        if (scene.sound.get('sfx_coin')) {
          scene.sound.play('sfx_coin', { volume: 0.4 });
        }
      });
    }

    // Composition note (if specified)
    if (bonusRewards.compositionNote) {
      const compNote = scene.physics.add.sprite(bonusX, bonusY - 30, 'compositionNote');
      compNote.body.setAllowGravity(false);
      compNote.setDisplaySize(18, 22);
      compNote.setTint(0x88FFAA);
      scene.tweens.add({
        targets: compNote,
        y: bonusY - 36,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      scene.physics.add.overlap(scene.mozart, compNote, () => {
        compNote.destroy();
        const score = scene.registry.get('score') + 300;
        scene.registry.set('score', score);
        if (scene.sound.get('sfx_coin')) {
          scene.sound.play('sfx_coin', { volume: 0.3 });
        }
      });
    }
  }

  updateCollectedDisplay() {
    if (!this.collectedDisplay) return;
    if (this.isOpen) {
      this.collectedDisplay.setText('');
      return;
    }
    const collected = this.collectedNotes.join(', ') || 'none';
    this.collectedDisplay.setText(`Notes: [${collected}] / ${this.chord.name}`);
  }

  /**
   * Play a single note using Web Audio API.
   */
  playNoteSound(noteName) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const noteFreqs = {
        'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
        'G': 392.00, 'A': 440.00, 'B': 493.88,
        'Bb': 466.16, 'Eb': 311.13, 'F#': 369.99, 'G#': 415.30, 'A#': 466.16
      };
      const freq = noteFreqs[noteName] || 440;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio not available
    }
  }

  /**
   * Play full chord sound (consonant or dissonant).
   */
  playChordSound(consonant) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const freqs = consonant
        ? this.chord.freqs
        : [277, 293, 311]; // Clashing frequencies for dissonance

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = consonant ? 'triangle' : 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (consonant ? 1.0 : 0.5));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + (consonant ? 1.0 : 0.5));
      });
    } catch (e) {
      // Audio not available
    }
  }

  destroy() {
    this.noteSprites.forEach(ns => {
      const visual = ns.getData('visual');
      const text = ns.getData('text');
      if (visual) visual.destroy();
      if (text) text.destroy();
      ns.destroy();
    });
    if (this.door) this.door.destroy();
    if (this.lockIcon) this.lockIcon.destroy();
    if (this.chordLabel) this.chordLabel.destroy();
    if (this.staffDisplay) this.staffDisplay.forEach(s => s.destroy());
    if (this.doorBody) this.doorBody.destroy();
    if (this.triggerZone) this.triggerZone.destroy();
    if (this.collectedDisplay) this.collectedDisplay.destroy();
  }
}
