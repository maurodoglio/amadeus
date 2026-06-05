import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './config/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MapScene } from './scenes/MapScene.js';
import { CutsceneScene } from './scenes/CutsceneScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { ConcertScene } from './scenes/ConcertScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { InstrumentLessonScene } from './scenes/InstrumentLessonScene.js';
import { UIScene } from './scenes/UIScene.js';
import { TouchControls } from './ui/TouchControls.js';
import { PauseScene } from './scenes/PauseScene.js';
import { AccessibilityScene } from './scenes/AccessibilityScene.js';
import { RhythmScene } from './scenes/RhythmScene.js';
import { MelodyMemoryScene } from './scenes/MelodyMemoryScene.js';
import { AchievementsScene } from './scenes/AchievementsScene.js';
import { AchievementPopup } from './ui/AchievementPopup.js';
import { initAchievementManager } from './utils/AchievementManager.js';
import { LoadingScene } from './utils/SceneLoader.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true
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
  scene: [BootScene, MenuScene, MapScene, CutsceneScene, TransitionScene, LevelCompleteScene, InstrumentLessonScene, ConcertScene, UIScene, TouchControls, PauseScene, AccessibilityScene, RhythmScene, MelodyMemoryScene, AchievementsScene, AchievementPopup, LoadingScene]
};

const game = new Phaser.Game(config);

// Expose game instance for integration testing
window.game = game;

// Initialize achievement system after game creation
initAchievementManager(game);

