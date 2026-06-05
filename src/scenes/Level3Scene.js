import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getColloredoPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level3Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level3Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 3,
      sceneKey: 'Level3Scene',
      title: "Archbishop's Palace",
      titleColor: '#FFD700',
      year: '1772',
      worldWidth: GAME_WIDTH * 3.5,
      parallaxConfig: PARALLAX_CONFIGS.level3,
      groundTexture: 'palaceGround',
      groundSegments: null,
      platformData: [
        { x: 200, y: 360, w: 2 }, { x: 350, y: 280, w: 3 },
        { x: 550, y: 320, w: 2 }, { x: 700, y: 240, w: 2 },
        { x: 900, y: 300, w: 3 }, { x: 1100, y: 220, w: 2 },
        { x: 1300, y: 280, w: 3 }, { x: 1500, y: 200, w: 2 },
        { x: 1700, y: 260, w: 2 }, { x: 1900, y: 320, w: 3 },
        { x: 2200, y: 340, w: 4 }, { x: 2400, y: 260, w: 3 },
        { x: 2200, y: 180, w: 3 }, { x: 2500, y: 180, w: 2 },
        { x: 120, y: 270, w: 1 }, { x: 70, y: 190, w: 1 },
        { x: 360, y: 190, w: 1 }, { x: 350, y: 110, w: 1 },
        { x: 600, y: 160, w: 1 }, { x: 750, y: 160, w: 1 },
        { x: 1060, y: 140, w: 1 }, { x: 1290, y: 190, w: 1 },
        { x: 1300, y: 110, w: 1 },
      ],
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        singers: [300, 1200],
        drumTrolls: [600, 1600],
        dissonantNotes: [{ x: 450, y: 180 }, { x: 1100, y: 160 }],
        brokenInstruments: [900, 1400],
      },
      coopExtraEnemies: {
        singers: [500, 1000],
        drumTrolls: [1400],
        dissonantNotes: [{ x: 800, y: 150 }],
        brokenInstruments: [1800],
      },
      collectiblePositions: [
        { x: 220, y: 320 }, { x: 370, y: 240 }, { x: 570, y: 280 },
        { x: 720, y: 200 }, { x: 920, y: 260 }, { x: 1120, y: 180 },
        { x: 1320, y: 240 }, { x: 1520, y: 160 }, { x: 1720, y: 220 },
      ],
      instrument: { x: 2700, y: GAME_HEIGHT - 100, texture: 'piano', displaySize: { w: 48, h: 32 }, name: 'piano' },
      boss: {
        x: 2500, y: GAME_HEIGHT - 120,
        texture: 'bossArchbishopColloredo',
        name: 'Archbishop Colloredo',
        activateX: 2100,
        phasesGetter: getColloredoPhases,
        dialogue: [
          '"You ungrateful servant! You belong to me, Mozart!"',
          '"I shall bind you with obligations you cannot escape!"',
          '"No one leaves my service without permission!"'
        ],
        victoryQuote: '"I am no longer so unfortunate as to be in Salzburg service."\n— Mozart, 1781'
      },
      sheetMusicPositions: [
        { x: 380, y: 100 },
        { x: 2250, y: 80 },
        { x: 50, y: 140 },
      ],
      compositionNotes: {
        levelNum: 3,
        positions: [
          { x: 300, y: 100 }, { x: 550, y: 120 }, { x: 800, y: 90 },
          { x: 1050, y: 110 }, { x: 1300, y: 100 }, { x: 1550, y: 130 }
        ]
      },
      pitchPuzzle: { levelNum: 3, position: { x: 1500, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 3, x: 950, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 700, y: GAME_HEIGHT - 64 },
        { x: 1400, y: GAME_HEIGHT - 64 },
        { x: 2100, y: GAME_HEIGHT - 64 },
      ],
      npc: { dataKey: 'salieri', x: 500, y: GAME_HEIGHT - 80 },
      practiceStage: { type: 'melody', x: 1050, difficulty: 2 },
      backgroundMusic: { key: 'music_palace', volume: 0.25 },
      soundtrackKey: 'level3',
      adaptiveMusicMode: 'exploration',
      nextLevel: 4,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: true,
      fadeToWhite: false,
      fadeDuration: 1500,
    };
  }

  createLevelSpecific() {
    this.bossDefeated = false;
  }
}
