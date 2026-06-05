import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getLeopoldPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level1Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level1Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 1,
      sceneKey: 'Level1Scene',
      title: 'Salzburg Beginnings',
      titleColor: '#FFFFFF',
      year: '1762',
      worldWidth: GAME_WIDTH * 3,
      parallaxConfig: PARALLAX_CONFIGS.level1,
      groundTexture: 'ground',
      groundSegments: null,
      platformData: [
        { x: 200, y: 360, w: 3 },
        { x: 400, y: 300, w: 2 },
        { x: 600, y: 340, w: 3 },
        { x: 850, y: 280, w: 2 },
        { x: 1050, y: 320, w: 3 },
        { x: 1250, y: 260, w: 2 },
        { x: 1450, y: 300, w: 3 },
        { x: 1650, y: 240, w: 2 },
        { x: 1900, y: 300, w: 4 },
        { x: 2150, y: 260, w: 2 },
        { x: 160, y: 270, w: 1 },
        { x: 130, y: 180, w: 1 },
        { x: 100, y: 90, w: 1 },
        { x: 340, y: 210, w: 1 },
        { x: 300, y: 130, w: 1 },
        { x: 590, y: 250, w: 1 },
        { x: 600, y: 155, w: 1 },
        { x: 870, y: 190, w: 1 },
        { x: 900, y: 100, w: 1 },
        { x: 1220, y: 170, w: 1 },
        { x: 1200, y: 90, w: 1 },
        { x: 1480, y: 210, w: 1 },
        { x: 1500, y: 130, w: 1 },
      ],
      buildings: { count: 8, startX: 100, spacing: 300 },
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        singers: [
          { x: 700, y: GAME_HEIGHT - 80 },
          { x: 1500, y: GAME_HEIGHT - 80 },
        ],
        dissonantNotes: [{ x: 900, y: 200 }],
      },
      coopExtraEnemies: {
        singers: [
          { x: 900, y: GAME_HEIGHT - 80 },
          { x: 1800, y: GAME_HEIGHT - 80 },
        ],
        dissonantNotes: [{ x: 1600, y: 200 }],
      },
      collectiblePositions: [
        { x: 250, y: 320 }, { x: 450, y: 260 }, { x: 650, y: 300 },
        { x: 900, y: 240 }, { x: 1100, y: 280 }, { x: 1300, y: 220 },
        { x: 1500, y: 260 }, { x: 1700, y: 200 }, { x: 1950, y: 260 },
      ],
      instrument: { x: 2200, y: GAME_HEIGHT - 100, texture: 'violin', displaySize: { w: 32, h: 48 }, name: 'violin' },
      boss: {
        x: 2100, y: GAME_HEIGHT - 120,
        texture: 'bossLeopoldMozart',
        name: 'Leopold Mozart',
        activateX: 1800,
        phasesGetter: getLeopoldPhases,
        dialogue: [
          '"Wolfgang! You think you can surpass your own father?"',
          '"Show me what I taught you — prove your independence!"',
          '"Let us see if the student has outgrown the teacher..."'
        ],
        victoryQuote: '"I am convinced that my son can stand on his own."\n— Leopold Mozart'
      },
      sheetMusicPositions: [
        { x: 130, y: 120 },
        { x: 1680, y: 140 },
        { x: 880, y: 130 },
      ],
      compositionNotes: {
        levelNum: 1,
        positions: [
          { x: 180, y: 140 }, { x: 420, y: 180 }, { x: 640, y: 150 },
          { x: 870, y: 160 }, { x: 1070, y: 130 }, { x: 1270, y: 170 },
          { x: 1470, y: 120 }, { x: 1700, y: 140 }
        ]
      },
      pitchPuzzle: { levelNum: 1, position: { x: 1600, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 1, x: 1000, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 800, y: GAME_HEIGHT - 64 },
        { x: 1500, y: GAME_HEIGHT - 64 },
        { x: 1900, y: GAME_HEIGHT - 64 },
      ],
      npc: { dataKey: 'haydn', x: 300, y: GAME_HEIGHT - 80 },
      practiceStage: { type: 'rhythm', x: 1200, difficulty: 1 },
      backgroundMusic: { key: 'music_vienna', volume: 0.25 },
      soundtrackKey: 'level1',
      adaptiveMusicMode: 'exploration',
      nextLevel: 2,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: true,
      fadeToWhite: false,
      fadeDuration: 1000,
    };
  }
}
