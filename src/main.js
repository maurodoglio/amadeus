import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './config/constants.js';
import { TestHelper } from './utils/TestHelper.js';
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
import { RecoveryScene } from './scenes/RecoveryScene.js';
import { HighScoresScene } from './scenes/HighScoresScene.js';
import { installGlobalErrorHandlers } from './utils/ErrorBoundary.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true
  },
  input: {
    activePointers: 3,
    keyboard: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PLAYER.GRAVITY },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, HighScoresScene, MapScene, CutsceneScene, TransitionScene, LevelCompleteScene, InstrumentLessonScene, ConcertScene, UIScene, TouchControls, PauseScene, AccessibilityScene, RhythmScene, MelodyMemoryScene, AchievementsScene, AchievementPopup, LoadingScene, RecoveryScene]
};

// Patch Phaser AnimationState to guard against null currentFrame.duration crash.
// This occurs when a sprite is destroyed mid-animation or an animation references
// frames that don't exist in the texture, causing currentFrame to become undefined.
const origAnimUpdate = Phaser.Animations.AnimationState.prototype.update;
Phaser.Animations.AnimationState.prototype.update = function (time, delta) {
  if (!this.currentAnim || !this.currentFrame) {
    return;
  }
  return origAnimUpdate.call(this, time, delta);
};

const game = new Phaser.Game(config);

// Expose game instance for integration testing
window.game = game;
// Install global error handlers for graceful degradation
installGlobalErrorHandlers(game);

// Initialize achievement system after game creation
initAchievementManager(game);

// Initialize test helper in test mode (?test=1 in URL)
if (window.location.search.includes('test=1')) {
  TestHelper.init(game);
}

