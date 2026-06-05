import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { drawParchmentBackground, drawStaffDivider, drawTrebleClef, createButton, COLORS, FONTS } from '../ui/UITheme.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Parchment-textured background
    drawParchmentBackground(this, GAME_WIDTH, GAME_HEIGHT);

    // Treble clef ornaments on sides
    drawTrebleClef(this, 60, 50, 1.8);
    drawTrebleClef(this, GAME_WIDTH - 80, 50, 1.8);

    // Title with gold heading
    this.add.text(GAME_WIDTH / 2, 55, 'AMADEUS', {
      fontFamily: 'Georgia, serif',
      fontSize: '52px',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 105, "Mozart's Musical Quest", {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#4A3728',
    }).setOrigin(0.5);

    // Musical staff divider
    drawStaffDivider(this, GAME_WIDTH / 2 - 120, 128, 240);

    // Mozart sprite
    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2 - 30, 180, 'mozart').setScale(2.5);
    }

    // Nannerl sprite
    if (this.textures.exists('nannerl')) {
      this.add.image(GAME_WIDTH / 2 + 30, 180, 'nannerl').setScale(2.5);
    }

    // High Scores section
    drawStaffDivider(this, GAME_WIDTH / 2 - 120, 218, 240);

    this.add.text(GAME_WIDTH / 2, 240, '— HIGH SCORES —', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#B8860B',
    }).setOrigin(0.5);

    const levelNames = ['Vienna Streets', 'Enchanted Forest', 'Royal Palace'];
    let yPos = 262;

    for (let level = 1; level <= 3; level++) {
      const scores = ScoreManager.getHighScores(level);
      const bestScore = scores.length > 0 ? scores[0].score : '---';
      const grade = scores.length > 0 ? ScoreManager.getGrade(level, scores[0].score) : '-';
      const gradeColor = scores.length > 0 ? ScoreManager.getGradeColor(grade) : '#808080';

      this.add.text(GAME_WIDTH / 2 - 160, yPos, `${level}. ${levelNames[level - 1]}`, {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#4A3728'
      });

      this.add.text(GAME_WIDTH / 2 + 80, yPos, `${bestScore}`, {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: '#2B1810'
      });

      this.add.text(GAME_WIDTH / 2 + 150, yPos, `[${grade}]`, {
        fontFamily: 'Georgia, serif', fontSize: '12px', color: gradeColor
      });

      yPos += 22;
    }

    // Menu buttons (ornate style)
    this.selectedOption = 0;
    this.menuOptions = [];

    const btn1P = createButton(this, GAME_WIDTH / 2, 355, '♩  1 Player  ♩', () => this.startGame(false));
    this.menuOptions.push(btn1P);

    const btn2P = createButton(this, GAME_WIDTH / 2, 400, '♩  2 Players  ♩', () => this.startGame(true));
    this.menuOptions.push(btn2P);

    // Selection indicator (gold treble clef)
    this.selector = this.add.text(GAME_WIDTH / 2 - 110, 355, '𝄞', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Accessibility button
    createButton(this, GAME_WIDTH / 2, 440, 'Accessibility', () => {
      this.scene.sleep();
      this.scene.launch('AccessibilityScene', { returnScene: 'MenuScene' });
    }, 160);

    // Fullscreen button
    createButton(this, GAME_WIDTH - 80, GAME_HEIGHT - 24, '⛶ Fullscreen', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    }, 140);

    // Controls help
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Arrow Keys / ENTER to select  |  Touch D-pad to move', {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#808080'
    }).setOrigin(0.5);

    // Blinking effect on selector
    this.tweens.add({
      targets: this.selector,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Input
    this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-W', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-S', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());

    // Play menu music - Mozart medley
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('menu');
  }

  changeSelection(dir) {
    this.selectedOption = (this.selectedOption + dir + this.menuOptions.length) % this.menuOptions.length;
    const targetY = this.selectedOption === 0 ? 355 : 400;
    this.selector.setY(targetY);
  }

  confirmSelection() {
    const coopMode = this.selectedOption === 1;
    this.startGame(coopMode);
  }

  startGame(coopMode) {
    // Stop menu music
    this.sound.stopAll();
    if (this.mozartSoundtrack) {
      this.mozartSoundtrack.stop();
    }

    // Reset game state
    this.registry.set('lives', coopMode ? 5 : 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', coopMode);
    this.registry.set('comboMultiplier', 1);
    this.registry.set('comboCount', 0);
    if (!this.registry.get('completedLevels')) {
      this.registry.set('completedLevels', []);
    }

    this.scene.start('MapScene', { completedLevel: 0 });
    this.scene.launch('TouchControls');
  }
}
