import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { getAchievementManager } from '../utils/AchievementManager.js';
import {
  drawParchmentBackground,
  drawStaffDivider,
  drawTrebleClef,
  COLORS,
  drawOrnateFrame,
  createInstrumentIcon
} from '../ui/UITheme.js';
import { loadScene } from '../utils/SceneLoader.js';
import { loadCompletedLevels } from '../utils/LevelStateUtils.js';

const LEVEL_DATA = [
  { id: 1, name: 'Salzburg Beginnings', year: '1762', scene: 'Level1Scene', instrument: 'violin', x: 90, y: 362, cutscene: 'intro' },
  { id: 2, name: 'The Grand Tour', year: '1763-1766', scene: 'Level2Scene', instrument: 'flute', x: 195, y: 284, cutscene: 'afterLevel1' },
  { id: 3, name: "Archbishop's Palace", year: '1772', scene: 'Level3Scene', instrument: 'piano', x: 324, y: 232, cutscene: 'afterLevel2' },
  { id: 4, name: 'Vienna Opera', year: '1781', scene: 'Level4Scene', instrument: 'harpsichord', x: 456, y: 302, cutscene: 'afterLevel3' },
  { id: 5, name: 'Storm & Struggle', year: '1786', scene: 'Level5Scene', instrument: 'trumpet', x: 565, y: 196, cutscene: 'afterLevel4' },
  { id: 6, name: 'The Requiem Mystery', year: '1791', scene: 'Level6Scene', instrument: 'drums', x: 668, y: 276, cutscene: 'afterLevel5' },
  { id: 7, name: 'Eternal Legacy', year: '1791', scene: 'Level7Scene', instrument: 'harp', x: 744, y: 136, cutscene: 'afterLevel6' }
];

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  init(data) {
    this.justCompletedLevel = data.completedLevel || 0;
  }

  create() {
    drawParchmentBackground(this, GAME_WIDTH, GAME_HEIGHT);

    const completedLevels = this.registry.get('completedLevels') || loadCompletedLevels();
    this.registry.set('completedLevels', completedLevels);

    this.createBackground();
    this.createFrame();
    this.createPath();
    this.createLevelNodes(completedLevels);
    this.createMozartIcon(completedLevels);
    this.createTitle();
    this.createBackButton();

    this.cameras.main.fadeIn(500);
  }

  createBackground() {
    const sky = this.add.graphics();
    sky.fillStyle(0xf8ecd5, 0.7);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const hills = this.add.graphics();
    const hillSets = [
      { base: GAME_HEIGHT - 65, amplitude: 34, color: 0xd7c39d, alpha: 0.65, freq: 0.012 },
      { base: GAME_HEIGHT - 92, amplitude: 52, color: 0xc4ad86, alpha: 0.6, freq: 0.009 },
      { base: GAME_HEIGHT - 120, amplitude: 68, color: 0xb89668, alpha: 0.34, freq: 0.006 }
    ];

    hillSets.forEach((set, index) => {
      const points = [new Phaser.Math.Vector2(0, GAME_HEIGHT)];
      for (let x = 0; x <= GAME_WIDTH; x += 16) {
        const y = set.base - Math.sin(x * set.freq + index) * set.amplitude - Math.sin(x * 0.019 + index * 2) * (set.amplitude * 0.2);
        points.push(new Phaser.Math.Vector2(x, y));
      }
      points.push(new Phaser.Math.Vector2(GAME_WIDTH, GAME_HEIGHT));
      hills.fillStyle(set.color, set.alpha);
      hills.fillPoints(points, true);
    });

    [
      { x: 118, y: 82, scale: 0.95 },
      { x: 340, y: 64, scale: 1.2 },
      { x: 615, y: 92, scale: 1 },
      { x: 732, y: 60, scale: 0.82 }
    ].forEach(cloud => this.drawCloud(cloud.x, cloud.y, cloud.scale));

    [
      { x: 125, y: 360, scale: 1 },
      { x: 265, y: 308, scale: 0.9 },
      { x: 384, y: 260, scale: 1 },
      { x: 517, y: 250, scale: 0.85 },
      { x: 710, y: 208, scale: 0.9 }
    ].forEach(tree => this.drawTree(tree.x, tree.y, tree.scale));

    [
      { x: 150, y: 336, scale: 0.9, kind: 'village' },
      { x: 352, y: 205, scale: 1.05, kind: 'palace' },
      { x: 498, y: 334, scale: 1, kind: 'opera' },
      { x: 612, y: 175, scale: 0.85, kind: 'tower' }
    ].forEach(landmark => this.drawLandmark(landmark.x, landmark.y, landmark.scale, landmark.kind));

    const cities = [
      { name: 'Salzburg', x: 88, y: 405 },
      { name: 'Munich', x: 170, y: 330 },
      { name: 'Paris', x: 246, y: 306 },
      { name: 'Vienna', x: 458, y: 347 },
      { name: 'Prague', x: 564, y: 239 },
      { name: 'Legacy Hall', x: 728, y: 101 }
    ];

    cities.forEach(city => {
      this.add.text(city.x, city.y, city.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#4E351C',
        stroke: '#f8ecd5',
        strokeThickness: 2
      }).setOrigin(0.5);
    });

    drawStaffDivider(this, 28, GAME_HEIGHT - 46, GAME_WIDTH - 56);
  }

  drawCloud(x, y, scale) {
    const cloud = this.add.graphics();
    cloud.fillStyle(0xffffff, 0.46);
    cloud.fillCircle(x, y, 18 * scale);
    cloud.fillCircle(x + 18 * scale, y + 4 * scale, 15 * scale);
    cloud.fillCircle(x - 16 * scale, y + 6 * scale, 13 * scale);
    cloud.fillEllipse(x + 2 * scale, y + 9 * scale, 62 * scale, 26 * scale);
  }

  drawTree(x, y, scale) {
    const tree = this.add.graphics();
    tree.fillStyle(0x6b4c2d, 0.85);
    tree.fillRect(x - 3 * scale, y, 6 * scale, 16 * scale);
    tree.fillStyle(0x5f7f49, 0.78);
    tree.fillCircle(x, y - 8 * scale, 15 * scale);
    tree.fillCircle(x - 10 * scale, y + 2 * scale, 11 * scale);
    tree.fillCircle(x + 10 * scale, y + 2 * scale, 11 * scale);
  }

  drawLandmark(x, y, scale, kind) {
    const g = this.add.graphics();
    g.fillStyle(0xefe3c3, 0.78);
    g.lineStyle(1.5, 0x7b5e34, 0.7);

    if (kind === 'palace') {
      g.fillRoundedRect(x - 24 * scale, y - 18 * scale, 48 * scale, 28 * scale, 6 * scale);
      g.strokeRoundedRect(x - 24 * scale, y - 18 * scale, 48 * scale, 28 * scale, 6 * scale);
      g.fillStyle(0xb88d4c, 0.78);
      g.fillTriangle(x - 28 * scale, y - 18 * scale, x, y - 34 * scale, x + 28 * scale, y - 18 * scale);
      g.fillStyle(0x9b6f3b, 0.6);
      g.fillRect(x - 4 * scale, y - 2 * scale, 8 * scale, 12 * scale);
    } else if (kind === 'opera') {
      g.fillRoundedRect(x - 20 * scale, y - 16 * scale, 40 * scale, 24 * scale, 5 * scale);
      g.strokeRoundedRect(x - 20 * scale, y - 16 * scale, 40 * scale, 24 * scale, 5 * scale);
      g.fillStyle(0xad7b42, 0.68);
      g.fillTriangle(x - 24 * scale, y - 16 * scale, x, y - 28 * scale, x + 24 * scale, y - 16 * scale);
      [-10, 0, 10].forEach(offset => g.fillRect(x + offset * scale - 2 * scale, y - 6 * scale, 4 * scale, 14 * scale));
    } else if (kind === 'tower') {
      g.fillRect(x - 12 * scale, y - 30 * scale, 24 * scale, 34 * scale);
      g.strokeRect(x - 12 * scale, y - 30 * scale, 24 * scale, 34 * scale);
      g.fillStyle(0xaf8348, 0.68);
      g.fillTriangle(x - 16 * scale, y - 30 * scale, x, y - 44 * scale, x + 16 * scale, y - 30 * scale);
    } else {
      g.fillRoundedRect(x - 16 * scale, y - 12 * scale, 32 * scale, 20 * scale, 4 * scale);
      g.strokeRoundedRect(x - 16 * scale, y - 12 * scale, 32 * scale, 20 * scale, 4 * scale);
      g.fillStyle(0xaf8348, 0.72);
      g.fillTriangle(x - 18 * scale, y - 12 * scale, x, y - 24 * scale, x + 18 * scale, y - 12 * scale);
    }
  }

  createFrame() {
    drawOrnateFrame(this, 18, 18, GAME_WIDTH - 36, GAME_HEIGHT - 36, COLORS.goldDark, 0.48);
    const topRibbon = this.add.graphics();
    topRibbon.fillStyle(0xf7ead2, 0.78);
    topRibbon.fillRoundedRect(GAME_WIDTH / 2 - 156, 16, 312, 44, 14);
    topRibbon.lineStyle(2, COLORS.goldDark, 0.48);
    topRibbon.strokeRoundedRect(GAME_WIDTH / 2 - 156, 16, 312, 44, 14);
  }

  createPath() {
    this.levelPath = new Phaser.Curves.Spline([
      new Phaser.Math.Vector2(LEVEL_DATA[0].x, LEVEL_DATA[0].y),
      new Phaser.Math.Vector2(138, 334),
      new Phaser.Math.Vector2(LEVEL_DATA[1].x, LEVEL_DATA[1].y),
      new Phaser.Math.Vector2(260, 244),
      new Phaser.Math.Vector2(LEVEL_DATA[2].x, LEVEL_DATA[2].y),
      new Phaser.Math.Vector2(405, 276),
      new Phaser.Math.Vector2(LEVEL_DATA[3].x, LEVEL_DATA[3].y),
      new Phaser.Math.Vector2(520, 228),
      new Phaser.Math.Vector2(LEVEL_DATA[4].x, LEVEL_DATA[4].y),
      new Phaser.Math.Vector2(624, 238),
      new Phaser.Math.Vector2(LEVEL_DATA[5].x, LEVEL_DATA[5].y),
      new Phaser.Math.Vector2(712, 210),
      new Phaser.Math.Vector2(LEVEL_DATA[6].x, LEVEL_DATA[6].y)
    ]);

    const points = this.levelPath.getPoints(180);
    const drawLine = (graphics, close = false) => {
      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
      }
      if (close) graphics.closePath();
      graphics.strokePath();
    };

    const glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    glow.lineStyle(14, COLORS.goldLight, 0.16);
    drawLine(glow);

    const road = this.add.graphics();
    road.lineStyle(8, 0xd6b05f, 0.65);
    drawLine(road);
    road.lineStyle(3, COLORS.goldDark, 0.8);
    drawLine(road);

    points.forEach((point, index) => {
      if (index % 18 === 0) {
        const ornament = this.add.text(point.x, point.y - 6, index % 36 === 0 ? '♪' : '•', {
          fontFamily: 'Georgia, serif',
          fontSize: index % 36 === 0 ? '13px' : '10px',
          color: '#9B6C24'
        }).setOrigin(0.5).setAlpha(index % 36 === 0 ? 0.75 : 0.55);
        if (index % 36 === 0) {
          this.tweens.add({
            targets: ornament,
            y: ornament.y - 6,
            alpha: { from: 0.45, to: 0.8 },
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    });
  }

  createLevelNodes(completedLevels) {
    this.levelNodes = [];

    LEVEL_DATA.forEach(level => {
      const isCompleted = completedLevels.includes(level.id);
      const isUnlocked = level.id === 1 || completedLevels.includes(level.id - 1);
      const container = this.add.container(level.x, level.y);

      const nodeColor = isCompleted ? 0xf2c14f : (isUnlocked ? 0x6d8ec6 : 0x9a8a73);
      const glow = this.add.circle(0, 0, 34, nodeColor, isCompleted ? 0.26 : (isUnlocked ? 0.18 : 0.08));
      glow.setBlendMode(Phaser.BlendModes.ADD);
      const ring = this.add.circle(0, 0, 28, nodeColor, isUnlocked ? 0.94 : 0.55)
        .setStrokeStyle(3, isCompleted ? COLORS.goldDark : COLORS.inkLight, 0.85);
      const inner = this.add.circle(0, 0, 22, isCompleted ? 0xfff0bf : (isUnlocked ? 0x324f7a : 0xd6c3a6), isUnlocked ? 0.95 : 0.55)
        .setStrokeStyle(1, COLORS.white, isUnlocked ? 0.35 : 0.15);
      const halo = this.add.circle(0, 0, 19, isCompleted ? 0xfff7dc : 0x9fb7d6, isUnlocked ? 0.45 : 0.12);
      const icon = createInstrumentIcon(this, 0, 0, level.instrument, isCompleted ? COLORS.goldDark : (isUnlocked ? COLORS.white : COLORS.greyDark), 0.58);
      icon.setAlpha(isUnlocked ? 0.95 : 0.35);
      const numberText = this.add.text(0, 31, `${level.id}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isUnlocked ? '#4A3728' : '#8B7D67'
      }).setOrigin(0.5);

      container.add([glow, ring, inner, halo, icon, numberText]);

      const plaque = this.add.graphics();
      plaque.fillStyle(0xf6ead0, isUnlocked ? 0.82 : 0.42);
      plaque.fillRoundedRect(-55, -62, 110, 36, 10);
      plaque.lineStyle(1.5, COLORS.goldDark, isUnlocked ? 0.45 : 0.2);
      plaque.strokeRoundedRect(-55, -62, 110, 36, 10);
      container.add(plaque);

      const nameText = this.add.text(0, -50, level.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: isUnlocked ? '#4E351C' : '#8C7D68',
        stroke: '#f8ecd5',
        strokeThickness: 1,
        align: 'center',
        wordWrap: { width: 100 }
      }).setOrigin(0.5);
      const yearText = this.add.text(0, -16, level.year, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: isUnlocked ? '#896437' : '#A18F78',
        stroke: '#f8ecd5',
        strokeThickness: 1
      }).setOrigin(0.5);
      container.add([nameText, yearText]);

      if (isCompleted) {
        const badge = this.add.text(21, -20, '✦', {
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#FFF2B7'
        }).setOrigin(0.5);
        badge.setBlendMode(Phaser.BlendModes.ADD);
        container.add(badge);
        this.createCompletedSparkles(level.x, level.y);
      }

      const hitArea = this.add.circle(0, 0, 34, 0x000000, 0);
      container.add(hitArea);

      if (isUnlocked) {
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerover', () => {
          this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 140, ease: 'Power2' });
        });
        hitArea.on('pointerout', () => {
          this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 140, ease: 'Power2' });
        });
        hitArea.on('pointerdown', () => this.startLevel(level));
      }

      if (isUnlocked && !isCompleted) {
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.15, to: 0.3 },
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 950,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.levelNodes.push({ container, level, isUnlocked, isCompleted });
    });
  }

  createCompletedSparkles(x, y) {
    for (let i = 0; i < 4; i++) {
      const sparkle = this.add.text(
        x + Phaser.Math.Between(-28, 28),
        y + Phaser.Math.Between(-28, 18),
        '✦',
        { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#FFEAA0' }
      ).setOrigin(0.5).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(4, 12),
        alpha: { from: 0.12, to: 0.65 },
        scale: { from: 0.8, to: 1.2 },
        duration: Phaser.Math.Between(700, 1200),
        yoyo: true,
        repeat: -1,
        delay: i * 180,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createMozartIcon(completedLevels) {
    let mozartLevelIndex = 0;
    for (let i = LEVEL_DATA.length - 1; i >= 0; i--) {
      if (completedLevels.includes(LEVEL_DATA[i].id)) {
        mozartLevelIndex = i;
        break;
      }
    }

    const targetLevel = LEVEL_DATA[mozartLevelIndex];
    this.mozartIcon = this.add.container(targetLevel.x, targetLevel.y - 72);
    const glow = this.add.circle(0, 0, 18, COLORS.goldLight, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    const wig = this.add.graphics();
    wig.fillStyle(0xf5efe4, 0.95);
    wig.fillEllipse(0, -9, 20, 18);
    wig.fillCircle(-9, -2, 5);
    wig.fillCircle(9, -2, 5);
    const head = this.add.circle(0, 0, 8, 0xf3caa9);
    // Face features
    const face = this.add.graphics();
    face.fillStyle(0x332211, 1);
    face.fillCircle(-3, -2, 1.5); // left eye
    face.fillCircle(3, -2, 1.5);  // right eye
    face.fillStyle(0xc07060, 1);
    face.fillEllipse(0, 3, 4, 2); // mouth
    const coat = this.add.graphics();
    coat.fillStyle(0x4567b4, 0.95);
    coat.fillTriangle(-9, 10, 0, 28, 9, 10);
    coat.fillRect(-6, 8, 12, 18);
    const accent = this.add.graphics();
    accent.fillStyle(COLORS.goldLight, 0.8);
    accent.fillCircle(0, 13, 2);
    accent.fillCircle(0, 19, 2);
    this.mozartIcon.add([glow, wig, head, face, coat, accent]);

    this.tweens.add({
      targets: this.mozartIcon,
      y: targetLevel.y - 78,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this.justCompletedLevel > 0 && this.justCompletedLevel < LEVEL_DATA.length) {
      const prevLevel = LEVEL_DATA[this.justCompletedLevel - 1];
      const nextLevel = LEVEL_DATA[this.justCompletedLevel];
      this.mozartIcon.setPosition(prevLevel.x, prevLevel.y - 58);
      this.time.delayedCall(450, () => {
        this.tweens.add({
          targets: this.mozartIcon,
          x: nextLevel.x,
          y: nextLevel.y - 58,
          duration: 1450,
          ease: 'Sine.easeInOut'
        });
      });
    }
  }

  createTitle() {
    drawTrebleClef(this, 64, 28, 1.1);
    drawTrebleClef(this, GAME_WIDTH - 84, 28, 1.1);

    this.add.text(GAME_WIDTH / 2, 33, "Mozart's Journey", {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#8C5E1E',
      stroke: '#FFF7E5',
      strokeThickness: 3
    }).setOrigin(0.5);

    const score = this.registry.get('score') || 0;
    this.add.text(GAME_WIDTH - 28, 60, `Score ${score}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#8C5E1E'
    }).setOrigin(1, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Follow the glowing road to continue Mozart’s grand tour', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#7A5834'
    }).setOrigin(0.5);

    const manager = getAchievementManager();
    if (manager) {
      this.add.text(28, GAME_HEIGHT - 20, `🏆 ${manager.getProgressPercent()}%`, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#8C5E1E'
      }).setOrigin(0, 0.5);
    }
  }

  createBackButton() {
    const container = this.add.container(76, 58);
    const bg = this.add.graphics();
    bg.fillStyle(0xf6e8ce, 0.8);
    bg.fillRoundedRect(-52, -16, 104, 32, 12);
    bg.lineStyle(1.5, COLORS.goldDark, 0.55);
    bg.strokeRoundedRect(-52, -16, 104, 32, 12);
    const label = this.add.text(0, 0, '← Menu', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#8C5E1E'
    }).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, 104, 32, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xfff5df, 0.92);
      bg.fillRoundedRect(-52, -16, 104, 32, 12);
      bg.lineStyle(1.5, COLORS.gold, 0.8);
      bg.strokeRoundedRect(-52, -16, 104, 32, 12);
      label.setColor('#6A4312');
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xf6e8ce, 0.8);
      bg.fillRoundedRect(-52, -16, 104, 32, 12);
      bg.lineStyle(1.5, COLORS.goldDark, 0.55);
      bg.strokeRoundedRect(-52, -16, 104, 32, 12);
      label.setColor('#8C5E1E');
    });
    hit.on('pointerdown', () => {
      this.sound.stopAll();
      this.scene.start('MenuScene');
    });
    container.add([bg, label, hit]);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.sound.stopAll();
      this.scene.start('MenuScene');
    });
  }

  startLevel(level) {
    this.cameras.main.fade(500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.registry.set('currentLevel', level.id);
        const completedLevels = this.registry.get('completedLevels') || [];
        if (completedLevels.includes(level.id)) {
          this.scene.start('LoadingScene', {
            targetScene: level.scene,
            targetData: {},
            launchScenes: ['UIScene']
          });
        } else {
          loadScene(this.scene, level.scene).then(() => {
            this.scene.start('CutsceneScene', { cutscene: level.cutscene, nextScene: level.scene });
            this.scene.launch('UIScene');
          }).catch(() => {
            this.scene.start('CutsceneScene', { cutscene: level.cutscene, nextScene: level.scene });
            this.scene.launch('UIScene');
          });
        }
      }
    });
  }
}
