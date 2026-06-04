import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class ConcertScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ConcertScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Stage
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 100, 120, 0x4a2c2a);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 120, 4, 0xFFD700);

    // Curtains
    this.add.rectangle(30, GAME_HEIGHT / 2, 60, GAME_HEIGHT, 0x8B0000);
    this.add.rectangle(GAME_WIDTH - 30, GAME_HEIGHT / 2, 60, GAME_HEIGHT, 0x8B0000);
    this.add.rectangle(GAME_WIDTH / 2, 20, GAME_WIDTH - 60, 40, 0x8B0000);

    // Mozart on stage
    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 160, 'mozart').setScale(3);
    }

    // Instruments displayed
    const instruments = this.registry.get('instruments') || ['violin', 'flute', 'piano'];
    const instrumentSpacing = 150;
    const startX = GAME_WIDTH / 2 - (instruments.length - 1) * instrumentSpacing / 2;

    instruments.forEach((inst, i) => {
      if (this.textures.exists(inst)) {
        this.add.image(startX + i * instrumentSpacing, GAME_HEIGHT - 260, inst).setScale(1.5);
      }
    });

    // Spotlights
    const spotlight = this.add.circle(GAME_WIDTH / 2, 80, 150, 0xFFFF00, 0.1);
    this.tweens.add({
      targets: spotlight,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Musical notes floating
    for (let i = 0; i < 15; i++) {
      const note = this.add.text(
        Phaser.Math.Between(100, GAME_WIDTH - 100),
        Phaser.Math.Between(50, GAME_HEIGHT - 150),
        Phaser.Math.RND.pick(['♪', '♫', '♬', '🎵', '🎶']),
        { font: `${Phaser.Math.Between(16, 32)}px serif`, fill: '#FFD700' }
      ).setAlpha(0);

      this.tweens.add({
        targets: note,
        alpha: 0.8,
        y: note.y - 50,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Congratulations text
    const congratsText = this.add.text(GAME_WIDTH / 2, 100, 'THE GRAND CONCERT', {
      font: '36px monospace',
      fill: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    const score = this.registry.get('score') || 0;
    const scoreText = this.add.text(GAME_WIDTH / 2, 150, `Final Score: ${score}`, {
      font: '20px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(0);

    const endText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Mozart became the greatest musician of all time!', {
      font: '14px monospace',
      fill: '#90EE90'
    }).setOrigin(0.5).setAlpha(0);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'Press SPACE to play again', {
      font: '12px monospace',
      fill: '#808080'
    }).setOrigin(0.5).setAlpha(0);

    // Animate text in
    this.tweens.add({ targets: congratsText, alpha: 1, duration: 1000, delay: 500 });
    this.tweens.add({ targets: scoreText, alpha: 1, duration: 1000, delay: 1500 });
    this.tweens.add({ targets: endText, alpha: 1, duration: 1000, delay: 3000 });
    this.tweens.add({ targets: restartText, alpha: 1, duration: 1000, delay: 4000 });

    // Restart
    this.time.delayedCall(4000, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.start('MenuScene');
      });
      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
