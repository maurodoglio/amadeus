import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ACHIEVEMENTS, getAchievementManager } from '../utils/AchievementManager.js';

/**
 * Gallery view showing all achievements and their unlock status.
 * Accessible from the MenuScene.
 */
export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementsScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const manager = getAchievementManager();
    const achievements = manager.getAllAchievements();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '🏆 ACHIEVEMENTS', {
      font: 'bold 28px monospace',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Progress bar
    const progress = manager.getProgressPercent();
    const barWidth = 300;
    const barX = GAME_WIDTH / 2 - barWidth / 2;
    const barY = 60;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, 16, 8);

    const barFill = this.add.graphics();
    barFill.fillStyle(0xFFD700, 1);
    barFill.fillRoundedRect(barX, barY, barWidth * (progress / 100), 16, 8);

    this.add.text(GAME_WIDTH / 2, barY + 8, `${progress}% Complete (${manager.getUnlockedCount()}/${manager.getTotalCount()})`, {
      font: '10px monospace',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Achievement grid
    const startY = 100;
    const itemHeight = 56;
    const columns = 1;
    const itemWidth = GAME_WIDTH - 80;

    achievements.forEach((achievement, index) => {
      const row = Math.floor(index / columns);
      const x = 40;
      const y = startY + row * itemHeight;

      // Card background
      const cardBg = this.add.graphics();
      const cardColor = achievement.unlocked ? 0x2a2a4e : 0x1e1e3e;
      cardBg.fillStyle(cardColor, 1);
      cardBg.fillRoundedRect(x, y, itemWidth, itemHeight - 6, 6);

      if (achievement.unlocked) {
        cardBg.lineStyle(1, 0xFFD700, 0.5);
        cardBg.strokeRoundedRect(x, y, itemWidth, itemHeight - 6, 6);
      }

      // Icon
      const displayIcon = achievement.unlocked || !achievement.secret ? achievement.icon : '❓';
      this.add.text(x + 20, y + (itemHeight - 6) / 2, displayIcon, {
        font: '22px Arial'
      }).setOrigin(0, 0.5);

      // Name
      const displayName = achievement.unlocked || !achievement.secret ? achievement.name : '???';
      this.add.text(x + 52, y + 12, displayName, {
        font: 'bold 13px monospace',
        fill: achievement.unlocked ? '#FFFFFF' : '#666666'
      });

      // Description
      const displayDesc = achievement.unlocked || !achievement.secret ? achievement.description : 'Hidden achievement';
      this.add.text(x + 52, y + 30, displayDesc, {
        font: '11px monospace',
        fill: achievement.unlocked ? '#AAAAAA' : '#444444'
      });

      // Unlocked checkmark
      if (achievement.unlocked) {
        this.add.text(x + itemWidth - 30, y + (itemHeight - 6) / 2, '✓', {
          font: 'bold 18px monospace',
          fill: '#00FF00'
        }).setOrigin(0.5);
      }
    });

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '← Back to Menu', {
      font: '16px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setFill('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setFill('#87CEEB'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Keyboard back
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('MenuScene'));
  }
}
