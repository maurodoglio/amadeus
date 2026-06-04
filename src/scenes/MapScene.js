import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const LEVEL_DATA = [
  { id: 1, name: 'Vienna Streets', scene: 'Level1Scene', instrument: 'violin', x: 120, y: 350, cutscene: 'intro' },
  { id: 2, name: 'Enchanted Forest', scene: 'Level2Scene', instrument: 'flute', x: 350, y: 250, cutscene: 'afterLevel1' },
  { id: 3, name: 'Royal Palace', scene: 'Level3Scene', instrument: 'piano', x: 600, y: 180, cutscene: 'afterLevel2' }
];

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  init(data) {
    this.justCompletedLevel = data.completedLevel || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a2a1a');

    // Initialize progress tracking
    const completedLevels = this.registry.get('completedLevels') || [];
    this.registry.set('completedLevels', completedLevels);

    this.createBackground();
    this.createPath();
    this.createLevelNodes(completedLevels);
    this.createMozartIcon(completedLevels);
    this.createTitle();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  createBackground() {
    // Rolling hills background
    const graphics = this.add.graphics();

    // Sky gradient
    graphics.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x1a2a1a, 0x1a2a1a);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Hills in background
    graphics.fillStyle(0x1e3a1e, 1);
    graphics.beginPath();
    graphics.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 20) {
      const y = GAME_HEIGHT - 60 - Math.sin(x * 0.005) * 40 - Math.sin(x * 0.01) * 20;
      graphics.lineTo(x, y);
    }
    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Distant hills
    graphics.fillStyle(0x162e16, 1);
    graphics.beginPath();
    graphics.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 20) {
      const y = GAME_HEIGHT - 30 - Math.sin(x * 0.008 + 1) * 30 - Math.sin(x * 0.015) * 15;
      graphics.lineTo(x, y);
    }
    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT);
    graphics.closePath();
    graphics.fillPath();

    // Decorative stars
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, 120);
      const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xFFFFFF, Phaser.Math.FloatBetween(0.3, 0.8));
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  createPath() {
    const graphics = this.add.graphics();

    // Draw dotted path connecting levels
    graphics.lineStyle(4, 0xc8a96e, 0.6);
    const path = new Phaser.Curves.Spline([
      new Phaser.Math.Vector2(LEVEL_DATA[0].x, LEVEL_DATA[0].y),
      new Phaser.Math.Vector2(220, 310),
      new Phaser.Math.Vector2(LEVEL_DATA[1].x, LEVEL_DATA[1].y),
      new Phaser.Math.Vector2(480, 220),
      new Phaser.Math.Vector2(LEVEL_DATA[2].x, LEVEL_DATA[2].y)
    ]);

    // Draw path as dashes
    const points = path.getPoints(60);
    for (let i = 0; i < points.length - 1; i += 2) {
      graphics.beginPath();
      graphics.moveTo(points[i].x, points[i].y);
      if (i + 1 < points.length) {
        graphics.lineTo(points[i + 1].x, points[i + 1].y);
      }
      graphics.strokePath();
    }

    this.levelPath = path;
  }

  createLevelNodes(completedLevels) {
    this.levelNodes = [];

    LEVEL_DATA.forEach((level, index) => {
      const isCompleted = completedLevels.includes(level.id);
      const isUnlocked = level.id === 1 || completedLevels.includes(level.id - 1);

      const container = this.add.container(level.x, level.y);

      // Node circle
      const nodeColor = isCompleted ? 0xFFD700 : (isUnlocked ? 0x4a90d9 : 0x555555);
      const nodeAlpha = isUnlocked ? 1 : 0.5;
      const circle = this.add.circle(0, 0, 28, nodeColor, nodeAlpha);
      circle.setStrokeStyle(3, isCompleted ? 0xffffff : 0x333333);
      container.add(circle);

      // Level number
      const numText = this.add.text(0, 0, `${level.id}`, {
        font: 'bold 18px monospace',
        fill: isUnlocked ? '#FFFFFF' : '#888888'
      }).setOrigin(0.5);
      container.add(numText);

      // Completed checkmark
      if (isCompleted) {
        const check = this.add.text(18, -18, '✓', {
          font: 'bold 16px monospace',
          fill: '#00FF00'
        }).setOrigin(0.5);
        container.add(check);

        // Instrument icon below
        const instrumentIcons = { violin: '🎻', flute: '🎵', piano: '🎹' };
        const instIcon = this.add.text(0, 38, instrumentIcons[level.instrument] || '♫', {
          font: '18px Arial',
          fill: '#FFFFFF'
        }).setOrigin(0.5);
        container.add(instIcon);
      }

      // Level name
      const nameText = this.add.text(0, -45, level.name, {
        font: '12px monospace',
        fill: isUnlocked ? '#FFFFFF' : '#666666'
      }).setOrigin(0.5);
      container.add(nameText);

      // Make clickable if unlocked
      if (isUnlocked) {
        circle.setInteractive({ useHandCursor: true });

        circle.on('pointerover', () => {
          this.tweens.add({
            targets: container,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 150,
            ease: 'Power2'
          });
        });

        circle.on('pointerout', () => {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Power2'
          });
        });

        circle.on('pointerdown', () => {
          this.startLevel(level);
        });
      }

      // Pulse animation for next unlocked (but not completed) level
      if (isUnlocked && !isCompleted) {
        this.tweens.add({
          targets: circle,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.levelNodes.push({ container, level, isUnlocked, isCompleted });
    });
  }

  createMozartIcon(completedLevels) {
    // Position Mozart at the highest completed level, or at start
    let mozartLevelIndex = 0;
    for (let i = LEVEL_DATA.length - 1; i >= 0; i--) {
      if (completedLevels.includes(LEVEL_DATA[i].id)) {
        mozartLevelIndex = i;
        break;
      }
    }

    const targetLevel = LEVEL_DATA[mozartLevelIndex];
    this.mozartIcon = this.add.container(targetLevel.x, targetLevel.y - 55);

    // Small Mozart representation
    const head = this.add.circle(0, 0, 10, 0xFFDBAC);
    const wig = this.add.ellipse(0, -6, 18, 12, 0xF5F5DC);
    const body = this.add.rectangle(0, 16, 14, 16, 0x4169E1);

    this.mozartIcon.add([wig, head, body]);

    // Bounce animation
    this.tweens.add({
      targets: this.mozartIcon,
      y: targetLevel.y - 60,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // If we just completed a level, animate Mozart moving to the next position
    if (this.justCompletedLevel > 0 && this.justCompletedLevel < LEVEL_DATA.length) {
      const prevLevel = LEVEL_DATA[this.justCompletedLevel - 1];
      const nextLevel = LEVEL_DATA[this.justCompletedLevel];

      // Start at previous position
      this.mozartIcon.setPosition(prevLevel.x, prevLevel.y - 55);

      // Animate along path to new position
      this.time.delayedCall(500, () => {
        this.tweens.add({
          targets: this.mozartIcon,
          x: nextLevel.x,
          y: nextLevel.y - 55,
          duration: 1500,
          ease: 'Power2'
        });
      });
    }
  }

  createTitle() {
    this.add.text(GAME_WIDTH / 2, 30, "Mozart's Journey", {
      font: 'bold 28px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Score display
    const score = this.registry.get('score') || 0;
    this.add.text(GAME_WIDTH - 20, 20, `Score: ${score}`, {
      font: '14px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 0);

    // Instructions
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, 'Click a level to play', {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5);
  }

  startLevel(level) {
    this.cameras.main.fade(500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', level.id);
        // First time playing a level goes through cutscene, replay goes direct
        const completedLevels = this.registry.get('completedLevels') || [];
        if (completedLevels.includes(level.id)) {
          this.scene.start(level.scene);
          this.scene.launch('UIScene');
        } else {
          this.scene.start('CutsceneScene', { cutscene: level.cutscene, nextScene: level.scene });
          this.scene.launch('UIScene');
        }
      }
    });
  }
}
