import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getMariaTheresaPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level2Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level2Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 2,
      sceneKey: 'Level2Scene',
      title: 'The Grand Tour',
      titleColor: '#90EE90',
      year: '1763–1766',
      worldWidth: GAME_WIDTH * 3.2,
      parallaxConfig: PARALLAX_CONFIGS.level2,
      groundTexture: 'forestGround',
      groundSegments: [
        { start: 0, end: 300 },
        { start: 380, end: 700 },
        { start: 780, end: 1100 },
        { start: 1200, end: 1600 },
        { start: 1700, end: 2000 },
        { start: 2100, end: 2500 },
      ],
      platformData: [
        { x: 320, y: 380, w: 2 }, { x: 180, y: 300, w: 2 },
        { x: 400, y: 240, w: 3 }, { x: 650, y: 300, w: 2 },
        { x: 850, y: 250, w: 2 }, { x: 1050, y: 300, w: 3 },
        { x: 1300, y: 240, w: 2 }, { x: 1500, y: 200, w: 2 },
        { x: 1700, y: 280, w: 3 }, { x: 1950, y: 220, w: 2 },
        { x: 2200, y: 260, w: 3 }, { x: 2400, y: 200, w: 2 },
        { x: 200, y: 210, w: 1 }, { x: 220, y: 130, w: 1 },
        { x: 460, y: 160, w: 1 }, { x: 780, y: 160, w: 1 },
        { x: 950, y: 160, w: 1 }, { x: 1200, y: 160, w: 1 },
        { x: 1170, y: 90, w: 1 }, { x: 1690, y: 190, w: 1 },
      ],
      movingPlatforms: [
        { x: 750, y: 350, rangeX: 100, rangeY: 0 },
        { x: 1150, y: 200, rangeX: 0, rangeY: 80 },
        { x: 1600, y: 320, rangeX: 80, rangeY: 0 },
        { x: 2050, y: 160, rangeX: 0, rangeY: 60 },
      ],
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        drumTrolls: [500, 1400, 1900],
        brokenInstruments: [1300, 2200],
        dissonantNotes: [{ x: 600, y: 200 }, { x: 1100, y: 160 }, { x: 1800, y: 150 }],
      },
      coopExtraEnemies: {
        drumTrolls: [750],
        brokenInstruments: [1800],
        dissonantNotes: [{ x: 900, y: 180 }],
      },
      collectiblePositions: [
        { x: 200, y: 260 }, { x: 420, y: 200 }, { x: 660, y: 260 },
        { x: 870, y: 210 }, { x: 1070, y: 260 }, { x: 1320, y: 200 },
        { x: 1520, y: 160 }, { x: 1720, y: 240 }, { x: 1970, y: 180 },
        { x: 2220, y: 220 }, { x: 2420, y: 160 },
      ],
      instrument: { x: 2450, y: GAME_HEIGHT - 100, texture: 'flute', displaySize: { w: 48, h: 16 }, name: 'flute' },
      boss: {
        x: 2350, y: GAME_HEIGHT - 120,
        texture: 'bossEmpressMaria',
        name: 'Empress Maria Theresa',
        activateX: 2000,
        phasesGetter: getMariaTheresaPhases,
        dialogue: [
          '"A child prodigy seeks audience with the Empress?"',
          '"Prove yourself worthy of the Imperial court!"',
          '"My guards shall test your resolve, young Mozart."'
        ],
        victoryQuote: '"The Empress kissed me and took me on her lap."\n— Mozart, age 6'
      },
      sheetMusicPositions: [
        { x: 760, y: 100 },
        { x: 1170, y: 80 },
        { x: 2430, y: 100 },
      ],
      compositionNotes: {
        levelNum: 2,
        positions: [
          { x: 220, y: 100 }, { x: 480, y: 130 }, { x: 720, y: 90 },
          { x: 960, y: 120 }, { x: 1200, y: 100 }, { x: 1440, y: 140 },
          { x: 1680, y: 110 }
        ]
      },
      pitchPuzzle: { levelNum: 2, position: { x: 1700, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 2, x: 1100, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 900, y: GAME_HEIGHT - 64 },
        { x: 1700, y: GAME_HEIGHT - 64 },
        { x: 2100, y: GAME_HEIGHT - 64 },
      ],
      npc: null,
      practiceStage: { type: 'rhythm', x: 1800, difficulty: 2 },
      backgroundMusic: { key: 'music_forest', volume: 0.25 },
      soundtrackKey: 'level2',
      adaptiveMusicMode: 'exploration',
      nextLevel: 3,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: true,
      fadeToWhite: false,
      fadeDuration: 1000,
    };
  }
}
