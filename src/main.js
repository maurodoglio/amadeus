import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './config/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MapScene } from './scenes/MapScene.js';
import { CutsceneScene } from './scenes/CutsceneScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';
import { Level3Scene } from './scenes/Level3Scene.js';
import { Level4Scene } from './scenes/Level4Scene.js';
import { Level5Scene } from './scenes/Level5Scene.js';
import { Level6Scene } from './scenes/Level6Scene.js';
import { Level7Scene } from './scenes/Level7Scene.js';
import { ConcertScene } from './scenes/ConcertScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { UIScene } from './scenes/UIScene.js';
import { TouchControls } from './ui/TouchControls.js';
import { PauseScene } from './scenes/PauseScene.js';
import { AccessibilityScene } from './scenes/AccessibilityScene.js';
import { RhythmScene } from './scenes/RhythmScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { AchievementPopup } from './ui/AchievementPopup.js';
import { initAchievementManager } from './utils/AchievementManager.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 3
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PLAYER.GRAVITY },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, MapScene, CutsceneScene, TransitionScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, Level5Scene, Level6Scene, Level7Scene, LevelCompleteScene, ConcertScene, UIScene, TouchControls, PauseScene, AccessibilityScene, RhythmScene, AchievementsScene, AchievementPopup]
};

const game = new Phaser.Game(config);

// Initialize achievement system after game creation
initAchievementManager(game);
