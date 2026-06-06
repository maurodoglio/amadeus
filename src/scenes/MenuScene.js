import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { MozartSoundtracks } from '../utils/MozartSoundtracks.js';
import { drawConcertHallBackground, drawOrnateFrame, graphicsQuadCurve, COLORS } from '../ui/UITheme.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.sound.stopAll();

    drawConcertHallBackground(this, GAME_WIDTH, GAME_HEIGHT);
    this.createBackdropDepth();
    this.createSpotlightBeams();
    this.createGoldenDust();
    this.createFloatingNotes();
    this.createMozartSilhouette();
    this.createTitleBlock();
    this.createMenuButtons();
    this.createUtilityButtons();
    this.createFooter();

    this.input.keyboard?.on('keydown-UP', () => this.changeSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.changeSelection(1));
    this.input.keyboard?.on('keydown-W', () => this.changeSelection(-1));
    this.input.keyboard?.on('keydown-S', () => this.changeSelection(1));
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.mozartSoundtrack = new MozartSoundtracks(this);
    this.mozartSoundtrack.play('menu');
  }

  createBackdropDepth() {
    drawOrnateFrame(this, 14, 14, GAME_WIDTH - 28, GAME_HEIGHT - 28, COLORS.gold, 0.24);

    const hall = this.add.graphics();
    hall.fillStyle(0x0c0b17, 0.4);
    hall.fillRoundedRect(54, 42, GAME_WIDTH - 108, GAME_HEIGHT - 144, 32);
    hall.fillStyle(0x1c122f, 0.35);
    hall.fillRoundedRect(96, 72, GAME_WIDTH - 192, GAME_HEIGHT - 206, 28);

    hall.fillStyle(0x201430, 0.5);
    hall.fillRect(0, GAME_HEIGHT - 95, GAME_WIDTH, 95);
    hall.fillStyle(0x2e1b38, 0.55);
    hall.fillRect(0, GAME_HEIGHT - 72, GAME_WIDTH, 72);
    hall.lineStyle(3, COLORS.goldDark, 0.45);
    hall.beginPath();
    hall.moveTo(0, GAME_HEIGHT - 92);
    graphicsQuadCurve(hall, 0, GAME_HEIGHT - 92, GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH, GAME_HEIGHT - 92);
    hall.strokePath();

    const columns = this.add.graphics();
    [70, 160, GAME_WIDTH - 160, GAME_WIDTH - 70].forEach(x => {
      columns.fillStyle(0x130d1f, 0.65);
      columns.fillRoundedRect(x - 16, 26, 32, GAME_HEIGHT - 110, 10);
      columns.fillStyle(0x4a2f56, 0.22);
      columns.fillRoundedRect(x - 5, 26, 10, GAME_HEIGHT - 110, 8);
    });

    for (let i = 0; i < 3; i++) {
      const arch = this.add.graphics();
      const archWidth = 170 + i * 30;
      arch.lineStyle(2, COLORS.goldDark, 0.18 + i * 0.06);
      arch.strokeRoundedRect(GAME_WIDTH / 2 - archWidth / 2, 86 + i * 18, archWidth, 150 + i * 22, 26);
    }
  }

  createSpotlightBeams() {
    const beams = [
      { x: GAME_WIDTH * 0.28, width: 180, alpha: 0.11, sway: 12 },
      { x: GAME_WIDTH * 0.5, width: 250, alpha: 0.16, sway: 18 },
      { x: GAME_WIDTH * 0.72, width: 180, alpha: 0.11, sway: 12 }
    ];

    beams.forEach((beam, index) => {
      const graphics = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      graphics.fillStyle(COLORS.goldLight, beam.alpha);
      graphics.beginPath();
      graphics.moveTo(beam.x - beam.width * 0.1, 0);
      graphics.lineTo(beam.x + beam.width * 0.1, 0);
      graphics.lineTo(beam.x + beam.width * 0.5, GAME_HEIGHT * 0.72);
      graphics.lineTo(beam.x - beam.width * 0.5, GAME_HEIGHT * 0.72);
      graphics.closePath();
      graphics.fillPath();
      graphics.setAlpha(0.22 + index * 0.08);

      this.tweens.add({
        targets: graphics,
        x: { from: -beam.sway, to: beam.sway },
        alpha: { from: 0.16 + index * 0.03, to: 0.28 + index * 0.05 },
        duration: 2600 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createGoldenDust() {
    for (let i = 0; i < 28; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(40, GAME_WIDTH - 40),
        Phaser.Math.Between(30, GAME_HEIGHT - 50),
        Phaser.Math.FloatBetween(1.4, 3.1),
        Phaser.Math.RND.pick([COLORS.gold, COLORS.goldLight, COLORS.white]),
        Phaser.Math.FloatBetween(0.12, 0.35)
      ).setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-26, 26),
        y: particle.y - Phaser.Math.Between(20, 70),
        alpha: { from: particle.alpha, to: Phaser.Math.FloatBetween(0.02, 0.1) },
        scale: { from: 0.8, to: Phaser.Math.FloatBetween(1.2, 1.6) },
        duration: Phaser.Math.Between(2800, 5600),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1600),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createFloatingNotes() {
    const noteChars = ['♪', '♫', '♬', '♩'];
    for (let i = 0; i < 9; i++) {
      const note = this.add.text(
        Phaser.Math.Between(70, GAME_WIDTH - 70),
        Phaser.Math.Between(70, GAME_HEIGHT - 90),
        Phaser.Math.RND.pick(noteChars),
        {
          fontFamily: 'Georgia, serif',
          fontSize: `${Phaser.Math.Between(14, 28)}px`,
          color: '#FFE9A3'
        }
      ).setOrigin(0.5).setAlpha(Phaser.Math.FloatBetween(0.07, 0.2));

      this.tweens.add({
        targets: note,
        y: note.y - Phaser.Math.Between(18, 48),
        x: note.x + Phaser.Math.Between(-14, 14),
        alpha: { from: note.alpha, to: note.alpha * 0.35 },
        angle: Phaser.Math.Between(-10, 10),
        duration: Phaser.Math.Between(3500, 6000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2200),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createMozartSilhouette() {
    const container = this.add.container(GAME_WIDTH / 2 + 120, 255).setAlpha(0.42);

    const glow = this.add.ellipse(0, 25, 250, 280, COLORS.gold, 0.07)
      .setBlendMode(Phaser.BlendModes.ADD);
    container.add(glow);

    const body = this.add.graphics();
    body.fillStyle(0x04050b, 0.95);
    body.beginPath();
    body.moveTo(-58, 78);
    graphicsQuadCurve(body, -58, 78, -78, -4, -18, -44);
    body.lineTo(18, -44);
    graphicsQuadCurve(body, 18, -44, 82, -2, 60, 78);
    body.lineTo(26, 112);
    body.lineTo(-26, 112);
    body.closePath();
    body.fillPath();
    body.fillStyle(0x181523, 0.82);
    body.fillEllipse(0, -78, 86, 94);
    body.fillEllipse(-33, -70, 24, 48);
    body.fillEllipse(33, -70, 24, 48);
    body.fillRect(-11, -42, 22, 96);
    container.add(body);

    const rim = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    rim.lineStyle(2, COLORS.goldLight, 0.38);
    rim.strokeEllipse(0, -78, 88, 96);
    rim.beginPath();
    rim.moveTo(-18, -44);
    rim.lineTo(-56, 80);
    rim.lineTo(-26, 112);
    rim.strokePath();
    rim.beginPath();
    rim.moveTo(18, -44);
    rim.lineTo(56, 80);
    rim.lineTo(26, 112);
    rim.strokePath();
    container.add(rim);

    this.tweens.add({
      targets: container,
      y: container.y - 6,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createTitleBlock() {
    const crest = this.add.graphics();
    crest.fillStyle(COLORS.navyBlue, 0.55);
    crest.fillRoundedRect(GAME_WIDTH / 2 - 180, 28, 360, 96, 20);
    crest.lineStyle(2, COLORS.goldDark, 0.5);
    crest.strokeRoundedRect(GAME_WIDTH / 2 - 180, 28, 360, 96, 20);

    const title = this.add.text(GAME_WIDTH / 2, 60, 'AMADEUS', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '58px',
      fontStyle: 'bold',
      color: '#FFE7A5',
      stroke: '#7C5313',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 6, color: '#000000', blur: 10, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      alpha: { from: 0.92, to: 1 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(GAME_WIDTH / 2, 104, "Mozart's Musical Quest", {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '18px',
      fontStyle: 'italic',
      color: '#DFC07B'
    }).setOrigin(0.5);

    this.drawElegantDivider(GAME_WIDTH / 2, 136, 220);
  }

  drawElegantDivider(x, y, width) {
    const g = this.add.graphics();
    g.lineStyle(1.5, COLORS.goldDark, 0.65);
    g.beginPath();
    g.moveTo(x - width / 2, y);
    g.lineTo(x + width / 2, y);
    g.strokePath();
    g.fillStyle(COLORS.gold, 0.9);
    g.fillCircle(x, y, 4);
    g.fillStyle(COLORS.goldLight, 0.7);
    g.fillCircle(x - width / 2 + 6, y, 2.5);
    g.fillCircle(x + width / 2 - 6, y, 2.5);
  }

  createMenuButtons() {
    this.selectedOption = 0;
    this.menuOptions = [];

    const buttonData = [
      { text: '1 Player', action: () => this.startGame(false) },
      { text: '2 Players', action: () => this.startGame(true) },
      { text: 'High Scores', action: () => this.scene.start('HighScoresScene') }
    ];

    buttonData.forEach((config, index) => {
      const button = this.createCrystalButton(GAME_WIDTH / 2 - 70, 230 + index * 58, config.text, config.action);
      button.container.setAlpha(0).setY(button.y + 24);
      this.tweens.add({
        targets: button.container,
        alpha: 1,
        y: button.y,
        duration: 360,
        delay: 180 + index * 120,
        ease: 'Back.easeOut'
      });
      this.menuOptions.push(button);
    });

    this.selector = this.add.text(GAME_WIDTH / 2 - 210, this.menuOptions[0].y, '✦', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#FFE9A3'
    }).setOrigin(0.5).setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: this.selector,
      x: this.selector.x + 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.updateSelectedButton();
  }

  createCrystalButton(x, y, text, onClick) {
    const container = this.add.container(x, y);
    const width = 250;
    const height = 46;
    const hw = width / 2;
    const hh = height / 2;
    const shadow = this.add.graphics();
    const glow = this.add.graphics();
    const bg = this.add.graphics();
    const shine = this.add.graphics();
    const accent = this.add.text(-92, 0, '❖', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#FFD86B'
    }).setOrigin(0.5);
    const label = this.add.text(10, 0, text, {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#F7E9C6'
    }).setOrigin(0.5);

    const redraw = (active = false) => {
      shadow.clear();
      glow.clear();
      bg.clear();
      shine.clear();

      shadow.fillStyle(COLORS.black, 0.32);
      shadow.fillRoundedRect(-hw + 4, -hh + 6, width, height, 16);

      if (active) {
        glow.lineStyle(10, COLORS.gold, 0.18);
        glow.strokeRoundedRect(-hw - 2, -hh - 2, width + 4, height + 4, 18);
      }

      bg.fillStyle(COLORS.navyBlue, active ? 0.84 : 0.68);
      bg.fillRoundedRect(-hw, -hh, width, height, 16);
      bg.fillStyle(COLORS.white, active ? 0.14 : 0.08);
      bg.fillRoundedRect(-hw + 3, -hh + 3, width - 6, height * 0.48, 12);
      bg.lineStyle(2, active ? COLORS.gold : COLORS.parchmentEdge, active ? 0.95 : 0.72);
      bg.strokeRoundedRect(-hw, -hh, width, height, 16);
      bg.lineStyle(1, COLORS.white, active ? 0.24 : 0.14);
      bg.strokeRoundedRect(-hw + 5, -hh + 5, width - 10, height - 10, 12);

      shine.fillStyle(COLORS.goldLight, active ? 0.16 : 0.07);
      shine.fillRoundedRect(-hw + 16, -hh + 7, width * 0.42, 5, 3);
      accent.setAlpha(active ? 1 : 0.65);
      label.setColor(active ? '#FFF7DD' : '#F7E9C6');
    };

    redraw(false);
    container.add([shadow, glow, bg, shine, accent, label]);

    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      const index = this.menuOptions.findIndex(option => option === button);
      if (index !== -1) {
        this.selectedOption = index;
        this.updateSelectedButton();
      }
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 80,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => onClick()
      });
    });
    container.add(hitArea);

    const button = {
      container,
      y,
      activate: onClick,
      setSelected: (selected) => {
        redraw(selected);
        this.tweens.add({
          targets: container,
          scaleX: selected ? 1.02 : 1,
          scaleY: selected ? 1.02 : 1,
          duration: 120,
          ease: 'Sine.easeOut'
        });
      }
    };

    return button;
  }

  createUtilityButtons() {
    this.createSmallButton(GAME_WIDTH / 2 - 90, 415, 'Accessibility', () => {
      this.scene.sleep();
      this.scene.launch('AccessibilityScene', { returnScene: 'MenuScene' });
    });
    this.createSmallButton(GAME_WIDTH / 2 + 90, 415, '⛶ Fullscreen', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }

  createSmallButton(x, y, text, onClick) {
    const container = this.add.container(x, y);
    const width = text.length * 7 + 34;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.navyBlue, 0.5);
    bg.fillRoundedRect(-width / 2, -13, width, 26, 12);
    bg.lineStyle(1, COLORS.parchmentEdge, 0.35);
    bg.strokeRoundedRect(-width / 2, -13, width, 26, 12);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#C6B58E'
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(0, 0, width, 26, 0x000000, 0).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.navyBlue, 0.72);
      bg.fillRoundedRect(-width / 2, -13, width, 26, 12);
      bg.lineStyle(1.5, COLORS.gold, 0.55);
      bg.strokeRoundedRect(-width / 2, -13, width, 26, 12);
      label.setColor('#F6E8C6');
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.navyBlue, 0.5);
      bg.fillRoundedRect(-width / 2, -13, width, 26, 12);
      bg.lineStyle(1, COLORS.parchmentEdge, 0.35);
      bg.strokeRoundedRect(-width / 2, -13, width, 26, 12);
      label.setColor('#C6B58E');
    });
    hitArea.on('pointerdown', onClick);
    container.add([bg, label, hitArea]);
    return container;
  }

  createFooter() {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, 'Arrow Keys / ENTER to select  •  Touch and click to navigate', {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#8E7B57'
    }).setOrigin(0.5);
  }

  updateSelectedButton() {
    this.menuOptions.forEach((button, index) => button.setSelected(index === this.selectedOption));
    const target = this.menuOptions[this.selectedOption];
    this.tweens.add({
      targets: this.selector,
      y: target.y,
      duration: 120,
      ease: 'Sine.easeOut'
    });
  }

  changeSelection(dir) {
    this.selectedOption = (this.selectedOption + dir + this.menuOptions.length) % this.menuOptions.length;
    this.updateSelectedButton();
    SFXGenerator.play(this, 'sfx_menuHover', 0.2);
  }

  confirmSelection() {
    SFXGenerator.play(this, 'sfx_menuSelect', 0.3);
    this.menuOptions[this.selectedOption].activate();
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

    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.start('MapScene', { completedLevel: 0 });
      this.scene.launch('TouchControls');
    });
  }
}
