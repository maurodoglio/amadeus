import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const LEVEL_IMPORTS = {
  Level1Scene: () => import('../scenes/Level1Scene.js'),
  Level2Scene: () => import('../scenes/Level2Scene.js'),
  Level3Scene: () => import('../scenes/Level3Scene.js'),
  Level4Scene: () => import('../scenes/Level4Scene.js'),
  Level5Scene: () => import('../scenes/Level5Scene.js'),
  Level6Scene: () => import('../scenes/Level6Scene.js'),
  Level7Scene: () => import('../scenes/Level7Scene.js'),
};

/**
 * Lazily loads and registers a level scene. If the scene is already registered,
 * resolves immediately without re-importing.
 */
export async function loadScene(sceneManager, sceneKey) {
  // Already registered — nothing to do
  if (sceneManager.getScene(sceneKey)) {
    return;
  }

  const importFn = LEVEL_IMPORTS[sceneKey];
  if (!importFn) {
    // Not a lazy-loaded scene; assume it's already registered
    return;
  }

  const module = await importFn();
  const SceneClass = module[sceneKey];
  sceneManager.add(sceneKey, SceneClass);
}

/**
 * Shows a loading overlay while a level scene is being fetched.
 */
export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  init(data) {
    this.targetScene = data.targetScene;
    this.targetData = data.targetData || {};
    this.launchScenes = data.launchScenes || [];
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '♩ Loading... ♩', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#FFD700',
    }).setOrigin(0.5);

    const dots = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    let dotCount = 0;
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        dotCount = (dotCount + 1) % 4;
        dots.setText('.'.repeat(dotCount));
      }
    });

    this.loadAndStart();
  }

  async loadAndStart() {
    try {
      await loadScene(this.scene, this.targetScene);
      this.scene.start(this.targetScene, this.targetData);
      for (const s of this.launchScenes) {
        this.scene.launch(s);
      }
    } catch (err) {
      console.error(`Failed to load scene: ${this.targetScene}`, err);
      this.scene.start('MapScene');
    }
  }
}
