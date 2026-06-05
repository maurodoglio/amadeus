import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * TIME_SIGNATURES defines the musical structure for each difficulty tier.
 * Each entry contains beats per measure, the beat unit, and display label.
 */
const TIME_SIGNATURES = {
  1: { beats: 4, unit: 4, label: '4/4', name: 'Common Time' },
  2: { beats: 3, unit: 4, label: '3/4', name: 'Waltz Time' },
  3: { beats: 6, unit: 8, label: '6/8', name: 'Compound Duple' }
};

/**
 * NOTE_TYPES defines progressive difficulty through note subdivisions.
 */
const NOTE_TYPES = {
  quarter: { divisions: 1, label: '♩', name: 'Quarter Note' },
  eighth: { divisions: 2, label: '♪', name: 'Eighth Note' },
  sixteenth: { divisions: 4, label: '♬', name: 'Sixteenth Note' }
};

/**
 * Grading thresholds for hit accuracy (in pixels from hit zone center).
 */
const HIT_WINDOWS = {
  PERFECT: 15,
  GREAT: 30,
  GOOD: 50
};

/**
 * Star rating thresholds based on weighted score percentage.
 */
const STAR_THRESHOLDS = { three: 90, two: 70, one: 50 };

/**
 * Rhythm mini-game scene — Guitar Hero-style note highway with
 * time signature teaching, performance grading, and star rewards.
 */
