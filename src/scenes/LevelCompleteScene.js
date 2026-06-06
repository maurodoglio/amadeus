import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import {
  drawParchmentBackground,
  createGoldConfetti,
  drawStaffDivider,
  drawTrebleClef,
  COLORS,
  drawOrnateFrame,
  createInstrumentIcon
} from '../ui/UITheme.js';

const LEVEL_INSTRUMENTS = {
  1: 'violin',
  2: 'flute',
  3: 'piano',
  4: 'harpsichord',
  5: 'trumpet',
  6: 'drums',
  7: 'harp'
};

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data) {
    this.levelNumber = data.level || 1;
    this.levelScore = data.levelScore || 0;
    this.timeBonus = data.timeBonus || 0;
    this.nextScene = data.nextScene || 'MenuScene';
    this.nextSceneData = data.nextSceneData || {};
    this.cutscene = data.cutscene || null;
  }

  create() {
    drawParchmentBackground(this, GAME_WIDTH, GAME_HEIGHT);

    const totalScore = this.levelScore + this.timeBonus;
    const grade = ScoreManager.getGrade(this.levelNumber, totalScore);
    const gradeColor = ScoreManager.getGradeColor(grade);
    ScoreManager.saveScore(this.levelNumber, totalScore);

    this.createCelebrationBackdrop();
    this.createTitle();
    this.createScorePanel(totalScore);
    this.createInstrumentShowcase();
    this.createGradeDisplay(grade, gradeColor);
    this.createHighScorePanel(totalScore);
    this.createContinuePrompt();
    this.launchFireworks();
  }

  createCelebrationBackdrop() {
    drawOrnateFrame(this, 22, 18, GAME_WIDTH - 44, GAME_HEIGHT - 36, COLORS.goldDark, 0.42);

    const glow = this.add.graphics();
    for (let i = 0; i < 7; i++) {
      glow.fillStyle(COLORS.goldLight, 0.03 + i * 0.01);
      glow.fillEllipse(GAME_WIDTH / 2, 120, 420 - i * 34, 180 - i * 18);
    }

    for (let i = 0; i < 16; i++) {
      const star = this.add.text(
        Phaser.Math.Between(40, GAME_WIDTH - 40),
        Phaser.Math.Between(24, 170),
        Phaser.Math.RND.pick(['✦', '✧', '⋆']),
        {
          fontFamily: 'Georgia, serif',
          fontSize: `${Phaser.Math.Between(10, 18)}px`,
          color: Phaser.Math.RND.pick(['#FFEAA0', '#FFF7DA', '#D8B657'])
        }
      ).setOrigin(0.5).setAlpha(Phaser.Math.FloatBetween(0.15, 0.45));

      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(8, 20),
        alpha: { from: star.alpha, to: star.alpha * 0.35 },
        scale: { from: 0.85, to: 1.15 },
        duration: Phaser.Math.Between(1100, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1200),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createTitle() {
    drawTrebleClef(this, 92, 42, 1.35);
    drawTrebleClef(this, GAME_WIDTH - 116, 42, 1.35);

    this.add.text(GAME_WIDTH / 2, 48, 'LEVEL COMPLETE!', {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#FFE59A',
      stroke: '#7B5111',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, `Movement ${this.levelNumber} finished with flourish`, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#8C6030'
    }).setOrigin(0.5);

    drawStaffDivider(this, GAME_WIDTH / 2 - 120, 92, 240);
  }

  createScorePanel(totalScore) {
    const panel = this.add.graphics();
    panel.fillStyle(0xf7ebd4, 0.94);
    panel.fillRoundedRect(236, 118, 300, 156, 18);
    panel.fillStyle(0xffffff, 0.18);
    panel.fillRoundedRect(244, 126, 284, 40, 12);
    panel.lineStyle(2, COLORS.goldDark, 0.62);
    panel.strokeRoundedRect(236, 118, 300, 156, 18);

    const scoreRows = [
      { label: 'Level Score', value: this.levelScore, y: 154, color: '#3D2A1C' },
      { label: 'Time Bonus', value: this.timeBonus, y: 194, color: '#6B4D28', prefix: '+' },
      { label: 'Total Ovation', value: totalScore, y: 236, color: '#9C6B18' }
    ];

    scoreRows.forEach((row, index) => {
      this.add.text(266, row.y, row.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: row.color
      }).setOrigin(0, 0.5);

      const valueText = this.add.text(512, row.y, '0', {
        fontFamily: 'Georgia, serif',
        fontSize: index === 2 ? '22px' : '18px',
        fontStyle: index === 2 ? 'bold' : 'normal',
        color: row.color
      }).setOrigin(1, 0.5);

      this.tweens.addCounter({
        from: 0,
        to: row.value,
        duration: 700 + index * 180,
        delay: 180 + index * 120,
        ease: 'Cubic.easeOut',
        onUpdate: tween => {
          const value = Math.floor(tween.getValue()).toLocaleString();
          valueText.setText(`${row.prefix || ''}${value}`);
        }
      });
    });
  }

  createInstrumentShowcase() {
    const instrument = LEVEL_INSTRUMENTS[this.levelNumber] || 'violin';
    const medal = this.add.graphics();
    medal.fillStyle(0x8d6520, 0.15);
    medal.fillCircle(152, 188, 60);
    medal.fillStyle(0xfff3cd, 0.95);
    medal.fillCircle(152, 182, 56);
    medal.lineStyle(3, COLORS.goldDark, 0.8);
    medal.strokeCircle(152, 182, 56);
    medal.lineStyle(1, COLORS.white, 0.35);
    medal.strokeCircle(152, 182, 46);

    const icon = createInstrumentIcon(this, 152, 175, instrument, COLORS.goldDark, 1.2);
    icon.setAlpha(0.95);

    this.add.text(152, 230, 'Instrument Unlocked', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#8C6030'
    }).setOrigin(0.5);
    this.add.text(152, 248, instrument.toUpperCase(), {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#5C3D1A'
    }).setOrigin(0.5);
  }

  createGradeDisplay(grade, gradeColor) {
    this.gradeText = this.add.text(640, 172, grade, {
      fontFamily: 'Georgia, serif',
      fontSize: '78px',
      fontStyle: 'bold',
      color: gradeColor,
      stroke: '#8B4513',
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 6, color: '#000000', blur: 12, fill: true }
    }).setOrigin(0.5).setScale(0.2).setAlpha(0);

    this.add.text(640, 232, 'performance grade', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#87612F'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.gradeText,
      scale: 1,
      alpha: 1,
      duration: 650,
      delay: 420,
      ease: 'Back.easeOut',
      onComplete: () => createGoldConfetti(this, 640, 150, 60)
    });

    this.tweens.add({
      targets: this.gradeText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 1200,
      delay: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(i * 60);
      const star = this.add.text(640 + Math.cos(angle) * 78, 172 + Math.sin(angle) * 48, '✦', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#FFEAA0'
      }).setOrigin(0.5).setAlpha(0.2);

      this.tweens.add({
        targets: star,
        angle: 30,
        alpha: { from: 0.12, to: 0.8 },
        duration: 950 + i * 80,
        yoyo: true,
        repeat: -1,
        delay: i * 140,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createHighScorePanel(totalScore) {
    const panel = this.add.graphics();
    panel.fillStyle(0xf7ebd4, 0.9);
    panel.fillRoundedRect(188, 304, 424, 110, 18);
    panel.lineStyle(2, COLORS.goldDark, 0.58);
    panel.strokeRoundedRect(188, 304, 424, 110, 18);

    this.add.text(GAME_WIDTH / 2, 324, `Best Performances — Level ${this.levelNumber}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#7B5111'
    }).setOrigin(0.5);

    const highScores = ScoreManager.getHighScores(this.levelNumber).slice(0, 5);
    highScores.forEach((entry, i) => {
      const highlight = entry.score === totalScore ? '#C28A18' : '#5C3D1A';
      this.add.text(250 + (i % 2) * 180, 352 + Math.floor(i / 2) * 26, `${i + 1}. ${entry.score.toLocaleString()}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: highlight,
        fontStyle: entry.score === totalScore ? 'bold' : 'normal'
      }).setOrigin(0, 0.5);
    });
  }

  createContinuePrompt() {
    const continueText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 26, '✦ Press SPACE to continue the concert ✦', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#A06E1A'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: continueText, alpha: 1, duration: 420, delay: 1600 });
    this.tweens.add({
      targets: continueText,
      alpha: 0.32,
      duration: 900,
      delay: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(1600, () => {
      this.input.keyboard?.once('keydown-SPACE', () => this.proceed());
      this.input.keyboard?.once('keydown-ENTER', () => this.proceed());
    });
  }

  launchFireworks() {
    const bursts = [
      { x: 140, y: 120, delay: 200 },
      { x: 700, y: 92, delay: 700 },
      { x: 388, y: 88, delay: 1100 }
    ];

    bursts.forEach(burst => {
      this.time.delayedCall(burst.delay, () => this.spawnFirework(burst.x, burst.y));
    });
  }

  spawnFirework(x, y) {
    createGoldConfetti(this, x, y, 24);
    for (let i = 0; i < 10; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.RND.pick([COLORS.gold, COLORS.goldLight, COLORS.white]), 0.9)
        .setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(30, 70);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  proceed() {
    const instrument = LEVEL_INSTRUMENTS[this.levelNumber];
    if (instrument) {
      this.scene.start('InstrumentLessonScene', {
        instrument,
        level: this.levelNumber,
        nextScene: this.nextScene,
        nextSceneData: this.nextSceneData,
        cutscene: this.cutscene
      });
    } else if (this.cutscene) {
      this.scene.start('CutsceneScene', { cutscene: this.cutscene, nextScene: this.nextScene });
    } else {
      this.scene.start(this.nextScene, this.nextSceneData);
    }
  }
}
