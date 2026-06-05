import Phaser from 'phaser';
import { GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';

/**
 * Note frequencies (Hz) for synthesis, mapped by note name.
 */
const NOTE_FREQUENCIES = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25
};

/**
 * Color palette for each note, providing visual distinction.
 */
const NOTE_COLORS = {
  'C4': 0xFF4444, 'D4': 0xFFCC00, 'E4': 0x00FF44, 'F4': 0x00FFCC,
  'G4': 0x4400FF, 'A4': 0xCC00FF, 'B4': 0xFF0088,
  'C5': 0xFF6666, 'D5': 0xFFDD44, 'E5': 0x44FF66
};

/**
 * Puzzle melodies per level — scales up in difficulty.
 * Levels 1-2: simple ascending scales (4 notes).
 * Levels 3-4: slightly harder patterns (5 notes).
 * Levels 5-7: Mozart phrase fragments (5-6 notes).
 */
const PUZZLE_MELODIES = {
  1: ['C4', 'D4', 'E4', 'G4'],
  2: ['D4', 'E4', 'G4', 'A4'],
  3: ['C4', 'E4', 'G4', 'C5', 'G4'],
  4: ['E4', 'D4', 'C4', 'D4', 'E4'],
  5: ['G4', 'A4', 'B4', 'D5', 'B4', 'G4'],
  6: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4'],
  7: ['C5', 'B4', 'A4', 'G4', 'A4', 'B4']
};

/**
 * PitchPuzzle creates and manages an in-level pitch matching puzzle.
 *
 * The player must jump on platforms in the correct order to match
 * a target melody. Each platform produces a unique pitch when landed on.
 * Correct completion opens a gate to a bonus area with collectibles.
 */
export class PitchPuzzle {
  /**
   * @param {Phaser.Scene} scene - The level scene
   * @param {number} levelNumber - Current level (1-7)
   * @param {object} config - Position config { x, y } for puzzle area origin
   */
  constructor(scene, levelNumber, config) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.melody = PUZZLE_MELODIES[levelNumber] || PUZZLE_MELODIES[1];
    this.config = config;

    this.playerSequence = [];
    this.solved = false;
    this.resetting = false;

    // Determine unique notes needed for platforms
    this.uniqueNotes = [...new Set(this.melody)];
    // Add extra distractor notes to make it challenging
    const allNotes = Object.keys(NOTE_FREQUENCIES);
    for (const note of allNotes) {
      if (this.uniqueNotes.length >= 6) break;
      if (!this.uniqueNotes.includes(note)) {
        this.uniqueNotes.push(note);
      }
    }
    // Shuffle platform order so spatial position differs from musical order
    this.platformNotes = Phaser.Utils.Array.Shuffle([...this.uniqueNotes]);

