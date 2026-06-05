import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getDebtCollectorPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import Phaser from 'phaser';

export class Level5Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level5Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 5,
      sceneKey: 'Level5Scene',
      title: 'Storm & Struggle',
      titleColor: '#ADD8E6',
      year: '1786',
      worldWidth: GAME_WIDTH * 3.3,
      parallaxConfig: PARALLAX_CONFIGS.level5,
      groundTexture: 'mountainGround',
      groundSegments: [
        { start: 0, end: 250 }, { start: 350, end: 600 },
        { start: 700, end: 950 }, { start: 1050, end: 1350 },
        { start: 1450, end: 1700 }, { start: 1800, end: 2100 },
        { start: 2200, end: 2600 },
      ],
      platformData: [
        { x: 270, y: 370, w: 2 }, { x: 450, y: 300, w: 2 },
        { x: 620, y: 340, w: 2 }, { x: 800, y: 260, w: 3 },
        { x: 1000, y: 300, w: 2 }, { x: 1200, y: 230, w: 2 },
        { x: 1400, y: 280, w: 3 }, { x: 1650, y: 220, w: 2 },
        { x: 1850, y: 280, w: 2 }, { x: 2050, y: 200, w: 3 },
        { x: 2300, y: 260, w: 2 }, { x: 2500, y: 200, w: 2 },
        { x: 350, y: 210, w: 1 }, { x: 300, y: 130, w: 1 },
        { x: 650, y: 180, w: 1 }, { x: 850, y: 170, w: 1 },
        { x: 900, y: 100, w: 1 }, { x: 1200, y: 140, w: 1 },
        { x: 1530, y: 140, w: 1 }, { x: 1800, y: 190, w: 1 },
      ],
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        drumTrolls: [500, 900, 1300, 1700, 2100],
        dissonantNotes: [{ x: 650, y: 200 }, { x: 1050, y: 180 }, { x: 1550, y: 160 }, { x: 2000, y: 150 }],
      },
      collectiblePositions: [
        { x: 200, y: 330 }, { x: 470, y: 260 }, { x: 640, y: 300 },
        { x: 820, y: 220 }, { x: 1020, y: 260 }, { x: 1220, y: 190 },
        { x: 1420, y: 240 }, { x: 1670, y: 180 }, { x: 1870, y: 240 },
        { x: 2070, y: 160 }, { x: 2320, y: 220 },
      ],
      instrument: { x: 2550, y: GAME_HEIGHT - 100, texture: 'trumpet', displaySize: { w: 40, h: 24 }, name: 'trumpet' },
      boss: {
        x: 2450, y: GAME_HEIGHT - 120,
        texture: 'bossClementi',
        name: 'Muzio Clementi',
        activateX: 2100,
        phasesGetter: getDebtCollectorPhases,
        dialogue: [
          '"Mozart! The Emperor pits us against each other!"',
          '"My rapid scales shall outrun your melodies!"',
          '"Let us see whose fingers are truly faster!"'
        ],
        victoryQuote: '"He plays well, but has no taste or feeling."\n— Mozart on Clementi, 1782'
      },
      sheetMusicPositions: null,
      compositionNotes: {
        levelNum: 5,
        positions: [
          { x: 300, y: 90 }, { x: 600, y: 110 }, { x: 900, y: 80 },
          { x: 1200, y: 100 }, { x: 1500, y: 90 }, { x: 1800, y: 120 }
        ]
      },
      pitchPuzzle: { levelNum: 5, position: { x: 1400, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 5, x: 1100, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 700, y: GAME_HEIGHT - 64 },
        { x: 1400, y: GAME_HEIGHT - 64 },
        { x: 2100, y: GAME_HEIGHT - 64 },
      ],
      npc: null,
      practiceStage: null,
      backgroundMusic: null,
      soundtrackKey: 'level5',
      adaptiveMusicMode: 'exploration',
      nextLevel: 6,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: false,
      fadeToWhite: false,
      fadeDuration: 1000,
    };
  }

  createLevelSpecific() {
    this.windTimer = 0;
    this.windDirection = 1;
    this.windStrength = 0;

    // Wind indicator UI
    this.windArrow = this.add.text(GAME_WIDTH / 2, 30, '→ Wind →', {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Wind particles
    this.windParticles = [];
    for (let i = 0; i < 8; i++) {
      const particle = this.add.text(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(50, GAME_HEIGHT - 100),
        '~',
        { font: '12px monospace', fill: '#FFFFFF' }
      ).setAlpha(0.3);
      this.windParticles.push(particle);
    }
  }

  updateLevelSpecific(time, delta) {
    // Wind gust mechanic
    this.windTimer += delta;
    if (this.windTimer >= 3000) {
      this.windTimer = 0;
      this.windDirection = Phaser.Math.RND.pick([-1, 1]);
      this.windStrength = Phaser.Math.Between(40, 120);

      const arrowText = this.windDirection > 0 ? '→ Wind →' : '← Wind ←';
      this.windArrow.setText(arrowText);
      this.windArrow.setAlpha(1);
      this.tweens.add({
        targets: this.windArrow,
        alpha: 0,
        delay: 2000,
        duration: 500
      });
    }

    // Apply wind force when airborne
    if (this.mozart && !this.mozart.body.blocked.down) {
      this.mozart.setVelocityX(
        this.mozart.body.velocity.x + this.windDirection * this.windStrength * (delta / 1000)
      );
    }

    // Animate wind particles
    this.windParticles.forEach(p => {
      p.x += this.windDirection * 2;
      if (p.x > GAME_WIDTH + 50) p.x = -50;
      if (p.x < -50) p.x = GAME_WIDTH + 50;
    });
  }
}
