import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Rhythm mini-game scene where Mozart must hit scrolling notes in time.
 * Triggered from level scenes when Mozart interacts with a "Practice Stage".
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
    // Background
    this.cameras.main.setBackgroundColor('#1a0a2e');

    // Stage decoration
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, 0x2d1b4e)
      .setStrokeStyle(3, 0xffd700);

    // Title
    const diffNames = ['Andante', 'Allegro', 'Presto'];
    this.add.text(GAME_WIDTH / 2, 30, `♪ Practice Stage - ${diffNames[this.difficulty - 1]} ♪`, {
      font: '20px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Hit zone (left side where player must press)
    this.hitZoneX = 100;
    this.hitZone = this.add.rectangle(this.hitZoneX, GAME_HEIGHT / 2, 8, 120, 0xffd700, 0.3)
      .setStrokeStyle(2, 0xffd700);

    // Lane lines
    this.lanes = [
      GAME_HEIGHT / 2 - 45,
      GAME_HEIGHT / 2 - 15,
      GAME_HEIGHT / 2 + 15,
      GAME_HEIGHT / 2 + 45
    ];

    // Lane labels
    const laneKeys = ['D', 'F', 'J', 'K'];
    this.lanes.forEach((y, i) => {
      this.add.text(30, y, laneKeys[i], {
        font: '16px monospace',
        fill: '#AAAAAA'
      }).setOrigin(0.5);

      // Lane guide line
      this.add.line(0, 0, this.hitZoneX, y, GAME_WIDTH - 40, y, 0x333366, 0.3)
        .setOrigin(0, 0);
    });

    // Game state
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfects = 0;
    this.goods = 0;
    this.misses = 0;
    this.activeNotes = [];
    this.noteSpeed = 200 + (this.difficulty * 80); // pixels per second
    this.songDuration = 8000 + (this.difficulty * 4000); // ms
    this.songStartTime = 0;
    this.songEnded = false;
    this.resultsShown = false;

    // Generate note pattern based on difficulty
    this.notePattern = this.generateNotePattern();
    this.nextNoteIndex = 0;

    // Scoring text
    this.scoreText = this.add.text(GAME_WIDTH - 30, 50, 'Score: 0', {
      font: '14px monospace',
      fill: '#FFFFFF'
    }).setOrigin(1, 0);

    this.comboText = this.add.text(GAME_WIDTH - 30, 70, 'Combo: 0', {
      font: '14px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 0);

    // Feedback text (Perfect/Good/Miss)
    this.feedbackText = this.add.text(this.hitZoneX + 60, GAME_HEIGHT / 2, '', {
      font: '18px monospace',
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    // Input setup
    this.keys = {
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      K: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
    };

    this.keyLaneMap = { D: 0, F: 1, J: 2, K: 3 };

    // Listen for key presses
    Object.keys(this.keys).forEach(keyName => {
      this.keys[keyName].on('down', () => this.onKeyPress(this.keyLaneMap[keyName]));
    });

    // Countdown before start
    this.startCountdown();

    // Play rhythm backing track
    if (this.sound.get('music_rhythm')) {
      this.time.delayedCall(3000, () => {
        this.sound.play('music_rhythm', { volume: 0.3 });
      });
    }
  }

  startCountdown() {
    const countTexts = ['3', '2', '1', '♪ GO! ♪'];
    let i = 0;

    const countLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      font: '48px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const timer = this.time.addEvent({
      delay: 750,
      callback: () => {
        countLabel.setText(countTexts[i]);
        this.tweens.add({
          targets: countLabel,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 200,
          yoyo: true,
        });
        i++;
        if (i >= countTexts.length) {
          timer.destroy();
          this.time.delayedCall(500, () => {
            countLabel.destroy();
            this.songStartTime = this.time.now;
          });
        }
      },
      repeat: countTexts.length - 1
    });
  }

  generateNotePattern() {
    const pattern = [];
    const bpm = 100 + (this.difficulty * 30);
    const beatInterval = 60000 / bpm;
    const totalBeats = Math.floor(this.songDuration / beatInterval);

    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * beatInterval;

      // Base probability of spawning a note per beat increases with difficulty
      const spawnChance = 0.5 + (this.difficulty * 0.15);

      if (Math.random() < spawnChance) {
        const lane = Math.floor(Math.random() * 4);
        pattern.push({ time, lane });

        // Higher difficulties can have double notes
        if (this.difficulty >= 2 && Math.random() < 0.2) {
          let secondLane = (lane + Phaser.Math.Between(1, 3)) % 4;
          pattern.push({ time, lane: secondLane });
        }

        // Presto can have triple notes
        if (this.difficulty >= 3 && Math.random() < 0.1) {
          let thirdLane = (lane + 2) % 4;
          pattern.push({ time, lane: thirdLane });
        }
      }
    }

    return pattern.sort((a, b) => a.time - b.time);
  }

  onKeyPress(lane) {
    if (this.songEnded || this.songStartTime === 0) return;

    // Flash the lane indicator
    const flashRect = this.add.rectangle(this.hitZoneX, this.lanes[lane], 30, 20, 0xffd700, 0.5);
    this.tweens.add({
      targets: flashRect,
      alpha: 0,
      duration: 200,
      onComplete: () => flashRect.destroy()
    });

    // Find closest note in this lane within hit window
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

    if (closestNote) {
      const perfectWindow = 20;
      const goodWindow = 50;

      if (closestDist <= perfectWindow) {
        this.registerHit(closestNote, 'PERFECT');
      } else if (closestDist <= goodWindow) {
        this.registerHit(closestNote, 'GOOD');
      } else {
        // Too far, no hit registered
      }
    }
  }

  registerHit(note, rating) {
    note.hit = true;

    if (rating === 'PERFECT') {
      this.perfects++;
      this.score += 100 * (1 + Math.floor(this.combo / 10));
      this.combo++;
      this.showFeedback('PERFECT!', '#FFD700');
      this.emitHitParticles(note.sprite.x, note.sprite.y, 0xffd700);
    } else {
      this.goods++;
      this.score += 50 * (1 + Math.floor(this.combo / 10));
      this.combo++;
      this.showFeedback('GOOD', '#90EE90');
      this.emitHitParticles(note.sprite.x, note.sprite.y, 0x90ee90);
    }

    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Play hit sound
    if (this.sound.get('sfx_coin')) {
      this.sound.play('sfx_coin', { volume: 0.2 });
    }

    // Remove note visually
    this.tweens.add({
      targets: note.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => note.sprite.destroy()
    });

    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: ${this.combo}`);
  }

  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      y: this.feedbackText.y - 20,
      duration: 500,
      onComplete: () => {
        this.feedbackText.y = GAME_HEIGHT / 2;
      }
    });
  }

  emitHitParticles(x, y, tint) {
    const particles = this.add.particles(x, y, 'particleSparkle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: tint,
      emitting: false
    });
    particles.explode();
    this.time.delayedCall(500, () => particles.destroy());
  }

  update(time, delta) {
    if (this.songStartTime === 0 || this.resultsShown) return;

    const elapsed = time - this.songStartTime;

    // Spawn notes that should now be visible
    const travelTime = (GAME_WIDTH - this.hitZoneX) / this.noteSpeed * 1000;

    while (this.nextNoteIndex < this.notePattern.length) {
      const noteData = this.notePattern[this.nextNoteIndex];
      // Spawn note so it arrives at hitZone at noteData.time
      const spawnTime = noteData.time - travelTime;

      if (elapsed >= spawnTime) {
        this.spawnNote(noteData);
        this.nextNoteIndex++;
      } else {
        break;
      }
    }

    // Move active notes
    const speed = this.noteSpeed * (delta / 1000);
    for (let i = this.activeNotes.length - 1; i >= 0; i--) {
      const note = this.activeNotes[i];
      if (note.hit) {
        if (!note.sprite.active) {
          this.activeNotes.splice(i, 1);
        }
        continue;
      }

      note.sprite.x -= speed;

      // Missed note (passed hit zone)
      if (note.sprite.x < this.hitZoneX - 60) {
        this.misses++;
        this.combo = 0;
        this.comboText.setText(`Combo: ${this.combo}`);
        this.showFeedback('MISS', '#FF4444');

        this.tweens.add({
          targets: note.sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => note.sprite.destroy()
        });
        note.hit = true;
        this.activeNotes.splice(i, 1);
      }
    }

    // Check if song is over
    if (elapsed > this.songDuration + travelTime + 1000 && !this.songEnded) {
      this.songEnded = true;
      this.showResults();
    }
  }

  spawnNote(noteData) {
    const y = this.lanes[noteData.lane];
    const x = GAME_WIDTH + 20;

    const laneColors = [0xff6b6b, 0x6bff6b, 0x6b6bff, 0xffff6b];
    const sprite = this.add.image(x, y, 'rhythmNote')
      .setDisplaySize(24, 24)
      .setTint(laneColors[noteData.lane]);

    this.activeNotes.push({
      sprite,
      lane: noteData.lane,
      hit: false
    });
  }

  showResults() {
    this.resultsShown = true;
    this.sound.stopAll();

    const totalNotes = this.notePattern.length;
    const hitNotes = this.perfects + this.goods;
    const accuracy = totalNotes > 0 ? Math.round((hitNotes / totalNotes) * 100) : 0;

    // Determine if power-up is awarded (70%+ accuracy)
    const powerUpEarned = accuracy >= 70;

    // Results panel
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 350, 280, 0x1a0a2e, 0.95)
      .setStrokeStyle(3, 0xffd700);

    const resultTitle = powerUpEarned ? '♪ Bravo! ♪' : '♪ Practice More ♪';
    const titleColor = powerUpEarned ? '#FFD700' : '#FF8888';

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, resultTitle, {
      font: '24px monospace',
      fill: titleColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const lines = [
      `Score: ${this.score}`,
      `Perfects: ${this.perfects}`,
      `Goods: ${this.goods}`,
      `Misses: ${this.misses}`,
      `Max Combo: ${this.maxCombo}`,
      `Accuracy: ${accuracy}%`,
    ];

    if (powerUpEarned) {
      lines.push('', '⚡ Speed Boost Earned! ⚡');
    }

    lines.forEach((line, i) => {
      const color = line.includes('⚡') ? '#FFD700' : '#FFFFFF';
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70 + i * 24, line, {
        font: '14px monospace',
        fill: color
      }).setOrigin(0.5);
    });

    // Add score to registry
    const currentScore = this.registry.get('score') || 0;
    this.registry.set('score', currentScore + this.score);

    // Continue prompt
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, 'Press any key to continue...', {
      font: '12px monospace',
      fill: '#AAAAAA'
    }).setOrigin(0.5);

    this.time.delayedCall(1000, () => {
      this.input.keyboard.once('keydown', () => {
        // Store power-up if earned
        if (powerUpEarned) {
          this.registry.set('rhythmPowerUp', {
            type: 'speedBoost',
            duration: 10000 + (this.difficulty * 5000),
            multiplier: 1.3 + (this.difficulty * 0.1)
          });
        }

        this.scene.stop('RhythmScene');
        this.scene.resume(this.returnScene);
      });
    });
  }
}
