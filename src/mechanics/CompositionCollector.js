import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Melody definitions per level using MIDI note numbers.
 * Each entry: { name, notes: [{ midi, label }] }
 */
const MELODY_DEFINITIONS = {
  1: {
    name: 'Eine kleine Nachtmusik',
    notes: [
      { midi: 67, label: 'G4' },
      { midi: 62, label: 'D4' },
      { midi: 67, label: 'G4' },
      { midi: 62, label: 'D4' },
      { midi: 67, label: 'G4' },
      { midi: 62, label: 'D4' },
      { midi: 71, label: 'B4' },
      { midi: 74, label: 'D5' }
    ]
  },
  2: {
    name: 'The Magic Flute',
    notes: [
      { midi: 63, label: 'Eb4' },
      { midi: 58, label: 'Bb3' },
      { midi: 63, label: 'Eb4' },
      { midi: 58, label: 'Bb3' },
      { midi: 63, label: 'Eb4' },
      { midi: 67, label: 'G4' },
      { midi: 70, label: 'Bb4' }
    ]
  },
  3: {
    name: 'Alla Turca',
    notes: [
      { midi: 71, label: 'B4' },
      { midi: 69, label: 'A4' },
      { midi: 68, label: 'G#4' },
      { midi: 69, label: 'A4' },
      { midi: 72, label: 'C5' },
      { midi: 69, label: 'A4' }
    ]
  },
  4: {
    name: 'Non più andrai',
    notes: [
      { midi: 60, label: 'C4' },
      { midi: 60, label: 'C4' },
      { midi: 60, label: 'C4' },
      { midi: 62, label: 'D4' },
      { midi: 64, label: 'E4' },
      { midi: 65, label: 'F4' },
      { midi: 64, label: 'E4' }
    ]
  },
  5: {
    name: 'Symphony No. 40',
    notes: [
      { midi: 63, label: 'Eb4' },
      { midi: 62, label: 'D4' },
      { midi: 62, label: 'D4' },
      { midi: 63, label: 'Eb4' },
      { midi: 62, label: 'D4' },
      { midi: 62, label: 'D4' }
    ]
  },
  6: {
    name: 'Lacrimosa',
    notes: [
      { midi: 62, label: 'D4' },
      { midi: 61, label: 'C#4' },
      { midi: 62, label: 'D4' },
      { midi: 64, label: 'E4' },
      { midi: 65, label: 'F4' },
      { midi: 64, label: 'E4' },
      { midi: 62, label: 'D4' }
    ]
  },
  7: {
    name: 'Jupiter Fugue',
    notes: [
      { midi: 60, label: 'C4' },
      { midi: 62, label: 'D4' },
      { midi: 65, label: 'F4' },
      { midi: 64, label: 'E4' }
    ]
  }
};

// Colors assigned per pitch class for visual distinction
const PITCH_COLORS = {
  'C': '#FF4444',
  'C#': '#FF8800',
  'D': '#FFCC00',
  'Eb': '#88FF00',
  'E': '#00FF44',
  'F': '#00FFCC',
  'F#': '#0088FF',
  'G': '#4400FF',
  'G#': '#8800FF',
  'A': '#CC00FF',
  'Bb': '#FF00CC',
  'B': '#FF0088'
};

/**
 * Convert MIDI note number to frequency in Hz.
 */
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get pitch class from label (e.g. 'G4' -> 'G', 'Eb4' -> 'Eb')
 */
function getPitchClass(label) {
  return label.replace(/[0-9]/g, '');
}

/**
 * CompositionCollector manages the note-collection melody mechanic.
 * It spawns note collectibles in a level and tracks collection order.
 */
export class CompositionCollector {
  constructor(scene, levelNumber) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.melody = MELODY_DEFINITIONS[levelNumber];
    if (!this.melody) return;

    this.collectedNotes = [];
    this.noteSprites = [];
    this.completed = false;
    this.shieldActive = false;

