import { BaseLevelScene } from './BaseLevelScene.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { getSalieriPhases } from '../mechanics/BossPhaseDefinitions.js';
import { PARALLAX_CONFIGS } from '../utils/ParallaxBackground.js';

export class Level4Scene extends BaseLevelScene {
  constructor() {
    super({ key: 'Level4Scene' });
  }

  getLevelConfig() {
    return {
      levelNumber: 4,
      sceneKey: 'Level4Scene',
      title: 'Vienna Opera',
      titleColor: '#FF6347',
      year: '1781',
      worldWidth: GAME_WIDTH * 3,
      parallaxConfig: PARALLAX_CONFIGS.level4,
      groundTexture: 'operaGround',
      groundSegments: null,
      platformData: [
        { x: 200, y: 360, w: 3 }, { x: 450, y: 300, w: 2 },
        { x: 650, y: 240, w: 3 }, { x: 900, y: 320, w: 2 },
        { x: 1100, y: 260, w: 3 }, { x: 1350, y: 200, w: 2 },
        { x: 1550, y: 280, w: 3 }, { x: 1800, y: 220, w: 2 },
        { x: 2000, y: 300, w: 3 }, { x: 2200, y: 240, w: 2 },
        { x: 230, y: 270, w: 1 }, { x: 250, y: 180, w: 1 },
        { x: 550, y: 160, w: 1 }, { x: 720, y: 160, w: 1 },
        { x: 1030, y: 170, w: 1 }, { x: 1760, y: 150, w: 1 },
      ],
      playerStartPos: { x: 100, y: GAME_HEIGHT - 100 },
      enemies: {
        singers: [
          { x: 400, y: GAME_HEIGHT - 80 }, { x: 750, y: GAME_HEIGHT - 80 },
          { x: 1150, y: GAME_HEIGHT - 80 }, { x: 1600, y: GAME_HEIGHT - 80 },
        ],
        dissonantNotes: [{ x: 550, y: 200 }, { x: 1000, y: 180 }, { x: 1900, y: 150 }],
      },
      collectiblePositions: [
        { x: 250, y: 320 }, { x: 470, y: 260 }, { x: 680, y: 200 },
        { x: 920, y: 280 }, { x: 1120, y: 220 }, { x: 1370, y: 160 },
        { x: 1570, y: 240 }, { x: 1820, y: 180 }, { x: 2020, y: 260 },
        { x: 2220, y: 200 },
      ],
      instrument: { x: 2350, y: GAME_HEIGHT - 100, texture: 'harpsichord', displaySize: { w: 48, h: 32 }, name: 'harpsichord' },
      boss: {
        x: 2250, y: GAME_HEIGHT - 120,
        texture: 'bossSalieri',
        name: 'Antonio Salieri',
        activateX: 1900,
        phasesGetter: getSalieriPhases,
        dialogue: [
          '"Ah, the great Mozart... Let us see who truly commands music."',
          '"My dark melodies shall overwhelm your bright compositions!"',
          '"Only one of us can be the Emperor\'s Kapellmeister!"'
        ],
        victoryQuote: '"Salieri admitted that Mozart\'s music was sublime."\n— Historical accounts'
      },
      sheetMusicPositions: null,
      compositionNotes: {
        levelNum: 4,
        positions: [
          { x: 250, y: 130 }, { x: 500, y: 110 }, { x: 750, y: 140 },
          { x: 1000, y: 100 }, { x: 1250, y: 120 }, { x: 1500, y: 130 },
          { x: 1750, y: 110 }
        ]
      },
      pitchPuzzle: { levelNum: 4, position: { x: 1400, y: GAME_HEIGHT - 130 } },
      chordDoor: { levelNum: 4, x: 1200, y: GAME_HEIGHT - TILE_SIZE, rewards: { health: true, score: true, compositionNote: true } },
      checkpointPositions: [
        { x: 800, y: GAME_HEIGHT - 64 },
        { x: 1500, y: GAME_HEIGHT - 64 },
        { x: 2000, y: GAME_HEIGHT - 64 },
      ],
      npc: { dataKey: 'nannerlNPC', x: 200, y: GAME_HEIGHT - 80 },
      practiceStage: null,
      backgroundMusic: null,
      soundtrackKey: 'level4',
      adaptiveMusicMode: 'exploration',
      nextLevel: 5,
      nextScene: 'LevelCompleteScene',
      usesTimeBonus: false,
      fadeToWhite: false,
      fadeDuration: 1000,
    };
  }

  createLevelSpecific() {
    // Rhythm platforms - only solid on the beat
    this.rhythmPlatforms = this.physics.add.staticGroup();
    this.rhythmPlatformSprites = [];
    this.rhythmTimer = 0;
    this.rhythmBeat = false;

    const rhythmData = [
      { x: 350, y: 280 }, { x: 800, y: 240 },
      { x: 1250, y: 220 }, { x: 1700, y: 200 }, { x: 2100, y: 180 },
    ];

    rhythmData.forEach(rp => {
      for (let i = 0; i < 2; i++) {
        const plat = this.rhythmPlatforms.create(rp.x + i * TILE_SIZE, rp.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody()
          .setTint(0xFF4500);
        this.rhythmPlatformSprites.push(plat);
      }
    });

    this.physics.add.collider(this.mozart, this.rhythmPlatforms);

    // Beat indicator UI
    this.beatIndicator = this.add.circle(GAME_WIDTH / 2, 30, 15, 0xFF4500, 0.5)
      .setScrollFactor(0);
    this.beatText = this.add.text(GAME_WIDTH / 2, 30, '♪', {
      font: '16px serif', fill: '#FFD700'
    }).setOrigin(0.5).setScrollFactor(0);
  }

  updateLevelSpecific(time, delta) {
    // Rhythm mechanic: platforms toggle on/off every 1.2 seconds
    this.rhythmTimer += delta;
    if (this.rhythmTimer >= 1200) {
      this.rhythmTimer = 0;
      this.rhythmBeat = !this.rhythmBeat;

      this.rhythmPlatformSprites.forEach(plat => {
        if (this.rhythmBeat) {
          plat.setAlpha(1);
          plat.body.enable = true;
          plat.setTint(0x00FF00);
        } else {
          plat.setAlpha(0.3);
          plat.body.enable = false;
          plat.setTint(0xFF4500);
        }
      });

      this.tweens.add({
        targets: this.beatIndicator,
        scaleX: 1.5, scaleY: 1.5,
        duration: 150,
        yoyo: true
      });
      this.beatIndicator.setFillStyle(this.rhythmBeat ? 0x00FF00 : 0xFF4500, 0.8);
    }
  }
}
