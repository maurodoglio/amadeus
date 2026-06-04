import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { Mozart } from '../sprites/Mozart.js';
import { Singer } from '../sprites/enemies/Singer.js';
import { DissonantNote } from '../sprites/enemies/DissonantNote.js';
import { BrokenInstrument } from '../sprites/enemies/BrokenInstrument.js';
import { NPC } from '../sprites/NPC.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { NPC_DIALOGUES } from '../config/npcDialogues.js';

export class Level7Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level7Scene' });
  }

  create() {
    // Background - sky cathedral
    if (this.textures.exists('bgSky')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bgSky');
    } else {
      this.cameras.main.setBackgroundColor('#1a1a4e');
    }

    // Level title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'The Sky Cathedral', {
      font: '24px monospace',
      fill: '#E0E0FF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: title,
      alpha: 0,
      delay: 2000,
      duration: 1000
    });

    // Low gravity for this level
    this.physics.world.gravity.y = 400;

    // Platforms
    this.platforms = this.physics.add.staticGroup();

    // Floating cloud/stone platforms (no continuous ground - sky level)
    const platformData = [
      { x: 50, y: 400, w: 4 },
      { x: 250, y: 340, w: 3 },
      { x: 450, y: 280, w: 2 },
      { x: 350, y: 200, w: 2 },
      { x: 600, y: 360, w: 3 },
      { x: 750, y: 260, w: 2 },
      { x: 900, y: 180, w: 3 },
      { x: 1050, y: 320, w: 2 },
      { x: 1200, y: 240, w: 3 },
      { x: 1400, y: 160, w: 2 },
      { x: 1350, y: 360, w: 3 },
      { x: 1550, y: 280, w: 2 },
      { x: 1700, y: 200, w: 3 },
      { x: 1900, y: 320, w: 2 },
      { x: 2050, y: 240, w: 3 },
      { x: 2250, y: 160, w: 2 },
      { x: 2200, y: 360, w: 3 },
      { x: 2450, y: 280, w: 4 },
    ];

    platformData.forEach(p => {
      for (let i = 0; i < p.w; i++) {
        const plat = this.platforms.create(p.x + i * TILE_SIZE, p.y, 'platform')
          .setDisplaySize(TILE_SIZE, TILE_SIZE / 2)
          .refreshBody();
        plat.setTint(0xCCCCFF);
      }
    });

    // Decorative clouds
    for (let i = 0; i < 12; i++) {
      const cx = Phaser.Math.Between(0, GAME_WIDTH * 3.2);
      const cy = Phaser.Math.Between(50, GAME_HEIGHT - 100);
      const cloud = this.add.ellipse(cx, cy, Phaser.Math.Between(60, 120), Phaser.Math.Between(20, 40), 0xFFFFFF, 0.15);
      cloud.setDepth(-1);
      this.tweens.add({
        targets: cloud,
        x: cx + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Player
    this.mozart = new Mozart(this, 100, 350);

    // Enemies
    this.enemies = this.physics.add.group();
    this.enemyList = [];

    [400, 900, 1400, 1900].forEach(x => {
      const singer = new Singer(this, x, 300);
      this.enemies.add(singer);
      this.enemyList.push(singer);
    });

    [{ x: 600, y: 200 }, { x: 1100, y: 150 }, { x: 1600, y: 130 }, { x: 2100, y: 120 }].forEach(pos => {
      const note = new DissonantNote(this, pos.x, pos.y);
      this.enemies.add(note);
      this.enemyList.push(note);
    });

    [800, 1300, 2000].forEach(x => {
      const bi = new BrokenInstrument(this, x, 280);
      this.enemies.add(bi);
      this.enemyList.push(bi);
    });

    // Collectibles
    this.collectibles = this.physics.add.group();
    const collectiblePositions = [
      { x: 270, y: 300 }, { x: 470, y: 240 }, { x: 620, y: 320 },
      { x: 770, y: 220 }, { x: 920, y: 140 }, { x: 1070, y: 280 },
      { x: 1220, y: 200 }, { x: 1420, y: 120 }, { x: 1570, y: 240 },
      { x: 1720, y: 160 }, { x: 1920, y: 280 }, { x: 2070, y: 200 },
      { x: 2270, y: 120 },
    ];

    collectiblePositions.forEach(pos => {
      const note = this.collectibles.create(pos.x, pos.y, 'musicNote');
      note.body.setAllowGravity(false);
      note.setDisplaySize(20, 24);
      this.tweens.add({
        targets: note,
        y: pos.y - 15,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Instrument at end (harp)
    this.instrument = this.physics.add.sprite(2550, 240, 'harp');
    this.instrument.body.setAllowGravity(false);
    this.instrument.setDisplaySize(36, 48);
    this.tweens.add({
      targets: this.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Collisions
    this.physics.add.collider(this.mozart, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.mozart, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.mozart, this.collectibles, this.collectNote, null, this);
    this.physics.add.overlap(this.mozart, this.instrument, this.collectInstrument, null, this);

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3.2, GAME_HEIGHT);
    this.cameras.main.startFollow(this.mozart, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 3.2, GAME_HEIGHT);
    this.mozart.setCollideWorldBounds(true);

    // NPC - Young Beethoven (secret encounter, hidden high up)
    const beethovenData = NPC_DIALOGUES.beethoven;
    this.beethoven = new NPC(this, 920, 100, beethovenData.texture, {
      name: beethovenData.name,
      dialogues: beethovenData.firstMeeting,
      repeatDialogues: beethovenData.repeat,
      interactionRadius: 70
    });

    // Dialogue system
    this.dialogueBox = new DialogueBox(this);
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    // If dialogue is active, only handle dialogue input
    if (this.dialogueBox && this.dialogueBox.isActive) {
      if (Phaser.Input.Keyboard.JustDown(this.mozart.spaceKey) ||
          Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ENTER'))) {
        this.dialogueBox.advance();
      }
      return;
    }

    if (this.mozart) this.mozart.update();
    this.enemyList.forEach(e => {
      if (e.active) e.update(time, delta);
    });

    // NPC updates and interaction
    if (this.beethoven) {
      this.beethoven.update(this.mozart, this.dialogueBox);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
          Phaser.Input.Keyboard.JustDown(this.mozart.cursors.up)) {
        this.beethoven.interact(this.dialogueBox);
      }
    }

    // Fall death (fall off bottom of sky)
    if (this.mozart && this.mozart.y > GAME_HEIGHT + 50) {
      this.mozart.die();
    }
  }

  hitEnemy(player, enemy) {
    if (player.body.velocity.y > 0 && player.y < enemy.y - 10) {
      enemy.destroy();
      this.enemyList = this.enemyList.filter(e => e !== enemy);
      player.setVelocityY(-200);
      const score = this.registry.get('score') + 100;
      this.registry.set('score', score);
      if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.2 });
    } else {
      player.hit();
    }
  }

  collectNote(player, note) {
    note.destroy();
    const score = this.registry.get('score') + 50;
    this.registry.set('score', score);
    if (this.sound.get('sfx_coin')) this.sound.play('sfx_coin', { volume: 0.3 });
  }

  collectInstrument(player, instrument) {
    instrument.destroy();
    player.collectInstrument('harp');

    this.physics.world.gravity.y = 800;

    const completedLevels = this.registry.get('completedLevels') || [];
    if (!completedLevels.includes(7)) {
      completedLevels.push(7);
      this.registry.set('completedLevels', completedLevels);
    }

    this.cameras.main.fade(1500, 255, 255, 255, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.stop('UIScene');
        this.scene.start('ConcertScene');
      }
    });
  }
}