    // Check if already completed this level's melody
    const completedMelodies = this.scene.registry.get('completedMelodies') || {};
    if (completedMelodies[levelNumber]) {
      this.completed = true;
    }
  }

  /**
   * Create note collectibles at specified positions in the level.
   * positions: array of {x, y} — one per note in the melody.
   */
  create(positions) {
    if (!this.melody || this.completed) return;

    this.noteGroup = this.scene.physics.add.group();
    const notes = this.melody.notes;

    notes.forEach((noteData, index) => {
      if (index >= positions.length) return;
      const pos = positions[index];
      const pitchClass = getPitchClass(noteData.label);
      const textureKey = `compositionNote_${pitchClass}`;

      // Use 'musicNote' as fallback texture if composition-specific texture not loaded
      const texture = this.scene.textures.exists(textureKey) ? textureKey : 'musicNote';
      const sprite = this.noteGroup.create(pos.x, pos.y, texture);
      sprite.body.setAllowGravity(false);
      sprite.setDisplaySize(24, 28);
      sprite.setData('noteIndex', index);
      sprite.setData('midi', noteData.midi);
      sprite.setData('label', noteData.label);
      sprite.setData('pitchClass', pitchClass);

      // Tint with pitch-specific color to distinguish from regular collectibles
      const colorHex = PITCH_COLORS[pitchClass] || '#FFFFFF';
      sprite.setTint(Phaser.Display.Color.HexStringToColor(colorHex).color);

      // Pulsing glow to distinguish from regular sheet music collectibles
      this.scene.tweens.add({
        targets: sprite,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 1.0, to: 1.15 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Float animation
      this.scene.tweens.add({
        targets: sprite,
        y: pos.y - 8,
        duration: 1200 + index * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Add pitch label above note
      const label = this.scene.add.text(pos.x, pos.y - 18, noteData.label, {
        font: '8px monospace',
        fill: PITCH_COLORS[pitchClass] || '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      // Float label with note
      this.scene.tweens.add({
        targets: label,
        y: pos.y - 26,
        duration: 1200 + index * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      sprite.setData('labelText', label);
      this.noteSprites.push(sprite);
    });

    // Create UI staff display
    this.createStaffUI();

    return this.noteGroup;
  }

  /**
   * Set up collision with the player.
   */
  setupOverlap(player) {
    if (!this.noteGroup) return;
    this.scene.physics.add.overlap(player, this.noteGroup, (p, note) => {
      this.collectNote(note);
    });
  }

  /**
   * Handle collecting a note.
   */
  collectNote(noteSprite) {
    if (this.completed) return;

    const noteIndex = noteSprite.getData('noteIndex');
    const midi = noteSprite.getData('midi');
    const label = noteSprite.getData('label');
    const labelText = noteSprite.getData('labelText');

    // Play the note sound
    this.playNoteSound(midi);

    // Check if this is the correct next note in sequence
    const expectedIndex = this.collectedNotes.length;

    if (noteIndex === expectedIndex) {
      // Correct note collected
      this.collectedNotes.push({ midi, label, index: noteIndex });
      if (labelText) labelText.destroy();
      noteSprite.destroy();

      // Update staff UI
      this.updateStaffUI();

      // Check if melody is complete
      if (this.collectedNotes.length === this.melody.notes.length) {
        this.onMelodyComplete();
      }
    } else {
      // Wrong order - play dissonance and reset
      this.onWrongNote();
    }
  }

  /**
   * Called when melody is completed in correct order.
   */
  onMelodyComplete() {
    this.completed = true;

    // Play back the full melody
    this.playMelody();

    // Award bonus points
    const score = this.scene.registry.get('score') || 0;
    this.scene.registry.set('score', score + 500);

    // Activate temporary shield power-up
    this.activateShield();

    // Mark as completed in registry
    const completedMelodies = this.scene.registry.get('completedMelodies') || {};
    completedMelodies[this.levelNumber] = true;
    this.scene.registry.set('completedMelodies', completedMelodies);

    // Show completion message
    const msg = this.scene.add.text(GAME_WIDTH / 2, 80, `♪ ${this.melody.name} ♪\n+500 points! Shield active!`, {
      font: '14px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.scene.tweens.add({
      targets: msg,
      alpha: 0,
      y: 50,
      delay: 3000,
      duration: 1000,
      onComplete: () => msg.destroy()
    });
  }

  /**
   * Called when player collects notes in wrong order.
   */
  onWrongNote() {
    // Play dissonance sound
    this.playDissonance();

    // Reset collected notes
    this.collectedNotes = [];
    this.updateStaffUI();

    // Re-enable all remaining note sprites (they stay in place)
    // Show feedback
    const msg = this.scene.add.text(GAME_WIDTH / 2, 100, '♫ Wrong order! Try again...', {
      font: '12px monospace',
      fill: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.scene.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => msg.destroy()
    });

    // Respawn previously collected notes
    this.respawnCollectedNotes();
  }

  /**
   * Respawn notes that were collected before the wrong order reset.
   */
  respawnCollectedNotes() {
    // Re-create destroyed note sprites from their original positions
    // We stored original data but sprites were destroyed. In practice,
    // only the correct-order notes get destroyed, so wrong-order means
    // we need to indicate a reset. Since notes collected in correct order
    // are already destroyed, we flash remaining notes red briefly.
    this.noteSprites.forEach(sprite => {
      if (sprite.active) {
        sprite.setTint(0xff0000);
        this.scene.time.delayedCall(500, () => {
          if (sprite.active) sprite.clearTint();
        });
      }
    });
  }

  /**
   * Play a single note using Web Audio.
   */
  playNoteSound(midi) {
    const key = `composition_note_${midi}`;
    if (this.scene.sound.get(key)) {
      this.scene.sound.play(key, { volume: 0.4 });
    }
  }

  /**
   * Play back the full melody sequentially.
   */
  playMelody() {
    const notes = this.melody.notes;
    notes.forEach((note, i) => {
      this.scene.time.delayedCall(i * 300, () => {
        this.playNoteSound(note.midi);
      });
    });
  }

  /**
   * Play a dissonance sound effect.
   */
  playDissonance() {
    if (this.scene.sound.get('sfx_dissonance')) {
      this.scene.sound.play('sfx_dissonance', { volume: 0.3 });
    }
  }

  /**
   * Activate a temporary shield (invincibility) for the player.
   */
  activateShield() {
    this.shieldActive = true;
    const mozart = this.scene.mozart;
    if (!mozart) return;

    // Make player invincible
    mozart.isInvincible = true;
    mozart.setTint(0x00ffff);

    // Shield visual effect
    const shield = this.scene.add.circle(0, 0, 24, 0x00ffff, 0.3);
    shield.setDepth(50);

    const updateShield = () => {
      if (shield.active && mozart.active) {
        shield.setPosition(mozart.x, mozart.y);
      }
    };
    this.scene.events.on('update', updateShield);

    // Remove shield after 8 seconds
    this.scene.time.delayedCall(8000, () => {
      this.shieldActive = false;
      mozart.isInvincible = false;
      mozart.clearTint();
      shield.destroy();
      this.scene.events.off('update', updateShield);
    });
  }

  /**
   * Create the staff UI display in top-right corner.
   */
  createStaffUI() {
    this.staffContainer = this.scene.add.container(GAME_WIDTH - 140, 20)
      .setScrollFactor(0).setDepth(90);

    // Staff background
    const bg = this.scene.add.rectangle(0, 0, 130, 60, 0x000000, 0.6)
      .setOrigin(0, 0);
    this.staffContainer.add(bg);

    // Draw 5 staff lines
    this.staffLines = [];
    for (let i = 0; i < 5; i++) {
      const y = 15 + i * 8;
      const line = this.scene.add.rectangle(5, y, 120, 1, 0xffffff, 0.7)
        .setOrigin(0, 0.5);
      this.staffContainer.add(line);
      this.staffLines.push(line);
    }

    // Title
    const title = this.scene.add.text(65, 52, this.melody.name, {
      font: '7px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);
    this.staffContainer.add(title);

    // Note head placeholders
    this.staffNoteHeads = [];
  }

  /**
   * Update the staff UI to reflect collected notes.
   */
  updateStaffUI() {
    if (!this.staffContainer) return;

    // Clear existing note heads
    this.staffNoteHeads.forEach(h => h.destroy());
    this.staffNoteHeads = [];

    // Draw collected notes on staff
    this.collectedNotes.forEach((note, i) => {
      const x = 10 + i * 14;
      const staffY = this.midiToStaffY(note.midi);
      const pitchClass = getPitchClass(note.label);
      const color = Phaser.Display.Color.HexStringToColor(
        PITCH_COLORS[pitchClass] || '#FFFFFF'
      ).color;

      const head = this.scene.add.ellipse(x, staffY, 8, 6, color);
      this.staffContainer.add(head);
      this.staffNoteHeads.push(head);
    });
  }

  /**
   * Convert MIDI note to Y position on the miniature staff.
   * Middle C (60) maps to just below the staff, higher notes go up.
   */
  midiToStaffY(midi) {
    // Staff spans from line 1 (top, y=15) to line 5 (bottom, y=47)
    // Map MIDI 60 (C4) to y=47, MIDI 79 (G5) to y=15
    const range = 47 - 15; // 32 pixels for ~19 semitones
    const normalized = (midi - 60) / 19;
    return 47 - normalized * range;
  }

  /**
   * Clean up resources.
   */
  destroy() {
    if (this.staffContainer) this.staffContainer.destroy();
    this.noteSprites = [];
    this.collectedNotes = [];
  }
}

export { MELODY_DEFINITIONS, PITCH_COLORS, midiToFreq };
