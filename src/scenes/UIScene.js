import Phaser from 'phaser';
import { drawMusicNote, COLORS, FONTS } from '../ui/UITheme.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const cam = this.cameras.main;

    // Lives display - golden music notes (full=gold, empty=grey)
    this.livesIcons = [];
    this.maxLives = this.registry.get('coopMode') ? 5 : 3;
    this.updateLivesIcons(this.registry.get('lives'));

    // Treble clef icon before score
    this.scoreClef = this.add.text(cam.width - 130, 12, '𝄞', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#FFD700',
    });

    // Score display with elegant font
    this.scoreText = this.add.text(cam.width - 16, 14, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);

    // Instruments collection icons (top-right area)
    this.instrumentsContainer = this.add.container(cam.width - 16, 38);
    this.instrumentIcons = [];

    // Sheet music pages counter
    this.sheetMusicText = this.add.text(cam.width - 16, 56, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#F5DEB3',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(1, 0);

    // Co-op indicator
    const coopMode = this.registry.get('coopMode');
    if (coopMode) {
      this.coopText = this.add.text(16, cam.height - 24, 'P1: Arrows+SPACE  P2: WASD+E', {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#808080',
      });
    }

    // Combo display with swoosh animation
    this.comboContainer = this.add.container(cam.width / 2, 50);
    this.comboText = this.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      fontStyle: 'bold italic',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.comboContainer.add(this.comboText);
    this.comboContainer.setAlpha(0);

    // Listen for resize events
    this.scale.on('resize', this.handleResize, this);

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

    for (let i = 0; i < this.maxLives; i++) {
      const filled = i < count;
      const icon = drawMusicNote(this, 22 + i * 28, 20, filled);
      this.livesIcons.push(icon);
    }
  }

  updateLives(_, value) {
    this.updateLivesIcons(value);
  }

  updateScore(_, value) {
    this.scoreText.setText(`${value}`);
  }

  updateInstruments(_, value) {
    // Clear previous icons
    this.instrumentIcons.forEach(icon => icon.destroy());
    this.instrumentIcons = [];

    if (value && value.length > 0) {
      const instrumentSymbols = {
        violin: '🎻', flute: '🎵', piano: '🎹',
        harpsichord: '🎹', trumpet: '🎺', drums: '🥁', harp: '🎶'
      };
      value.forEach((inst, i) => {
        const icon = this.add.text(-i * 26, 0, instrumentSymbols[inst] || '♫', {
          fontSize: '18px',
        }).setOrigin(1, 0);
        this.instrumentsContainer.add(icon);
        this.instrumentIcons.push(icon);
      });
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
      this.comboText.setText(`♫ x${value} COMBO! (${comboCount}) ♫`);

      // Color based on multiplier
      const colors = { 2: '#FFD700', 3: '#FF6600', 4: '#FF00FF' };
      this.comboText.setColor(colors[value] || '#FFD700');

      this.comboContainer.setAlpha(1);

      // Swoosh animation: slide in from side + scale pop
      this.tweens.killTweensOf(this.comboContainer);
      this.comboContainer.setX(this.cameras.main.width / 2 - 60);
      this.comboContainer.setScale(0.5);

      this.tweens.add({
        targets: this.comboContainer,
        x: this.cameras.main.width / 2,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: this.comboContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
          });
        }
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

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.scoreText.setPosition(width - 16, 14);
    this.scoreClef.setPosition(width - 130, 12);
    this.instrumentsContainer.setPosition(width - 16, 38);
    this.sheetMusicText.setPosition(width - 16, 56);
    this.comboContainer.setPosition(width / 2, 50);

    if (this.coopText) {
      this.coopText.setPosition(16, height - 24);
    }
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.registry.events.off('changedata-lives', this.updateLives, this);
    this.registry.events.off('changedata-score', this.updateScore, this);
    this.registry.events.off('changedata-instruments', this.updateInstruments, this);
    this.registry.events.off('changedata-sheetMusicCurrentLevel', this.updateSheetMusic, this);
    this.registry.events.off('changedata-comboMultiplier', this.updateCombo, this);
  }
}
