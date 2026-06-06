import Phaser from 'phaser';
import { PLAYER } from '../config/constants.js';
import { ParticleManager } from '../utils/ParticleManager.js';

export class Nannerl extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'nannerl');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setSize(24, 44);
    this.setOffset(4, 2);

    this.isInvincible = false;
    this.isDead = false;
    this.canAttack = false;
    this.wasInAir = false;

    this.particles = new ParticleManager(scene);

    // Animations
    scene.anims.create({
      key: 'nannerl_idle',
      frames: [{ key: 'nannerl', frame: 0 }],
      frameRate: 1
    });

    scene.anims.create({
      key: 'nannerl_walk',
      frames: scene.anims.generateFrameNumbers('nannerl', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'nannerl_jump',
      frames: [{ key: 'nannerl', frame: 3 }],
      frameRate: 1
    });

    this.play('nannerl_idle');

    // Player 2 uses WASD + E to jump
    const kb = scene.input.keyboard;
    this.keyW = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyE = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update() {
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;

    // Emit dust on landing
    if (onGround && this.wasInAir) {
      this.particles.emitDust(this.x, this.y + this.height / 2);
    }
    this.wasInAir = !onGround;

    // Horizontal movement (A/D)
    if (this.keyA?.isDown) {
      this.setVelocityX(-PLAYER.SPEED);
      this.setFlipX(true);
      if (onGround) this.play('nannerl_walk', true);
    } else if (this.keyD?.isDown) {
      this.setVelocityX(PLAYER.SPEED);
      this.setFlipX(false);
      if (onGround) this.play('nannerl_walk', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('nannerl_idle', true);
    }

    // Jumping (W or E)
    if ((this.keyW?.isDown || this.keyE?.isDown) && onGround) {
      this.setVelocityY(PLAYER.JUMP_VELOCITY);
      this.play('nannerl_jump', true);
      if (this.scene.sound.get('sfx_jump')) {
        this.scene.sound.play('sfx_jump', { volume: 0.3 });
      }
    }

    // In-air animation
    if (!onGround) {
      this.play('nannerl_jump', true);
    }
  }

  hit() {
    if (this.isInvincible || this.isDead) return;

    this.isInvincible = true;
    const lives = this.scene.registry.get('lives') - 1;
    this.scene.registry.set('lives', lives);

    if (lives <= 0) {
      this.die();
      return;
    }

    // Hit feedback
    if (this.scene.sound.get('sfx_hit')) {
      this.scene.sound.play('sfx_hit', { volume: 0.3 });
    }

    // Flicker effect
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        this.alpha = 1;
        this.isInvincible = false;
      }
    });
  }

  die() {
    this.isDead = true;
    this.setVelocity(0, -300);
    this.body.setAllowGravity(true);

    if (this.scene.sound.get('sfx_death')) {
      this.scene.sound.play('sfx_death', { volume: 0.3 });
    }

    // In co-op, only game over if both players are dead
    const coopMode = this.scene.registry.get('coopMode');
    if (!coopMode) {
      this.scene.time.delayedCall(1500, () => {
        this.scene.scene.stop('UIScene');
        this.scene.scene.start('MenuScene');
      });
    }
  }

  collectInstrument(instrument) {
    const instruments = this.scene.registry.get('instruments');
    instruments.push(instrument);
    this.scene.registry.set('instruments', [...instruments]);

    if (this.scene.sound.get('sfx_levelComplete')) {
      this.scene.sound.play('sfx_levelComplete', { volume: 0.4 });
    }
  }
}