    this.platforms = [];
    this.platformGraphics = [];
    this.gate = null;
    this.bonusCollectibles = null;
    this.staffDisplay = null;
  }

  /**
   * Create all puzzle elements: platforms, staff display, gate, bonus area.
   */
  create() {
    const { x, y } = this.config;
    const platformSpacing = 80;
    const platformWidth = TILE_SIZE * 2;
    const platformHeight = TILE_SIZE / 2;

    // Create puzzle platforms
    this.platformGroup = this.scene.physics.add.staticGroup();

    this.platformNotes.forEach((note, index) => {
      const px = x + index * platformSpacing;
      const py = y + ((index % 2 === 0) ? 0 : -30); // stagger heights

      const platform = this.platformGroup.create(px, py, 'platform');
      platform.setDisplaySize(platformWidth, platformHeight);
      platform.refreshBody();
      platform.setData('note', note);
      platform.setData('index', index);

      // Color overlay for the platform
      const colorRect = this.scene.add.rectangle(px, py, platformWidth, platformHeight, NOTE_COLORS[note])
        .setAlpha(0.6)
        .setDepth(1);

      // Note label
      const label = this.scene.add.text(px, py - 20, note, {
        font: '11px monospace',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(2);

      this.platforms.push(platform);
      this.platformGraphics.push({ rect: colorRect, label });
    });

    // Create the mini staff display above the puzzle
    this.createStaffDisplay(x, y - 90);

    // Create the gate (locked until solved)
    const gateX = x + this.platformNotes.length * platformSpacing + 40;
    const gateY = y + 10;
    this.gate = this.scene.add.rectangle(gateX, gateY, TILE_SIZE, TILE_SIZE * 3, 0x884422)
      .setDepth(1);
    this.gateBody = this.scene.physics.add.staticImage(gateX, gateY, 'platform');
    this.gateBody.setDisplaySize(TILE_SIZE, TILE_SIZE * 3);
    this.gateBody.refreshBody();
    this.gateBody.setVisible(false);

    // Gate lock indicator
    this.lockIcon = this.scene.add.text(gateX, gateY, '🔒', {
      font: '20px serif'
    }).setOrigin(0.5).setDepth(2);

    // Bonus collectibles behind the gate
    this.bonusCollectibles = this.scene.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const bx = gateX + 60 + i * 40;
      const by = gateY - 20 + Math.sin(i) * 15;
      const collectible = this.bonusCollectibles.create(bx, by, 'musicNote');
      collectible.body.setAllowGravity(false);
      collectible.setDisplaySize(20, 24);
      this.scene.tweens.add({
        targets: collectible,
        y: by - 8,
        duration: 900 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Puzzle area label
    this.scene.add.text(x + (this.platformNotes.length * platformSpacing) / 2, y - 120, '♪ Pitch Puzzle ♪', {
      font: '12px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(2);
  }

  /**
   * Draw a small staff showing the target melody using Phaser graphics.
   */
  createStaffDisplay(x, y) {
    const staffWidth = this.melody.length * 30 + 40;
    const staffHeight = 50;
    const graphics = this.scene.add.graphics();
    graphics.setDepth(3);

    // Staff background
    graphics.fillStyle(0x1a1a2e, 0.85);
    graphics.fillRoundedRect(x - 10, y - 5, staffWidth, staffHeight, 6);

    // Draw 5 staff lines
    graphics.lineStyle(1, 0xaaaaaa, 0.6);
    for (let i = 0; i < 5; i++) {
      const ly = y + 5 + i * 8;
      graphics.beginPath();
      graphics.moveTo(x, ly);
      graphics.lineTo(x + staffWidth - 20, ly);
      graphics.strokePath();
    }

    // Draw notes on the staff
    const notePositionMap = {
      'C4': 36, 'D4': 32, 'E4': 28, 'F4': 24, 'G4': 20,
      'A4': 16, 'B4': 12, 'C5': 8, 'D5': 4, 'E5': 0
    };

    this.melody.forEach((note, index) => {
      const nx = x + 15 + index * 30;
      const ny = y + 5 + (notePositionMap[note] || 20);
      const color = NOTE_COLORS[note] || 0xFFFFFF;

      graphics.fillStyle(color, 1);
      graphics.fillEllipse(nx, ny, 10, 8);
    });

    this.staffDisplay = graphics;

    // Progress indicators (empty circles to fill as notes are matched)
    this.progressDots = [];
    this.melody.forEach((note, index) => {
      const dot = this.scene.add.circle(x + 15 + index * 30, y + staffHeight + 8, 5, 0x333333)
        .setStrokeStyle(1, 0xFFFFFF)
        .setDepth(3);
      this.progressDots.push(dot);
    });
  }

  /**
   * Set up collision/overlap between the player and puzzle platforms.
   * @param {Phaser.GameObjects.Sprite} player - Mozart sprite
   */
  setupOverlap(player) {
    this.player = player;

    // Collide so player can stand on platforms
    this.scene.physics.add.collider(player, this.platformGroup, (p, platform) => {
      // Only trigger when landing (moving downward and now touching)
      if (p.body.touching.down && !this.solved && !this.resetting) {
        const note = platform.getData('note');
        if (note && (!this._lastLandedPlatform || this._lastLandedPlatform !== platform)) {
          this._lastLandedPlatform = platform;
          this.onPlatformLand(note, platform);
        }
      }
    });

    // Collide with gate (blocks passage until solved)
    this.gateCollider = this.scene.physics.add.collider(player, this.gateBody);

    // Bonus collectibles overlap
    this.scene.physics.add.overlap(player, this.bonusCollectibles, (p, collectible) => {
      collectible.destroy();
      const score = this.scene.registry.get('score') + 75;
      this.scene.registry.set('score', score);
      if (this.scene.sound.get('sfx_coin')) {
        this.scene.sound.play('sfx_coin', { volume: 0.3 });
      }
    });
  }

  /**
   * Called when the player lands on a puzzle platform.
   */
  onPlatformLand(note, platform) {
    // Play the note sound
    this.playNote(note);

    // Visual feedback — flash the platform
    const idx = platform.getData('index');
    if (this.platformGraphics[idx]) {
      this.scene.tweens.add({
        targets: this.platformGraphics[idx].rect,
        alpha: { from: 1, to: 0.6 },
        duration: 300,
        ease: 'Quad.easeOut'
      });
    }

    // Check against melody
    const expectedNote = this.melody[this.playerSequence.length];
    if (note === expectedNote) {
      this.playerSequence.push(note);
      this.updateProgress();

      if (this.playerSequence.length === this.melody.length) {
        this.solvePuzzle();
      }
    } else {
      this.failPuzzle();
    }
  }

  /**
   * Update the progress dots display.
   */
  updateProgress() {
    const count = this.playerSequence.length;
    for (let i = 0; i < this.progressDots.length; i++) {
      if (i < count) {
        const color = NOTE_COLORS[this.melody[i]] || 0x00FF00;
        this.progressDots[i].setFillStyle(color);
      }
    }
  }

  /**
   * Puzzle solved — open the gate and reward the player.
   */
  solvePuzzle() {
    this.solved = true;

    // Play success arpeggio
    this.playSuccessSound();

    // Open the gate with animation
    this.scene.tweens.add({
      targets: [this.gate, this.lockIcon],
      alpha: 0,
      y: this.gate.y - 40,
      duration: 600,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.gate.destroy();
        this.lockIcon.destroy();
        this.gateBody.destroy();
        if (this.gateCollider) {
          this.scene.physics.world.removeCollider(this.gateCollider);
        }
      }
    });

    // Flash all progress dots gold
    this.progressDots.forEach(dot => {
      dot.setFillStyle(0xFFD700);
      this.scene.tweens.add({
        targets: dot,
        scaleX: 1.5, scaleY: 1.5,
        duration: 300,
        yoyo: true
      });
    });

    // Score bonus
    const bonus = 200 * this.levelNumber;
    const score = this.scene.registry.get('score') + bonus;
    this.scene.registry.set('score', score);

    // Show success text
    const txt = this.scene.add.text(
      this.config.x + (this.platformNotes.length * 80) / 2,
      this.config.y - 140,
      `♪ Melody Complete! +${bonus} ♪`,
      { font: '14px monospace', fill: '#FFD700', stroke: '#000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(10);

    this.scene.tweens.add({
      targets: txt,
      alpha: 0,
      y: txt.y - 30,
      delay: 2000,
      duration: 1000
    });
  }

  /**
   * Wrong note — play dissonant sound and reset.
   */
  failPuzzle() {
    this.resetting = true;

    // Play dissonance
    if (this.scene.sound.get('sfx_dissonance')) {
      this.scene.sound.play('sfx_dissonance', { volume: 0.4 });
    }

    // Flash platforms red briefly
    this.platformGraphics.forEach(pg => {
      this.scene.tweens.add({
        targets: pg.rect,
        fillColor: { from: 0xFF0000, to: NOTE_COLORS[this.platformNotes[this.platforms.indexOf(pg.rect)]] || 0x888888 },
        alpha: { from: 1, to: 0.6 },
        duration: 500
      });
    });

    // Show "Try Again" text
    const txt = this.scene.add.text(
      this.config.x + (this.platformNotes.length * 80) / 2,
      this.config.y - 60,
      '✗ Wrong order! Try again...',
      { font: '12px monospace', fill: '#FF4444', stroke: '#000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(10);

    this.scene.tweens.add({
      targets: txt,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => txt.destroy()
    });

    // Reset after a short delay
    this.scene.time.delayedCall(800, () => {
      this.playerSequence = [];
      this._lastLandedPlatform = null;
      this.resetting = false;

      // Reset progress dots
      this.progressDots.forEach(dot => {
        dot.setFillStyle(0x333333);
      });
    });
  }

  /**
   * Play a note using the pre-generated composition_note audio.
   */
  playNote(noteName) {
    const freq = NOTE_FREQUENCIES[noteName];
    if (!freq) return;

    // Convert note name to MIDI for the existing audio key
    const midi = this.noteToMidi(noteName);
    const key = `composition_note_${midi}`;

    if (this.scene.sound.get(key)) {
      this.scene.sound.play(key, { volume: 0.5 });
    }
  }

  /**
   * Convert note name to MIDI number.
   */
  noteToMidi(noteName) {
    const noteMap = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    };
    const match = noteName.match(/^([A-G])(\d)$/);
    if (!match) return 60;
    const [, letter, octave] = match;
    return 12 + parseInt(octave) * 12 + noteMap[letter];
  }

  /**
   * Play a rising arpeggio as success feedback.
   */
  playSuccessSound() {
    this.melody.forEach((note, i) => {
      this.scene.time.delayedCall(i * 150, () => {
        this.playNote(note);
      });
    });
  }

  /**
   * Reset when player leaves puzzle area (optional cleanup).
   */
  reset() {
    if (this.solved) return;
    this.playerSequence = [];
    this._lastLandedPlatform = null;
    this.progressDots.forEach(dot => dot.setFillStyle(0x333333));
  }
}
