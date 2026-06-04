import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Lives display - Mozart head icons
    this.livesIcons = [];
    this.updateLivesIcons(this.registry.get('lives'));

    // Score display
    this.scoreText = this.add.text(GAME_WIDTH - 16, 16, '', {
      font: '16px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 0);

    // Instruments display
    this.instrumentsText = this.add.text(GAME_WIDTH / 2, 16, '', {
      font: '14px monospace',
      fill: '#87CEEB'
    }).setOrigin(0.5, 0);

    // Sheet music pages counter
    this.sheetMusicText = this.add.text(GAME_WIDTH - 16, 36, '', {
      font: '12px monospace',
      fill: '#F5DEB3'
    }).setOrigin(1, 0);

    // Co-op indicator
    const coopMode = this.registry.get('coopMode');
    if (coopMode) {
      this.add.text(16, GAME_HEIGHT - 24, 'P1: Arrows+SPACE  P2: WASD+E', {
        font: '10px monospace',
        fill: '#808080'
      });
    }

    // Combo display
    this.comboContainer = this.add.container(GAME_WIDTH - 16, 44);
    this.comboText = this.add.text(0, 0, '', {
      font: 'bold 20px monospace',
      fill: '#FF6600',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);
    this.comboContainer.add(this.comboText);
    this.comboContainer.setAlpha(0);

    // Listen for registry changes
    this.registry.events.on('changedata-lives', this.updateLives, this);
    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-instruments', this.updateInstruments, this);
    this.registry.events.on('changedata-sheetMusicCurrentLevel', this.updateSheetMusic, this);
    this.registry.events.on('changedata-comboMultiplier', this.updateCombo, this);

    this.updateScore(null, this.registry.get('score'));
    this.updateInstruments(null, this.registry.get('instruments'));
    this.updateSheetMusic(null, this.registry.get('sheetMusicCurrentLevel'));
  }

  updateLivesIcons(count) {
    // Clear existing icons
    this.livesIcons.forEach(icon => icon.destroy());
    this.livesIcons = [];

    for (let i = 0; i < count; i++) {
      const icon = this.add.image(20 + i * 28, 20, 'mozartHead')
        .setDisplaySize(22, 22)
        .setOrigin(0, 0);
      this.livesIcons.push(icon);
    }
  }

  updateLives(_, value) {
    this.updateLivesIcons(value);
  }

  updateScore(_, value) {
    this.scoreText.setText(`Score: ${value}`);
  }

  updateInstruments(_, value) {
    if (value.length === 0) {
      this.instrumentsText.setText('');
    } else {
      const icons = { violin: '🎻', flute: '🎵', piano: '🎹' };
      const text = value.map(i => icons[i] || '♫').join(' ');
      this.instrumentsText.setText(text);
    }
  }

  updateSheetMusic(_, value) {
    if (value) {
      this.sheetMusicText.setText(`📜 ${value.found}/${value.total}`);
    }
  }

  updateCombo(_, value) {
    if (value > 1) {
      const comboCount = this.registry.get('comboCount') || 0;
      this.comboText.setText(`x${value} COMBO! (${comboCount})`);

      // Color based on multiplier
      const colors = { 2: '#FF6600', 3: '#FF00FF', 4: '#00FFFF' };
      this.comboText.setFill(colors[value] || '#FF6600');

      this.comboContainer.setAlpha(1);

      // Pop animation
      this.tweens.killTweensOf(this.comboText);
      this.comboText.setScale(1.3);
      this.tweens.add({
        targets: this.comboText,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut'
      });
    } else {
      // Fade out combo display
      this.tweens.add({
        targets: this.comboContainer,
        alpha: 0,
        duration: 300
      });
    }
  }

  shutdown() {
    this.registry.events.off('changedata-lives', this.updateLives, this);
    this.registry.events.off('changedata-score', this.updateScore, this);
    this.registry.events.off('changedata-instruments', this.updateInstruments, this);
    this.registry.events.off('changedata-sheetMusicCurrentLevel', this.updateSheetMusic, this);
    this.registry.events.off('changedata-comboMultiplier', this.updateCombo, this);
  }
}
