import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const CUTSCENE_DATA = {
  intro: {
    background: '#1a1a2e',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Young Mozart',
        text: 'The streets of Vienna are calling me... I must follow my dream of becoming the greatest musician!',
        side: 'left'
      },
      {
        portrait: 'mozart',
        name: 'Young Mozart',
        text: 'Father says I have a gift, but gifts mean nothing without the courage to use them.',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'And so, young Wolfgang Amadeus Mozart set out from home, his heart full of melodies yet unwritten...',
        side: 'center'
      }
    ]
  },
  afterLevel1: {
    background: '#1a2e1a',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'What a journey through Vienna! But I sense something magical ahead...',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Mysterious Voice',
        text: 'Deep in the Enchanted Forest lies a flute of extraordinary power... the Magic Flute!',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'A Magic Flute? Could it be real? I must find it!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'Rumors of the legendary Magic Flute drew Mozart deeper into the enchanted woods...',
        side: 'center'
      }
    ]
  },
  afterLevel2: {
    background: '#2e1a2e',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'The forest was perilous, but I found the Magic Flute! Its melody is unlike anything I\'ve heard.',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Royal Messenger',
        text: 'A letter for you, Herr Mozart! An invitation to perform at the Royal Palace!',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'The Royal Palace! This is my chance to prove myself to the world!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'But unknown to Mozart, the invitation was forged by the Discordant Maestro — a trap awaits at the palace...',
        side: 'center'
      }
    ]
  }
};

export class CutsceneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CutsceneScene' });
  }

  init(data) {
    this.cutsceneKey = data.cutscene || 'intro';
    this.nextScene = data.nextScene || 'Level1Scene';
  }

  create() {
    const cutscene = CUTSCENE_DATA[this.cutsceneKey];
    if (!cutscene) {
      this.scene.start(this.nextScene);
      return;
    }

    this.cameras.main.setBackgroundColor(cutscene.background);
    this.dialogues = cutscene.dialogues;
    this.currentDialogue = -1;

    // Create starfield background
    this.createStarfield();

    // Dialog box container
    this.dialogBox = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 120);
    this.dialogBox.setAlpha(0);

    // Dialog background panel
    const boxBg = this.add.rectangle(0, 0, GAME_WIDTH - 80, 160, 0x000000, 0.85);
    boxBg.setStrokeStyle(2, 0xFFD700);
    this.dialogBox.add(boxBg);

    // Character name text
    this.nameText = this.add.text(-boxBg.width / 2 + 20, -boxBg.height / 2 + 10, '', {
      font: 'bold 16px monospace',
      fill: '#FFD700'
    });
    this.dialogBox.add(this.nameText);

    // Dialog text
    this.dialogText = this.add.text(-boxBg.width / 2 + 20, -boxBg.height / 2 + 35, '', {
      font: '14px monospace',
      fill: '#FFFFFF',
      wordWrap: { width: boxBg.width - 120 }
    });
    this.dialogBox.add(this.dialogText);

    // Portrait frame
    this.portraitFrame = this.add.rectangle(-boxBg.width / 2 - 50, 0, 70, 70, 0x222222);
    this.portraitFrame.setStrokeStyle(2, 0xFFD700);
    this.portraitFrame.setVisible(false);
    this.dialogBox.add(this.portraitFrame);

    // Portrait image
    this.portraitImage = this.add.image(-boxBg.width / 2 - 50, 0, 'mozart');
    this.portraitImage.setScale(2);
    this.portraitImage.setVisible(false);
    this.dialogBox.add(this.portraitImage);

    // Continue prompt
    this.continueText = this.add.text(boxBg.width / 2 - 20, boxBg.height / 2 - 20, '▼', {
      font: '16px monospace',
      fill: '#FFD700'
    }).setOrigin(1, 1);
    this.continueText.setAlpha(0);
    this.dialogBox.add(this.continueText);

    // Blink the continue indicator
    this.tweens.add({
      targets: this.continueText,
      alpha: { from: 0, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      delay: 500
    });

    // Skip hint
    this.add.text(GAME_WIDTH - 20, 20, 'ENTER to continue | ESC to skip', {
      font: '12px monospace',
      fill: '#808080'
    }).setOrigin(1, 0);

    // Input handling
    this.canAdvance = false;
    this.input.keyboard.on('keydown-SPACE', () => this.advanceDialogue());
    this.input.keyboard.on('keydown-ENTER', () => this.advanceDialogue());
    this.input.keyboard.on('keydown-ESC', () => this.endCutscene());
    this.input.on('pointerdown', () => this.advanceDialogue());

    // Start first dialogue with fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.showNextDialogue());
  }

  createStarfield() {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT - 200);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xFFFFFF, Phaser.Math.FloatBetween(0.2, 0.7));

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  showNextDialogue() {
    this.currentDialogue++;

    if (this.currentDialogue >= this.dialogues.length) {
      this.endCutscene();
      return;
    }

    const dialogue = this.dialogues[this.currentDialogue];
    this.canAdvance = false;

    // Fade in the dialog box on first dialogue
    if (this.currentDialogue === 0) {
      this.tweens.add({
        targets: this.dialogBox,
        alpha: 1,
        duration: 400,
        ease: 'Power2'
      });
    }

    // Update name
    this.nameText.setText(dialogue.name);

    // Update portrait
    if (dialogue.portrait && this.textures.exists(dialogue.portrait)) {
      this.portraitFrame.setVisible(true);
      this.portraitImage.setTexture(dialogue.portrait);
      this.portraitImage.setVisible(true);

      // Portrait entrance animation
      this.portraitImage.setScale(0);
      this.tweens.add({
        targets: this.portraitImage,
        scale: 2,
        duration: 300,
        ease: 'Back.easeOut'
      });
    } else {
      this.portraitFrame.setVisible(false);
      this.portraitImage.setVisible(false);
    }

    // Typewriter text reveal
    this.dialogText.setText('');
    this.revealText(dialogue.text);
  }

  revealText(fullText) {
    let charIndex = 0;
    this.textTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        charIndex++;
        this.dialogText.setText(fullText.substring(0, charIndex));

        if (charIndex >= fullText.length) {
          this.textTimer.destroy();
          this.canAdvance = true;
        }
      },
      repeat: fullText.length - 1
    });
  }

  advanceDialogue() {
    if (!this.canAdvance) {
      // If text is still revealing, show it all at once
      if (this.textTimer) {
        this.textTimer.destroy();
        const dialogue = this.dialogues[this.currentDialogue];
        if (dialogue) {
          this.dialogText.setText(dialogue.text);
        }
        this.canAdvance = true;
      }
      return;
    }

    this.showNextDialogue();
  }

  endCutscene() {
    if (this.textTimer) {
      this.textTimer.destroy();
    }

    this.cameras.main.fade(800, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.start(this.nextScene);
      }
    });
  }
}
