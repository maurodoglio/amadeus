import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { drawConcertHallBackground, createInstrumentIcon, COLORS, drawOrnateFrame } from '../ui/UITheme.js';

export class ConcertScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ConcertScene' });
  }

  create() {
    drawConcertHallBackground(this, GAME_WIDTH, GAME_HEIGHT);
    this.createHallArchitecture();
    this.createStageLights();
    this.createCurtains();
    this.createChandeliers();
    this.createAudience();
    this.createStageShowcase();
    this.createFloatingNotes();
    this.createApplauseBursts();
    this.createTextBlock();

    if (this.sound.get('music_concert')) {
      this.sound.play('music_concert', { loop: true, volume: 0.3 });
    }
  }

  createHallArchitecture() {
    drawOrnateFrame(this, 20, 18, GAME_WIDTH - 40, GAME_HEIGHT - 36, COLORS.goldDark, 0.24);

    const hall = this.add.graphics();
    hall.fillStyle(0x120b18, 0.45);
    hall.fillRoundedRect(86, 56, GAME_WIDTH - 172, 196, 30);
    hall.fillStyle(0x0c0812, 0.52);
    hall.fillRect(0, GAME_HEIGHT - 136, GAME_WIDTH, 136);

    [140, 290, 510, 660].forEach(x => {
      hall.fillStyle(0x110c19, 0.7);
      hall.fillRoundedRect(x - 18, 34, 36, GAME_HEIGHT - 156, 12);
      hall.fillStyle(0x3b2744, 0.2);
      hall.fillRoundedRect(x - 6, 34, 12, GAME_HEIGHT - 156, 10);
    });

    hall.fillStyle(0x4a2b22, 0.92);
    hall.fillRect(0, GAME_HEIGHT - 112, GAME_WIDTH, 112);
    hall.fillStyle(0x603626, 0.86);
    hall.fillRect(80, GAME_HEIGHT - 168, GAME_WIDTH - 160, 78);
    hall.lineStyle(4, COLORS.goldDark, 0.8);
    hall.strokeRect(80, GAME_HEIGHT - 168, GAME_WIDTH - 160, 78);
    hall.lineStyle(3, COLORS.gold, 0.6);
    hall.beginPath();
    hall.moveTo(88, GAME_HEIGHT - 166);
    hall.lineTo(GAME_WIDTH - 88, GAME_HEIGHT - 166);
    hall.strokePath();
  }

  createStageLights() {
    const beams = [
      { x: 220, width: 210, alpha: 0.11 },
      { x: 400, width: 280, alpha: 0.16 },
      { x: 580, width: 210, alpha: 0.11 }
    ];

    beams.forEach((beam, index) => {
      const graphics = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      graphics.fillStyle(COLORS.goldLight, beam.alpha);
      graphics.beginPath();
      graphics.moveTo(beam.x - 24, 0);
      graphics.lineTo(beam.x + 24, 0);
      graphics.lineTo(beam.x + beam.width * 0.45, GAME_HEIGHT - 124);
      graphics.lineTo(beam.x - beam.width * 0.45, GAME_HEIGHT - 124);
      graphics.closePath();
      graphics.fillPath();
      graphics.setAlpha(0.2 + index * 0.05);

      this.tweens.add({
        targets: graphics,
        x: { from: -12 + index * 4, to: 12 - index * 4 },
        alpha: { from: 0.12 + index * 0.03, to: 0.28 + index * 0.05 },
        duration: 2800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createCurtains() {
    const curtains = this.add.graphics();
    const drawCurtain = (x, width, direction) => {
      curtains.fillStyle(COLORS.curtainRed, 0.96);
      curtains.fillRect(x, 0, width, GAME_HEIGHT);
      for (let i = 0; i < 6; i++) {
        curtains.fillStyle(COLORS.curtainRedLight, 0.22 + i * 0.02);
        curtains.fillRect(x + 10 + i * ((width - 20) / 6), 0, 10, GAME_HEIGHT);
      }
      curtains.fillStyle(COLORS.gold, 0.9);
      curtains.fillRect(direction < 0 ? x + width - 8 : x, 0, 8, GAME_HEIGHT);
    };

    drawCurtain(0, 78, -1);
    drawCurtain(GAME_WIDTH - 78, 78, 1);

    curtains.fillStyle(COLORS.curtainRed, 0.98);
    curtains.fillRect(0, 0, GAME_WIDTH, 46);
    curtains.fillStyle(COLORS.gold, 0.95);
    curtains.fillRect(0, 40, GAME_WIDTH, 6);
    for (let i = 0; i < GAME_WIDTH; i += 32) {
      curtains.fillStyle(COLORS.curtainRed, 1);
      curtains.fillTriangle(i, 46, i + 16, 62, i + 32, 46);
    }
  }

  createChandeliers() {
    [220, 400, 580].forEach((x, index) => {
      const chandelier = this.add.container(x, 52 + index * 4);
      const frame = this.add.graphics();
      frame.lineStyle(2, COLORS.gold, 0.9);
      frame.beginPath();
      frame.moveTo(0, -36);
      frame.lineTo(0, -8);
      frame.strokePath();
      frame.strokeCircle(0, 0, 18);
      frame.beginPath();
      frame.moveTo(-18, 0);
      frame.quadraticCurveTo(0, 20, 18, 0);
      frame.strokePath();
      [-12, 0, 12].forEach(offset => {
        frame.lineStyle(1.5, COLORS.goldLight, 0.8);
        frame.beginPath();
        frame.moveTo(offset, 8);
        frame.lineTo(offset, 20);
        frame.strokePath();
        frame.fillStyle(COLORS.white, 0.85);
        frame.fillCircle(offset, 24, 3);
      });
      chandelier.add(frame);
      chandelier.setAlpha(0.86);

      this.tweens.add({
        targets: chandelier,
        angle: 4,
        duration: 2600 + index * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createAudience() {
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 24; i++) {
        const x = 20 + i * 34 + (row % 2) * 10;
        const y = GAME_HEIGHT - 46 - row * 22;
        const head = this.add.circle(x, y, 11 - row * 1.5, 0x050507, 0.88 - row * 0.18);
        const body = this.add.ellipse(x, y + 14, 26 - row * 3, 22 - row * 2, 0x09090d, 0.82 - row * 0.18);
        head.setDepth(40 + row);
        body.setDepth(39 + row);
      }
    }
  }

  createStageShowcase() {
    const stageGlow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 170, 420, 140, COLORS.goldLight, 0.06)
      .setBlendMode(Phaser.BlendModes.ADD);
    stageGlow.setDepth(5);

    if (this.textures.exists('mozart')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 188, 'mozart').setScale(3.2).setDepth(12);
    } else {
      const silhouette = this.add.graphics();
      silhouette.fillStyle(0x0b0c12, 0.95);
      silhouette.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT - 232, 94, 110);
      silhouette.fillCircle(GAME_WIDTH / 2 - 34, GAME_HEIGHT - 220, 16);
      silhouette.fillCircle(GAME_WIDTH / 2 + 34, GAME_HEIGHT - 220, 16);
      silhouette.fillRoundedRect(GAME_WIDTH / 2 - 20, GAME_HEIGHT - 198, 40, 84, 10);
      silhouette.fillTriangle(GAME_WIDTH / 2 - 66, GAME_HEIGHT - 116, GAME_WIDTH / 2, GAME_HEIGHT - 46, GAME_WIDTH / 2 + 66, GAME_HEIGHT - 116);
      silhouette.setDepth(12);
    }

    const instruments = this.registry.get('instruments') || ['violin', 'flute', 'piano'];
    const spacing = 118;
    const startX = GAME_WIDTH / 2 - ((instruments.length - 1) * spacing) / 2;

    instruments.forEach((instrument, index) => {
      const pedestal = this.add.graphics();
      const x = startX + index * spacing;
      pedestal.fillStyle(0x5b3929, 0.92);
      pedestal.fillRoundedRect(x - 28, GAME_HEIGHT - 146, 56, 16, 6);
      pedestal.lineStyle(2, COLORS.goldDark, 0.8);
      pedestal.strokeRoundedRect(x - 28, GAME_HEIGHT - 146, 56, 16, 6);
      pedestal.setDepth(11);
      const icon = createInstrumentIcon(this, x, GAME_HEIGHT - 170, instrument, COLORS.goldLight, 0.85);
      icon.setDepth(12);
      icon.setAlpha(0.95);
    });
  }

  createFloatingNotes() {
    for (let i = 0; i < 12; i++) {
      const note = this.add.text(
        Phaser.Math.Between(100, GAME_WIDTH - 100),
        Phaser.Math.Between(90, GAME_HEIGHT - 170),
        Phaser.Math.RND.pick(['♪', '♫', '♬']),
        {
          fontFamily: 'Georgia, serif',
          fontSize: `${Phaser.Math.Between(16, 30)}px`,
          color: '#FFD966'
        }
      ).setAlpha(0.15).setDepth(30);

      this.tweens.add({
        targets: note,
        y: note.y - Phaser.Math.Between(24, 56),
        alpha: { from: 0.12, to: 0.48 },
        duration: Phaser.Math.Between(2200, 4200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createApplauseBursts() {
    const launchBurst = () => {
      const x = Phaser.Math.Between(120, GAME_WIDTH - 120);
      const y = Phaser.Math.Between(GAME_HEIGHT - 160, GAME_HEIGHT - 120);
      for (let i = 0; i < 8; i++) {
        const particle = this.add.text(x, y, Phaser.Math.RND.pick(['✦', '✧', '⋆']), {
          fontFamily: 'Georgia, serif',
          fontSize: `${Phaser.Math.Between(10, 16)}px`,
          color: Phaser.Math.RND.pick(['#FFEAA0', '#FFF7DA', '#FFD966'])
        }).setOrigin(0.5).setAlpha(0.8).setDepth(45).setBlendMode(Phaser.BlendModes.ADD);
        const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
        const distance = Phaser.Math.Between(18, 48);
        this.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          duration: 700,
          ease: 'Quad.easeOut',
          onComplete: () => particle.destroy()
        });
      }
    };

    this.time.addEvent({ delay: 700, callback: launchBurst, callbackScope: this, loop: true });
  }

  createTextBlock() {
    const congratsText = this.add.text(GAME_WIDTH / 2, 98, 'THE GRAND CONCERT', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#FFE59A',
      stroke: '#7B5111',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 6, color: '#000000', blur: 12, fill: true }
    }).setOrigin(0.5).setAlpha(0).setDepth(40);

    const score = this.registry.get('score') || 0;
    const scoreText = this.add.text(GAME_WIDTH / 2, 145, `Final Score: ${score.toLocaleString()}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '21px',
      color: '#FFF7DD'
    }).setOrigin(0.5).setAlpha(0).setDepth(40);

    const endText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 66, 'Mozart became the most celebrated composer in Europe.', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#D9C58A'
    }).setOrigin(0.5).setAlpha(0).setDepth(40);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 38, 'Press SPACE or ENTER to begin the journey anew', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#AA9B73'
    }).setOrigin(0.5).setAlpha(0).setDepth(40);

    this.tweens.add({ targets: congratsText, alpha: 1, duration: 1000, delay: 400 });
    this.tweens.add({ targets: scoreText, alpha: 1, duration: 900, delay: 1200 });
    this.tweens.add({ targets: endText, alpha: 1, duration: 900, delay: 2400 });
    this.tweens.add({ targets: restartText, alpha: 1, duration: 900, delay: 3200 });

    this.time.delayedCall(3200, () => {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.stopAll();
        this.scene.start('MenuScene');
      });
      this.input.keyboard.once('keydown-ENTER', () => {
        this.sound.stopAll();
        this.scene.start('MenuScene');
      });
    });
  }
}
