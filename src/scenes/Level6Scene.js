import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getGreyMessengerPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import Phaser from 'phaser';

export class Level6Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level6Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 6,
      sceneKey: 'Level6Scene',
      title: 'The Requiem Mystery',
      titleColor: '#9370DB',
      year: '1791',
      worldWidth: GAME_WIDTH * 3.2,
      parallaxConfig: PARALLAX_CONFIGS.level6,
      groundTexture: 'caveGround',
      groundSegments: null,
      ceiling: { texture: 'caveGround' },
      platformData: [
        { x: 200, y: 360, w: 2 }, { x: 380, y: 300, w: 3 },
        { x: 600, y: 340, w: 2 }, { x: 780, y: 260, w: 2 },
        { x: 950, y: 320, w: 3 }, { x: 1150, y: 240, w: 2 },
        { x: 1350, y: 300, w: 3 }, { x: 1550, y: 220, w: 2 },
        { x: 1750, y: 280, w: 2 }, { x: 1950, y: 200, w: 3 },
        { x: 2150, y: 260, w: 2 }, { x: 2350, y: 300, w: 3 },
        { x: 360, y: 210, w: 1 }, { x: 650, y: 170, w: 1 },
        { x: 830, y: 170, w: 1 }, { x: 1120, y: 160, w: 1 },
        { x: 1350, y: 210, w: 1 }, { x: 1590, y: 140, w: 1 },
      ],
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        drumTrolls: [450, 850, 1250, 1650, 2050],
        brokenInstruments: [700, 1100, 1500, 1900, 2300],
      },
      collectiblePositions: [
        { x: 220, y: 320 }, { x: 400, y: 260 }, { x: 620, y: 300 },
        { x: 800, y: 220 }, { x: 970, y: 280 }, { x: 1170, y: 200 },
        { x: 1370, y: 260 }, { x: 1570, y: 180 }, { x: 1770, y: 240 },
        { x: 1970, y: 160 }, { x: 2170, y: 220 }, { x: 2370, y: 260 },
      ],
      instrument: { x: 2500, y: GAME_HEIGHT - 100, texture: 'drums', displaySize: { w: 40, h: 36 }, name: 'drums' },
      boss: {
        x: 2400, y: GAME_HEIGHT - 120,
        texture: 'bossGreyMessenger',
        name: 'The Grey Messenger',
        activateX: 2050,
        phasesGetter: getGreyMessengerPhases,
        dialogue: [
          '"I come with a commission... a Requiem Mass."',
          '"Who sends me? That you need not know..."',
          '"Complete the work, Mozart. Time grows short."'
        ],
        victoryQuote: '"I feel that I shall not last much longer... the Requiem... for myself."\n— Mozart, 1791'
      },
      sheetMusicPositions: null,
      compositionNotes: {
        levelNum: 6,
        positions: [
          { x: 350, y: 120 }, { x: 600, y: 100 }, { x: 850, y: 130 },
          { x: 1100, y: 90 }, { x: 1350, y: 110 }, { x: 1600, y: 100 },
          { x: 1850, y: 120 }
        ]
      },
      pitchPuzzle: { levelNum: 6, position: { x: 1300, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 6, x: 1000, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 700, y: GAME_HEIGHT - 64 },
        { x: 1400, y: GAME_HEIGHT - 64 },
        { x: 2050, y: GAME_HEIGHT - 64 },
      ],
      npc: null,
      practiceStage: null,
      backgroundMusic: null,
      soundtrackKey: 'level6',
      adaptiveMusicMode: 'tension',
      nextLevel: 7,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: false,
      fadeToWhite: false,
      fadeDuration: 1500,
    };
  }

  createLevelSpecific() {
    // Darkness overlay
    this.darkness = this.add.graphics();
    this.darkness.setScrollFactor(0);
    this.darkness.setDepth(100);
    this.glowRadius = 120;
  }

  updateLevelSpecific() {
    this.updateDarkness();
  }

  updateDarkness() {
    this.darkness.clear();
    this.darkness.fillStyle(0x000000, 0.85);
    this.darkness.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const playerScreenX = this.mozart.x - this.cameras.main.scrollX;
    const playerScreenY = this.mozart.y - this.cameras.main.scrollY;

    const pulse = Math.sin(this.time.now / 500) * 10;
    const radius = this.glowRadius + pulse;

    this.darkness.setBlendMode(Phaser.BlendModes.ERASE);
    this.darkness.fillStyle(0xFFFFFF, 1);
    this.darkness.fillCircle(playerScreenX, playerScreenY, radius);
    this.darkness.fillCircle(playerScreenX, playerScreenY, radius * 0.6);
    this.darkness.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  // Override collectNote to increase glow radius
  collectNote(player, note) {
    super.collectNote(player, note);
    this.glowRadius = Math.min(this.glowRadius + 5, 180);
  }

  onInstrumentCollected() {
    if (this.darkness) {
      this.tweens.add({ targets: this.darkness, alpha: 0, duration: 800 });
    }
  }
}
