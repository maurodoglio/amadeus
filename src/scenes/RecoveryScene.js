import Phaser from 'phaser';

/**
 * Recovery scene that resets the game to a clean state after an error.
 * Stops all other scenes, resets registry, and returns to the menu.
 */
export class RecoveryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RecoveryScene' });
  }

  create() {
    // Stop all other scenes
    this.scene.manager.getScenes(false).forEach(scene => {
      if (scene.scene.key !== 'RecoveryScene') {
        this.scene.stop(scene.scene.key);
      }
    });

    // Reset game state
    this.registry.set('lives', 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', false);
    this.registry.set('sheetMusicCurrentLevel', { found: 0, total: 3 });

    // Show brief recovery message
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#1a0a05');

    const text = this.add.text(width / 2, height / 2, 'Recovering...', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#F5E6D3',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Fade in then transition to menu
    this.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.scene.start('MenuScene');
        });
      }
    });
  }
}
