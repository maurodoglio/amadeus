import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getMozartShadowPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';
import Phaser from 'phaser';

export class Level7Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level7Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 7,
      sceneKey: 'Level7Scene',
      title: 'Eternal Legacy',
      titleColor: '#E0E0FF',
      year: '1791',
      worldWidth: GAME_WIDTH * 3.2,
      parallaxConfig: PARALLAX_CONFIGS.level7,
      groundTexture: null, // No ground - sky level
      groundSegments: null,
      platformData: [
        { x: 50, y: 400, w: 4 }, { x: 250, y: 340, w: 3 },
        { x: 450, y: 280, w: 2 }, { x: 350, y: 200, w: 2 },
        { x: 600, y: 360, w: 3 }, { x: 750, y: 260, w: 2 },
        { x: 900, y: 180, w: 3 }, { x: 1050, y: 320, w: 2 },
        { x: 1200, y: 240, w: 3 }, { x: 1400, y: 160, w: 2 },
        { x: 1350, y: 360, w: 3 }, { x: 1550, y: 280, w: 2 },
        { x: 1700, y: 200, w: 3 }, { x: 1900, y: 320, w: 2 },
        { x: 2050, y: 240, w: 3 }, { x: 2250, y: 160, w: 2 },
        { x: 2200, y: 360, w: 3 }, { x: 2450, y: 280, w: 4 },
        { x: 380, y: 120, w: 1, tint: 0xCCCCFF },
        { x: 1240, y: 160, w: 1, tint: 0xCCCCFF },
        { x: 1630, y: 140, w: 1, tint: 0xCCCCFF },
      ],
      playerStartPos: { x: 100, y: 350 },
      enemies: {
        singers: [{ x: 400, y: 300 }, { x: 900, y: 300 }, { x: 1400, y: 300 }, { x: 1900, y: 300 }],
        dissonantNotes: [{ x: 600, y: 200 }, { x: 1100, y: 150 }, { x: 1600, y: 130 }, { x: 2100, y: 120 }],
        brokenInstruments: [{ x: 800, y: 280 }, { x: 1300, y: 280 }, { x: 2000, y: 280 }],
      },
      collectiblePositions: [
        { x: 270, y: 300 }, { x: 470, y: 240 }, { x: 620, y: 320 },
        { x: 770, y: 220 }, { x: 920, y: 140 }, { x: 1070, y: 280 },
        { x: 1220, y: 200 }, { x: 1420, y: 120 }, { x: 1570, y: 240 },
        { x: 1720, y: 160 }, { x: 1920, y: 280 }, { x: 2070, y: 200 },
        { x: 2270, y: 120 },
      ],
      collectibleFloatRange: 15,
      collectibleFloatDuration: 1500,
      instrument: { x: 2550, y: 240, texture: 'harp', displaySize: { w: 36, h: 48 }, name: 'harp' },
      boss: {
        x: 2450, y: 200,
        texture: 'bossMozartShadow',
        name: "Mozart's Shadow",
        activateX: 2100,
        phasesGetter: getMozartShadowPhases,
        dialogue: [
          '"You cannot escape yourself, Wolfgang..."',
          '"Every note you write, I write in darkness."',
          '"To defeat me, you must outplay your own doubt!"'
        ],
        victoryQuote: '"Neither a lofty degree of intelligence nor imagination... go to the making of genius. Love, love, love, that is the soul of genius."\n— Mozart'
      },
      sheetMusicPositions: null,
      compositionNotes: {
        levelNum: 7,
        positions: [
          { x: 400, y: 80 }, { x: 800, y: 100 },
          { x: 1200, y: 70 }, { x: 1600, y: 90 }
        ]
      },
      pitchPuzzle: { levelNum: 7, position: { x: 1300, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 7, x: 1000, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 700, y: 340 },
        { x: 1400, y: 300 },
        { x: 2100, y: 260 },
      ],
      npc: { dataKey: 'beethoven', x: 920, y: 100 },
      practiceStage: null,
      backgroundMusic: null,
      soundtrackKey: 'level7',
      adaptiveMusicMode: 'exploration',
      nextLevel: null,
      nextScene: 'ConcertScene',
      usesTimeBonus: false,
      fadeToWhite: true,
      fadeDuration: 1500,
    };
  }

  createLevelSpecific() {
    // Low gravity for this level
    this.physics.world.gravity.y = 400;

    // Tint all non-stepping-stone platforms
    this.platforms.getChildren().forEach(plat => {
      if (!plat.getData('tinted')) {
        plat.setTint(0xCCCCFF);
      }
    });

    // Decorative clouds
    for (let i = 0; i < 12; i++) {
      const cx = Phaser.Math.Between(0, GAME_WIDTH * 3.2);
      const cy = Phaser.Math.Between(50, GAME_HEIGHT - 100);
      const cloud = this.add.ellipse(cx, cy, Phaser.Math.Between(60, 120), Phaser.Math.Between(20, 40), 0xFFFFFF, 0.15);
      cloud.setDepth(-1);
      this.tweens.add({
        targets: cloud,
        x: cx + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  onInstrumentCollected() {
    // Restore gravity before transitioning
    this.physics.world.gravity.y = 800;
  }
}