export class RhythmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RhythmScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'Level1Scene';
    this.difficulty = data.difficulty || 1; // 1-3
    this.playerX = data.playerX || 100;
    this.playerY = data.playerY || 300;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0620');

    // Determine time signature and note types for this difficulty
    this.timeSignature = TIME_SIGNATURES[this.difficulty];
    this.allowedNoteTypes = this.getNoteTypesForDifficulty();

    // Highway layout constants
    this.highwayTop = 100;
    this.highwayBottom = GAME_HEIGHT - 80;
    this.highwayHeight = this.highwayBottom - this.highwayTop;
    this.hitZoneX = 120;
    this.spawnX = GAME_WIDTH + 30;

    // Lane positions (4 lanes)
    this.lanes = [];
    const laneCount = 4;
    for (let i = 0; i < laneCount; i++) {
      this.lanes.push(this.highwayTop + (this.highwayHeight / (laneCount + 1)) * (i + 1));
    }

    // Game state
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfects = 0;
    this.greats = 0;
    this.goods = 0;
    this.misses = 0;
    this.activeNotes = [];
    this.noteSpeed = 220 + (this.difficulty * 70);
    this.songDuration = 10000 + (this.difficulty * 4000);
    this.songStartTime = 0;
    this.songEnded = false;
    this.resultsShown = false;

    // Draw the note highway
    this.drawHighway();

    // Generate note pattern
    this.notePattern = this.generateNotePattern();
    this.nextNoteIndex = 0;

    // Create HUD
    this.createHUD();

    // Input setup
    this.setupInput();

    // Show educational overlay first, then countdown
    this.showTimeSignatureOverlay();

    // Web Audio API click sound (generated)
    this.createClickSound();
  }

  /** Returns allowed note types based on difficulty level */
  getNoteTypesForDifficulty() {
    switch (this.difficulty) {
      case 1: return ['quarter'];
      case 2: return ['quarter', 'eighth'];
      case 3: return ['quarter', 'eighth', 'sixteenth'];
      default: return ['quarter'];
    }
  }

  /** Draws the Guitar Hero-style highway with lane tracks and hit zone */
  drawHighway() {
    // Highway background
    this.add.rectangle(GAME_WIDTH / 2, (this.highwayTop + this.highwayBottom) / 2,
      GAME_WIDTH - 40, this.highwayHeight + 20, 0x1a0a3e, 0.8)
      .setStrokeStyle(2, 0x4a2a8e);

    // Lane divider lines
    this.lanes.forEach((y) => {
      this.add.line(0, 0, 60, y, GAME_WIDTH - 20, y, 0x3a1a6e, 0.4)
        .setOrigin(0, 0);
    });

    // Beat markers (vertical lines scrolling along highway)
    this.beatMarkers = this.add.group();

    // Hit zone — glowing vertical bar
    this.hitZoneGlow = this.add.rectangle(this.hitZoneX, (this.highwayTop + this.highwayBottom) / 2,
      6, this.highwayHeight + 10, 0xffd700, 0.15);
    this.hitZoneLine = this.add.rectangle(this.hitZoneX, (this.highwayTop + this.highwayBottom) / 2,
      4, this.highwayHeight + 10, 0xffd700, 0.7)
      .setStrokeStyle(1, 0xffffff);

    // Hit zone target circles per lane
    const laneColors = [0xff6b6b, 0x6bff6b, 0x6b9fff, 0xffff6b];
    this.laneTargets = [];
    this.lanes.forEach((y, i) => {
      const target = this.add.circle(this.hitZoneX, y, 14, laneColors[i], 0.2)
        .setStrokeStyle(2, laneColors[i]);
      this.laneTargets.push(target);
    });

    // Lane key labels
    const laneKeys = ['D', 'F', 'J', 'K'];
    this.lanes.forEach((y, i) => {
      this.add.text(35, y, laneKeys[i], {
        font: 'bold 14px monospace',
        fill: '#888888'
      }).setOrigin(0.5);
    });

    // Pulsing glow animation on hit zone
    this.tweens.add({
      targets: this.hitZoneGlow,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  /** Creates the HUD elements (score, combo, time signature indicator) */
  createHUD() {
    // Score
    this.scoreText = this.add.text(GAME_WIDTH - 20, 15, 'Score: 0', {
      font: 'bold 14px monospace',
      fill: '#FFFFFF'
    }).setOrigin(1, 0);

    // Combo counter
    this.comboText = this.add.text(GAME_WIDTH - 20, 35, '', {
      font: 'bold 16px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 0);

    // Time signature badge
    this.add.rectangle(70, 25, 80, 30, 0x2a1a4e, 0.9)
      .setStrokeStyle(1, 0xffd700);
    this.add.text(70, 25, this.timeSignature.label, {
      font: 'bold 18px monospace',
      fill: '#FFD700'
    }).setOrigin(0.5);

    // Difficulty label
    const diffNames = ['Andante', 'Allegro', 'Presto'];
    this.add.text(70, 50, diffNames[this.difficulty - 1], {
      font: '10px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5);

    // Feedback text (Perfect/Great/Good/Miss)
    this.feedbackText = this.add.text(this.hitZoneX + 80, (this.highwayTop + this.highwayBottom) / 2, '', {
      font: 'bold 20px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    // Progress bar
    this.progressBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, GAME_WIDTH - 100, 8, 0x222222)
      .setStrokeStyle(1, 0x444444);
    this.progressFill = this.add.rectangle(
      50, GAME_HEIGHT - 30, 0, 6, 0xffd700
    ).setOrigin(0, 0.5);
  }

  /** Sets up keyboard input for the 4 lanes */
  setupInput() {
    this.keys = {
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      K: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
    };

    this.keyLaneMap = { D: 0, F: 1, J: 2, K: 3 };

    Object.keys(this.keys).forEach(keyName => {
      this.keys[keyName].on('down', () => this.onKeyPress(this.keyLaneMap[keyName]));
    });
  }

  /** Creates a simple click/tick sound using Web Audio API */
  createClickSound() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  /** Plays a short pitched click for note hits */
  playHitSound(rating) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const freqMap = { PERFECT: 880, GREAT: 660, GOOD: 440 };
      osc.frequency.value = freqMap[rating] || 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch (e) {
      // Gracefully ignore audio errors
    }
  }

  /** Plays a low buzz for misses */
  playMissSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = 120;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch (e) {
      // Gracefully ignore audio errors
    }
  }

  /** Displays an educational overlay teaching the time signature */
  showTimeSignatureOverlay() {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(100);

    const tsLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, this.timeSignature.label, {
      font: 'bold 64px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(101);

    const tsName = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.timeSignature.name, {
      font: '20px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(101);

    const noteTypesStr = this.allowedNoteTypes
      .map(t => `${NOTE_TYPES[t].label} ${NOTE_TYPES[t].name}`)
      .join('  •  ');

    const noteInfo = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, noteTypesStr, {
      font: '14px monospace',
      fill: '#AADDFF'
    }).setOrigin(0.5).setDepth(101);

    const explanation = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80,
      `${this.timeSignature.beats} beats per measure, ${this.timeSignature.unit === 4 ? 'quarter' : 'eighth'} note gets one beat`, {
      font: '12px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5).setDepth(101);

    // Auto-dismiss after 3 seconds then start countdown
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [overlay, tsLabel, tsName, noteInfo, explanation],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          tsLabel.destroy();
          tsName.destroy();
          noteInfo.destroy();
          explanation.destroy();
          this.startCountdown();
        }
      });
    });
  }

  /** Shows 3-2-1-GO countdown before song starts */
  startCountdown() {
    const countTexts = ['3', '2', '1', '♪ GO! ♪'];
    let i = 0;

    const countLabel = this.add.text(GAME_WIDTH / 2, (this.highwayTop + this.highwayBottom) / 2, '', {
      font: 'bold 48px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);

    const timer = this.time.addEvent({
      delay: 750,
      callback: () => {
        countLabel.setText(countTexts[i]);
        this.tweens.add({
          targets: countLabel,
          scaleX: 1.5, scaleY: 1.5,
          duration: 200, yoyo: true
        });
        i++;
        if (i >= countTexts.length) {
          timer.destroy();
          this.time.delayedCall(400, () => {
            countLabel.destroy();
            this.songStartTime = this.time.now;
          });
        }
      },
      repeat: countTexts.length - 1
    });

    // Start backing track if available
    if (this.sound.get('music_rhythm')) {
      this.time.delayedCall(3200, () => {
        this.sound.play('music_rhythm', { volume: 0.3 });
      });
    }
  }

  /** Generates note pattern based on time signature and allowed note types */
  generateNotePattern() {
    const pattern = [];
    const bpm = 100 + (this.difficulty * 30);
    const beatInterval = 60000 / bpm;
    const beatsPerMeasure = this.timeSignature.beats;
    const totalMeasures = Math.floor(this.songDuration / (beatInterval * beatsPerMeasure));

    for (let measure = 0; measure < totalMeasures; measure++) {
      const measureStart = measure * beatsPerMeasure * beatInterval;

      for (let beat = 0; beat < beatsPerMeasure; beat++) {
        const beatTime = measureStart + beat * beatInterval;

        // Choose a note type based on probability
        const noteType = this.chooseNoteType();
        const divisions = NOTE_TYPES[noteType].divisions;

        for (let sub = 0; sub < divisions; sub++) {
          const time = beatTime + (sub * beatInterval / divisions);
          const spawnChance = this.getSpawnChance(beat, sub, divisions);

          if (Math.random() < spawnChance) {
            const lane = Math.floor(Math.random() * 4);
            pattern.push({ time, lane, noteType });

            // Double notes at higher difficulties
            if (this.difficulty >= 2 && Math.random() < 0.15) {
              const secondLane = (lane + Phaser.Math.Between(1, 3)) % 4;
              pattern.push({ time, lane: secondLane, noteType });
            }
          }
        }
      }
    }

    return pattern.sort((a, b) => a.time - b.time);
  }

  /** Probabilistically chooses a note type for pattern generation */
  chooseNoteType() {
    const types = this.allowedNoteTypes;
    if (types.length === 1) return types[0];

    const r = Math.random();
    if (types.length === 2) {
      return r < 0.6 ? types[0] : types[1];
    }
    // 3 types: quarter 40%, eighth 35%, sixteenth 25%
    if (r < 0.4) return types[0];
    if (r < 0.75) return types[1];
    return types[2];
  }

  /** Returns spawn probability — emphasizes downbeats */
  getSpawnChance(beat, subdivision, totalDivisions) {
    const base = 0.5 + (this.difficulty * 0.1);
    // Downbeat emphasis
    if (beat === 0 && subdivision === 0) return Math.min(base + 0.3, 0.95);
    if (subdivision === 0) return base;
    return base * 0.6; // Subdivisions less likely
  }

  /** Handles a lane key press — checks for note hits */
  onKeyPress(lane) {
    if (this.songEnded || this.songStartTime === 0) return;

    // Flash lane target
    const target = this.laneTargets[lane];
    this.tweens.add({
      targets: target,
      alpha: 0.8, scaleX: 1.3, scaleY: 1.3,
      duration: 80, yoyo: true
    });

    // Find closest unhit note in this lane
    let closestNote = null;
    let closestDist = Infinity;

    for (const note of this.activeNotes) {
      if (note.lane === lane && !note.hit) {
        const dist = Math.abs(note.sprite.x - this.hitZoneX);
        if (dist < closestDist) {
          closestDist = dist;
          closestNote = note;
        }
      }
    }

    if (closestNote && closestDist <= HIT_WINDOWS.GOOD) {
      if (closestDist <= HIT_WINDOWS.PERFECT) {
        this.registerHit(closestNote, 'PERFECT');
      } else if (closestDist <= HIT_WINDOWS.GREAT) {
        this.registerHit(closestNote, 'GREAT');
      } else {
        this.registerHit(closestNote, 'GOOD');
      }
    }
  }

  /** Registers a successful hit with grading */
  registerHit(note, rating) {
    note.hit = true;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const comboMult = 1 + Math.floor(this.combo / 10) * 0.5;

    if (rating === 'PERFECT') {
      this.perfects++;
      this.score += Math.round(100 * comboMult);
      this.showFeedback('PERFECT!', '#FFD700');
    } else if (rating === 'GREAT') {
      this.greats++;
      this.score += Math.round(75 * comboMult);
      this.showFeedback('GREAT!', '#00CCFF');
    } else {
      this.goods++;
      this.score += Math.round(50 * comboMult);
      this.showFeedback('GOOD', '#90EE90');
    }

    this.playHitSound(rating);
    this.emitHitParticles(note.sprite.x, note.sprite.y, note.sprite.fillColor || 0xffd700);

    // Animate note destruction
    this.tweens.add({
      targets: note.sprite,
      scaleX: 1.8, scaleY: 1.8, alpha: 0,
      duration: 120,
      onComplete: () => { if (note.sprite && note.sprite.active) note.sprite.destroy(); }
    });

    this.updateHUD();
  }

  /** Updates score and combo display */
  updateHUD() {
    this.scoreText.setText(`Score: ${this.score}`);
    if (this.combo >= 5) {
      this.comboText.setText(`${this.combo}x COMBO`);
      this.comboText.setAlpha(1);
    } else if (this.combo > 0) {
      this.comboText.setText(`Combo: ${this.combo}`);
      this.comboText.setAlpha(0.7);
    } else {
      this.comboText.setText('');
    }
  }

  /** Shows floating feedback text for hit quality */
  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);
    this.feedbackText.y = (this.highwayTop + this.highwayBottom) / 2;

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0, scaleX: 1.4, scaleY: 1.4,
      y: this.feedbackText.y - 25,
      duration: 500
    });
  }

  /** Emits particles at hit location */
  emitHitParticles(x, y, tint) {
    // Use simple rectangle particles if texture not available
    for (let i = 0; i < 8; i++) {
      const px = this.add.rectangle(x, y, 4, 4, tint);
      const angle = (Math.PI * 2 / 8) * i;
      this.tweens.add({
        targets: px,
        x: x + Math.cos(angle) * Phaser.Math.Between(20, 50),
        y: y + Math.sin(angle) * Phaser.Math.Between(20, 50),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 350,
        onComplete: () => px.destroy()
      });
    }
  }

  /** Main update loop — spawns notes, moves them, checks misses */
  update(time, delta) {
    if (this.songStartTime === 0 || this.resultsShown) return;

    const elapsed = time - this.songStartTime;
    const travelTime = (this.spawnX - this.hitZoneX) / this.noteSpeed * 1000;

    // Update progress bar
    const progress = Math.min(elapsed / this.songDuration, 1);
    this.progressFill.width = (GAME_WIDTH - 100) * progress;

    // Spawn notes
    while (this.nextNoteIndex < this.notePattern.length) {
      const noteData = this.notePattern[this.nextNoteIndex];
      const spawnTime = noteData.time - travelTime;

      if (elapsed >= spawnTime) {
        this.spawnNote(noteData);
        this.nextNoteIndex++;
      } else {
        break;
      }
    }

    // Move active notes leftward
    const speed = this.noteSpeed * (delta / 1000);
    for (let i = this.activeNotes.length - 1; i >= 0; i--) {
      const note = this.activeNotes[i];
      if (note.hit) {
        if (!note.sprite || !note.sprite.active) {
          this.activeNotes.splice(i, 1);
        }
        continue;
      }

      note.sprite.x -= speed;

      // Missed — passed the hit zone
      if (note.sprite.x < this.hitZoneX - 60) {
        this.misses++;
        this.combo = 0;
        this.showFeedback('MISS', '#FF4444');
        this.playMissSound();
        this.updateHUD();

        this.tweens.add({
          targets: note.sprite,
          alpha: 0, duration: 150,
          onComplete: () => { if (note.sprite && note.sprite.active) note.sprite.destroy(); }
        });
        note.hit = true;
        this.activeNotes.splice(i, 1);
      }
    }

    // Song complete check
    if (elapsed > this.songDuration + travelTime + 500 && !this.songEnded) {
      this.songEnded = true;
      this.showResults();
    }
  }

  /** Spawns a note graphic on the highway */
  spawnNote(noteData) {
    const y = this.lanes[noteData.lane];
    const x = this.spawnX;

    const laneColors = [0xff6b6b, 0x6bff6b, 0x6b9fff, 0xffff6b];
    const color = laneColors[noteData.lane];

    // Note size varies by type — sixteenth notes are smaller
    const sizeMap = { quarter: 12, eighth: 10, sixteenth: 8 };
    const size = sizeMap[noteData.noteType] || 12;

    const sprite = this.add.circle(x, y, size, color, 0.9)
      .setStrokeStyle(2, 0xffffff);

    // Sixteenth notes have a diamond shape indicator
    if (noteData.noteType === 'sixteenth') {
      sprite.setAngle(45);
    }

    this.activeNotes.push({
      sprite,
      lane: noteData.lane,
      hit: false,
      noteType: noteData.noteType
    });
  }

  /** Calculates star rating from performance */
  calculateStars() {
    const totalNotes = this.notePattern.length;
    if (totalNotes === 0) return 0;

    // Weighted score: perfect=100, great=75, good=50, miss=0
    const maxScore = totalNotes * 100;
    const earned = this.perfects * 100 + this.greats * 75 + this.goods * 50;
    const pct = (earned / maxScore) * 100;

    if (pct >= STAR_THRESHOLDS.three) return 3;
    if (pct >= STAR_THRESHOLDS.two) return 2;
    if (pct >= STAR_THRESHOLDS.one) return 1;
    return 0;
  }

  /** Shows the results screen with star rating and rewards */
  showResults() {
    this.resultsShown = true;
    this.sound.stopAll();

    const totalNotes = this.notePattern.length;
    const hitNotes = this.perfects + this.greats + this.goods;
    const accuracy = totalNotes > 0 ? Math.round((hitNotes / totalNotes) * 100) : 0;
    const stars = this.calculateStars();

    // Dim background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(80);

    // Results panel
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 380, 320, 0x1a0a2e, 0.95)
      .setStrokeStyle(3, 0xffd700).setDepth(81);

    // Title based on performance
    const titles = ['Keep Practicing!', 'Not Bad!', 'Bravo!', '♪ Magnifico! ♪'];
    const titleColors = ['#FF6666', '#FFAA44', '#44CCFF', '#FFD700'];
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, titles[stars], {
      font: 'bold 22px monospace',
      fill: titleColors[stars],
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(82);

    // Star display
    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, starStr, {
      font: '32px monospace',
      fill: stars === 3 ? '#FFD700' : '#CCCCCC'
    }).setOrigin(0.5).setDepth(82);

    // Stats
    const lines = [
      `Score: ${this.score}`,
      `Perfect: ${this.perfects}  Great: ${this.greats}  Good: ${this.goods}`,
      `Misses: ${this.misses}`,
      `Max Combo: ${this.maxCombo}`,
      `Accuracy: ${accuracy}%`,
    ];

    lines.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60 + i * 24, line, {
        font: '13px monospace',
        fill: '#FFFFFF'
      }).setOrigin(0.5).setDepth(82);
    });

    // Reward display
    let rewardText = '';
    if (stars === 3) {
      rewardText = '⚡ +50 HP  +500 Score ⚡';
    } else if (stars === 2) {
      rewardText = '⚡ +25 HP  +250 Score ⚡';
    } else if (stars === 1) {
      rewardText = '⚡ Speed Boost Earned ⚡';
    }

    if (rewardText) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, rewardText, {
        font: 'bold 14px monospace',
        fill: '#FFD700'
      }).setOrigin(0.5).setDepth(82);
    }

    // Add score to global registry
    const currentScore = this.registry.get('score') || 0;
    this.registry.set('score', currentScore + this.score);

    // Continue prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, 'Press any key to continue...', {
      font: '11px monospace', fill: '#888888'
    }).setOrigin(0.5).setDepth(82);

    this.time.delayedCall(800, () => {
      this.input.keyboard.once('keydown', () => {
        this.applyRewards(stars);
        this.scene.stop('RhythmScene');
        this.scene.resume(this.returnScene);
      });
    });
  }

  /** Applies rewards based on star rating */
  applyRewards(stars) {
    if (stars >= 1) {
      this.registry.set('rhythmPowerUp', {
        type: 'speedBoost',
        duration: 8000 + (stars * 4000),
        multiplier: 1.2 + (stars * 0.1)
      });
    }

    if (stars >= 2) {
      const currentScore = this.registry.get('score') || 0;
      const bonus = stars === 3 ? 500 : 250;
      this.registry.set('score', currentScore + bonus);
    }

    if (stars === 3) {
      const currentHealth = this.registry.get('health') || 100;
      this.registry.set('health', Math.min(currentHealth + 50, 150));
      this.registry.set('rhythmPerfect', true);
    }
  }
}
