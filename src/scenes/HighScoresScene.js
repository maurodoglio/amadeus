import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { ScoreManager } from '../utils/ScoreManager.js';
import { drawConcertHallBackground, drawOrnateFrame, createInstrumentIcon, COLORS } from '../ui/UITheme.js';

const SCORE_LEVELS = [
  { name: 'Vienna Streets', instrument: 'violin' },
  { name: 'Enchanted Forest', instrument: 'flute' },
  { name: 'Royal Palace', instrument: 'piano' },
  { name: 'Cathedral Depths', instrument: 'harpsichord' },
  { name: 'Clockwork Tower', instrument: 'trumpet' },
  { name: 'Shadow Realm', instrument: 'drums' },
  { name: 'Grand Finale', instrument: 'harp' }
];

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
  }

  create() {
    drawConcertHallBackground(this, GAME_WIDTH, GAME_HEIGHT);
    this.createAtmosphere();
    this.createFrame();
    this.createTitle();
    this.createScoreTable();
    this.createBackButton();

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start('MenuScene'));
  }

  createAtmosphere() {
    for (let i = 0; i < 16; i++) {
      const note = this.add.text(
        Phaser.Math.Between(40, GAME_WIDTH - 40),
        Phaser.Math.Between(50, GAME_HEIGHT - 50),
        Phaser.Math.RND.pick(['♪', '♫', '♬']),
        {
          fontFamily: 'Georgia, serif',
          fontSize: `${Phaser.Math.Between(12, 22)}px`,
          color: '#FFE7A0'
        }
      ).setOrigin(0.5).setAlpha(Phaser.Math.FloatBetween(0.08, 0.22));

      this.tweens.add({
        targets: note,
        y: note.y - Phaser.Math.Between(20, 40),
        alpha: { from: note.alpha, to: note.alpha * 0.35 },
        duration: Phaser.Math.Between(3000, 4800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1800),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createFrame() {
    drawOrnateFrame(this, 36, 26, GAME_WIDTH - 72, GAME_HEIGHT - 72, COLORS.gold, 0.42);

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.navyBlue, 0.56);
    panel.fillRoundedRect(88, 86, GAME_WIDTH - 176, 300, 20);
    panel.fillStyle(COLORS.white, 0.08);
    panel.fillRoundedRect(96, 94, GAME_WIDTH - 192, 42, 14);
    panel.lineStyle(2, COLORS.goldDark, 0.7);
    panel.strokeRoundedRect(88, 86, GAME_WIDTH - 176, 300, 20);
    panel.lineStyle(1, COLORS.white, 0.12);
    panel.strokeRoundedRect(96, 94, GAME_WIDTH - 192, 284, 14);
  }

  createTitle() {
    this.add.text(GAME_WIDTH / 2, 50, 'HIGH SCORES', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#FFE59A',
      stroke: '#7D5310',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 10, fill: true }
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 76, 'A gilded ledger of Mozart’s finest performances', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#D6BE85'
    }).setOrigin(0.5);
  }

  createScoreTable() {
    const headers = [
      { text: 'Level', x: 170 },
      { text: 'Best Score', x: 470 },
      { text: 'Grade', x: 626 }
    ];

    headers.forEach(header => {
      this.add.text(header.x, 115, header.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#F6E8C6'
      }).setOrigin(header.text === 'Level' ? 0 : 0.5, 0.5);
    });

    SCORE_LEVELS.forEach((levelInfo, index) => {
      const scores = ScoreManager.getHighScores(index + 1);
      const bestScore = scores.length > 0 ? scores[0].score : null;
      const grade = bestScore !== null ? ScoreManager.getGrade(index + 1, bestScore) : '—';
      const gradeColor = bestScore !== null ? ScoreManager.getGradeColor(grade) : '#767676';
      const y = 148 + index * 33;

      const row = this.add.container(0, 0);
      const rowBg = this.add.rectangle(GAME_WIDTH / 2, y, 594, 28, index % 2 === 0 ? 0xffffff : 0xf0eadf, index % 2 === 0 ? 0.05 : 0.03)
        .setStrokeStyle(1, COLORS.goldDark, 0.08);
      row.add(rowBg);

      const ornamentLeft = this.add.text(122, y, '♪', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#D6BE85'
      }).setOrigin(0.5).setAlpha(0.72);
      const ornamentRight = this.add.text(674, y, '♫', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#D6BE85'
      }).setOrigin(0.5).setAlpha(0.72);
      row.add([ornamentLeft, ornamentRight]);

      const icon = createInstrumentIcon(this, 145, y, levelInfo.instrument, COLORS.gold, 0.46);
      row.add(icon);

      const levelText = this.add.text(168, y - 6, `${index + 1}. ${levelInfo.name}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#F6E8C6'
      }).setOrigin(0, 0.5);
      row.add(levelText);

      const detailText = this.add.text(168, y + 8, this.buildSecondaryText(scores), {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#AF9A72'
      }).setOrigin(0, 0.5);
      row.add(detailText);

      const scoreText = this.add.text(470, y, bestScore === null ? '—' : '0', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#FFF7DD'
      }).setOrigin(0.5);
      row.add(scoreText);

      const gradeBadge = this.add.text(626, y, grade, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: gradeColor,
        stroke: '#2B1810',
        strokeThickness: 2
      }).setOrigin(0.5);
      row.add(gradeBadge);

      row.setAlpha(0).setY(16);
      this.tweens.add({
        targets: row,
        alpha: 1,
        y: 0,
        duration: 280,
        delay: 140 + index * 90,
        ease: 'Power2'
      });

      this.tweens.add({
        targets: gradeBadge,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        delay: index * 110,
        ease: 'Sine.easeInOut'
      });

      if (bestScore !== null) {
        this.tweens.addCounter({
          from: 0,
          to: bestScore,
          duration: 800 + index * 80,
          delay: 220 + index * 90,
          ease: 'Cubic.easeOut',
          onUpdate: tween => {
            scoreText.setText(Math.floor(tween.getValue()).toLocaleString());
          }
        });
      }
    });
  }

  buildSecondaryText(scores) {
    if (!scores.length) return 'No score yet — be the first virtuoso';
    const trailing = scores.slice(1, 3).map((entry, idx) => `#${idx + 2} ${entry.score.toLocaleString()}`);
    return trailing.length ? trailing.join('  •  ') : 'A new performance will add to the ledger';
  }

  createBackButton() {
    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, '← Return to Menu', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '16px',
      color: '#D6BE85'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#FFE59A'));
    backBtn.on('pointerout', () => backBtn.setColor('#D6BE85'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
