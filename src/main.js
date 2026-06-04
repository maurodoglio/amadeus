import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER } from './config/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CutsceneScene } from './scenes/CutsceneScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';
import { Level3Scene } from './scenes/Level3Scene.js';
import { ConcertScene } from './scenes/ConcertScene.js';
import { UIScene } from './scenes/UIScene.js';
import { TouchControls } from './ui/TouchControls.js';
import { PauseScene } from './scenes/PauseScene.js';

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
  scene: [BootScene, MenuScene, CutsceneScene, Level1Scene, Level2Scene, Level3Scene, ConcertScene, UIScene, TouchControls, PauseScene]
};

const game = new Phaser.Game(config);