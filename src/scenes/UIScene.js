import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Lives display
    this.livesText = this.add.text(16, 16, '', {
      font: '16px monospace',
      fill: '#FFFFFF'
    });

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

    // Listen for registry changes
    this.registry.events.on('changedata-lives', this.updateLives, this);
    this.registry.events.on('changedata-score', this.updateScore, this);
    this.registry.events.on('changedata-instruments', this.updateInstruments, this);

    this.updateLives(null, this.registry.get('lives'));
    this.updateScore(null, this.registry.get('score'));
    this.updateInstruments(null, this.registry.get('instruments'));
  }

  updateLives(_, value) {
    let hearts = '';
    for (let i = 0; i < value; i++) hearts += '♥ ';
    this.livesText.setText(hearts);
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

  shutdown() {
    this.registry.events.off('changedata-lives', this.updateLives, this);
    this.registry.events.off('changedata-score', this.updateScore, this);
    this.registry.events.off('changedata-instruments', this.updateInstruments, this);
  }
}
