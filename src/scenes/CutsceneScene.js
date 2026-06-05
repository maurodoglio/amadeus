import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

const CUTSCENE_DATA = {
  intro: {
    background: '#1a1a2e',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Leopold Mozart',
        text: 'My dear Wolfgang... you are only six years old, yet you play with the mastery of a seasoned musician. The world must hear you!',
        side: 'left'
      },
      {
        portrait: 'mozart',
        name: 'Young Mozart',
        text: 'But Father, I want to compose! I hear melodies everywhere — in the birdsong, in the church bells of Salzburg...',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'Salzburg, 1762. Leopold Mozart has discovered his son\'s extraordinary gift. Soon, all of Europe would know the name Mozart.',
        side: 'center'
      }
    ]
  },
  afterLevel1: {
    background: '#1a2e1a',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Leopold Mozart',
        text: 'Pack your things, Wolfgang! We depart for Munich at dawn. The Elector wishes to hear you play.',
        side: 'left'
      },
      {
        portrait: 'mozart',
        name: 'Young Mozart',
        text: 'Munich, Paris, London — the whole world awaits! I shall dazzle every court in Europe!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'The Mozart family embarked on a grand tour of European courts. Young Wolfgang performed before kings and queens, astonishing all who heard him.',
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
        text: 'Three years touring Europe, and now we return to Salzburg. But I have outgrown this small city...',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Archbishop Colloredo',
        text: 'You serve ME, Mozart. You are nothing more than a servant in my household. Remember your place!',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'A servant?! My music belongs to the world, not to one man\'s vanity!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'Tensions with Archbishop Colloredo grew unbearable. Mozart chafed under the restrictions of court service, dreaming of freedom.',
        side: 'center'
      }
    ]
  },
  afterLevel3: {
    background: '#1a1a2e',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'I have broken free at last! Vienna — the city of music — shall be my home. Here I shall compose operas that shake the heavens!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: '1781. Mozart resigned from the Archbishop\'s service and moved to Vienna as a freelance musician — a bold and dangerous choice.',
        side: 'center'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'The Marriage of Figaro, Don Giovanni... I shall write music that speaks truth to power!',
        side: 'left'
      }
    ]
  },
  afterLevel4: {
    background: '#2e2e1a',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'The audiences grow thin... my debts mount. Vienna is fickle — they loved me yesterday, and forget me today.',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Constanze Mozart',
        text: 'Wolfgang, we cannot pay the rent this month. You must write to our friends for loans...',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'I will not be defeated! My music burns brighter than ever. The world will remember me!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'Despite composing masterpiece after masterpiece, Mozart struggled with mounting debts and fading public interest in Vienna.',
        side: 'center'
      }
    ]
  },
  afterLevel5: {
    background: '#1a1a1a',
    dialogues: [
      {
        portrait: null,
        name: 'Grey Messenger',
        text: 'Herr Mozart... I come on behalf of an anonymous patron. He wishes to commission a Requiem Mass. The fee is generous.',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'A Requiem? Who sends you? Tell me the name of your master!',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Grey Messenger',
        text: 'That I cannot say. Do you accept the commission?',
        side: 'right'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'I feel as though... I am writing this Requiem for myself.',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: '1791. A mysterious grey messenger commissioned a Requiem Mass. Mozart, already ill, became consumed by the work — convinced it was a premonition of his own death.',
        side: 'center'
      }
    ]
  },
  afterLevel6: {
    background: '#0a0a1e',
    dialogues: [
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'The Requiem... I must finish it. Süssmayr, come — let me show you how the final movements should sound...',
        side: 'left'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'On December 5th, 1791, Mozart passed away at the age of 35. His Requiem remained unfinished — completed later by his student.',
        side: 'center'
      },
      {
        portrait: null,
        name: 'Narrator',
        text: 'Yet his music transcended death itself. Over 600 compositions — symphonies, operas, concertos — each one a miracle of human creativity.',
        side: 'center'
      },
      {
        portrait: 'mozart',
        name: 'Mozart',
        text: 'Neither a lofty degree of intelligence, nor imagination, nor both together go to the making of genius. Love, love, love — that is the soul of genius.',
        side: 'left'
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

    // Portrait frame (inside the box, left-aligned with padding)
    const portraitX = -boxBg.width / 2 + 50;
    this.portraitFrame = this.add.rectangle(portraitX, 0, 70, 70, 0x222222);
    this.portraitFrame.setStrokeStyle(2, 0xFFD700);
    this.portraitFrame.setVisible(false);
    this.dialogBox.add(this.portraitFrame);

    // Portrait image
    this.portraitImage = this.add.image(portraitX, 0, 'mozart');
    this.portraitImage.setScale(2);
    this.portraitImage.setVisible(false);
    this.dialogBox.add(this.portraitImage);

    // Text x offset (shifted right when portrait is present)
    const textXWithPortrait = -boxBg.width / 2 + 95;
    const textXNoPortrait = -boxBg.width / 2 + 20;
    this.textXWithPortrait = textXWithPortrait;
    this.textXNoPortrait = textXNoPortrait;
    this.textWidthWithPortrait = boxBg.width - 120 - 80;
    this.textWidthNoPortrait = boxBg.width - 120;

    // Character name text
    this.nameText = this.add.text(textXNoPortrait, -boxBg.height / 2 + 10, '', {
      font: 'bold 16px monospace',
      fill: '#FFD700'
    });
    this.dialogBox.add(this.nameText);

    // Dialog text
    this.dialogText = this.add.text(textXNoPortrait, -boxBg.height / 2 + 35, '', {
      font: '14px monospace',
      fill: '#FFFFFF',
      wordWrap: { width: boxBg.width - 120 }
    });
    this.dialogBox.add(this.dialogText);

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

    // Update portrait and adjust text position
    if (dialogue.portrait && this.textures.exists(dialogue.portrait)) {
      this.portraitFrame.setVisible(true);
      this.portraitImage.setTexture(dialogue.portrait);
      this.portraitImage.setVisible(true);

      // Shift text to accommodate portrait
      this.nameText.setX(this.textXWithPortrait);
      this.dialogText.setX(this.textXWithPortrait);
      this.dialogText.setWordWrapWidth(this.textWidthWithPortrait);

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

      // Use full width for text
      this.nameText.setX(this.textXNoPortrait);
      this.dialogText.setX(this.textXNoPortrait);
      this.dialogText.setWordWrapWidth(this.textWidthNoPortrait);
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
