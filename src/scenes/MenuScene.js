import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { drawConcertHallBackground } from '../ui/UITheme.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Stop any lingering audio from previous scenes
    this.sound.stopAll();

    drawConcertHallBackground(this, GAME_WIDTH, GAME_HEIGHT);
    this.createFloatingNotes();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 70, 'AMADEUS', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '56px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title, alpha: { from: 0.85, to: 1 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(GAME_WIDTH / 2, 118, "Mozart's Musical Quest", {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '18px', color: '#C9A84C', fontStyle: 'italic',
    }).setOrigin(0.5);

    this.drawElegantDivider(GAME_WIDTH / 2, 148, 200);
    this.drawPianoSilhouette(GAME_WIDTH / 2, 180, 260);

    // Menu buttons
    this.selectedOption = 0;
    this.menuOptions = [];

    this.menuOptions.push(this.createElegantButton(GAME_WIDTH / 2, 240, '1 Player', () => this.startGame(false)));
    this.menuOptions.push(this.createElegantButton(GAME_WIDTH / 2, 290, '2 Players', () => this.startGame(true)));
    this.menuOptions.push(this.createElegantButton(GAME_WIDTH / 2, 340, 'High Scores', () => this.scene.start('HighScoresScene')));

    // Selection indicator
    this.selector = this.add.text(GAME_WIDTH / 2 - 100, 240, '\u25B8', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#FFD700',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.selector, x: this.selector.x + 4,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Utility buttons
    this.createSmallButton(GAME_WIDTH / 2 - 60, 400, 'Accessibility', () => {
      this.scene.sleep();
      this.scene.launch('AccessibilityScene', { returnScene: 'MenuScene' });
    });
    this.createSmallButton(GAME_WIDTH / 2 + 60, 400, '\u26F6 Fullscreen', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'Arrow Keys / ENTER to select  |  Touch to navigate', {
      fontFamily: 'Georgia, serif', fontSize: '10px', color: '#555555'
    }).setOrigin(0.5);

    // Input
    this.input.keyboard.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-W', () => this.changeSelection(-1));
    this.input.keyboard.on('keydown-S', () => this.changeSelection(1));
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());

    // Menu music
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('menu');
  }

  createFloatingNotes() {
    const noteChars = ['\u2669', '\u266A', '\u266B', '\u266C'];
    for (let i = 0; i < 8; i++) {
      const note = this.add.text(
        Phaser.Math.Between(50, GAME_WIDTH - 50),
        Phaser.Math.Between(50, GAME_HEIGHT - 50),
        Phaser.Math.RND.pick(noteChars),
        { fontFamily: 'Georgia, serif', fontSize: Phaser.Math.Between(14, 24) + 'px', color: '#FFD700' }
      ).setOrigin(0.5).setAlpha(Phaser.Math.FloatBetween(0.05, 0.15));

      this.tweens.add({
        targets: note,
        y: note.y - Phaser.Math.Between(20, 60),
        alpha: { from: note.alpha, to: note.alpha * 0.3 },
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  drawElegantDivider(x, y, width) {
    const g = this.add.graphics();
    g.lineStyle(1, 0xC9A84C, 0.6);
    g.beginPath(); g.moveTo(x - width / 2, y); g.lineTo(x + width / 2, y); g.strokePath();
    g.fillStyle(0xFFD700, 0.7); g.fillRect(x - 3, y - 3, 6, 6);
    g.fillStyle(0xC9A84C, 0.5);
    g.fillCircle(x - width / 2, y, 2); g.fillCircle(x + width / 2, y, 2);
  }

  drawPianoSilhouette(x, y, width) {
    const g = this.add.graphics();
    const keyW = width / 14;
    const sx = x - width / 2;
    g.lineStyle(1, 0x333340, 0.3);
    for (let i = 0; i < 14; i++) g.strokeRect(sx + i * keyW, y - 15, keyW - 1, 30);
    g.fillStyle(0x1a1a2e, 0.8);
    [1,2,4,5,6,8,9,11,12,13].forEach(k => {
      if (k < 14) g.fillRect(sx + k * keyW - keyW * 0.3, y - 15, keyW * 0.6, 18);
    });
  }

  createElegantButton(x, y, text, onClick) {
    const container = this.add.container(x, y);
    const w = 180, h = 38, hw = w / 2, hh = h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1428, 0.85); bg.fillRoundedRect(-hw, -hh, w, h, 4);
    bg.lineStyle(1.5, 0xC9A84C, 0.7); bg.strokeRoundedRect(-hw, -hh, w, h, 4);
    container.add(bg);

    const label = this.add.text(0, 0, text, {
      fontFamily: '"Playfair Display", Georgia, serif', fontSize: '17px', color: '#E8D8A0',
    }).setOrigin(0.5);
    container.add(label);

    const hitArea = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      bg.clear(); bg.fillStyle(0x2a2040, 0.95); bg.fillRoundedRect(-hw, -hh, w, h, 4);
      bg.lineStyle(2, 0xFFD700, 0.9); bg.strokeRoundedRect(-hw, -hh, w, h, 4);
      label.setColor('#FFD700');
      this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 });
    });
    hitArea.on('pointerout', () => {
      bg.clear(); bg.fillStyle(0x1a1428, 0.85); bg.fillRoundedRect(-hw, -hh, w, h, 4);
      bg.lineStyle(1.5, 0xC9A84C, 0.7); bg.strokeRoundedRect(-hw, -hh, w, h, 4);
      label.setColor('#E8D8A0');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true,
        onComplete: () => { if (onClick) onClick(); }
      });
    });
    return container;
  }

  createSmallButton(x, y, text, onClick) {
    const btn = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: '#777777',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#C9A84C'));
    btn.on('pointerout', () => btn.setColor('#777777'));
    btn.on('pointerdown', () => { if (onClick) onClick(); });
    return btn;
  }

  changeSelection(dir) {
    this.selectedOption = (this.selectedOption + dir + this.menuOptions.length) % this.menuOptions.length;
    this.selector.setY(this.menuOptions[this.selectedOption].y);
    SFXGenerator.play(this, 'sfx_menuHover', 0.2);
  }

  confirmSelection() {
    SFXGenerator.play(this, 'sfx_menuSelect', 0.3);
    if (this.selectedOption === 0) this.startGame(false);
    else if (this.selectedOption === 1) this.startGame(true);
    else if (this.selectedOption === 2) this.scene.start('HighScoresScene');
  }

  startGame(coopMode) {
    this.sound.stopAll();
    if (this.mozartSoundtrack) this.mozartSoundtrack.stop();

    this.registry.set('lives', coopMode ? 5 : 3);
    this.registry.set('score', 0);
    this.registry.set('instruments', []);
    this.registry.set('currentLevel', 1);
    this.registry.set('coopMode', coopMode);
    this.registry.set('comboMultiplier', 1);
    this.registry.set('comboCount', 0);
    if (!this.registry.get('completedLevels')) this.registry.set('completedLevels', []);

    this.scene.start('MapScene', { completedLevel: 0 });
    this.scene.launch('TouchControls');
  }
}
