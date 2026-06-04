import Phaser from 'phaser';
import { PLAYER } from '../config/constants.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { MusicalCombat } from '../mechanics/MusicalCombat.js';

export class Mozart extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mozart');
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
      key: 'mozart_idle',
      frames: [{ key: 'mozart', frame: 0 }],
      frameRate: 1
    });

    scene.anims.create({
      key: 'mozart_walk',
      frames: scene.anims.generateFrameNumbers('mozart', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'mozart_jump',
      frames: [{ key: 'mozart', frame: 3 }],
      frameRate: 1
    });

    this.play('mozart_idle');

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Musical combat system
    this.combat = new MusicalCombat(scene, this);

    // Reference to touch controls scene (if running)
    this.touchControls = null;
  }

  update(time) {
    if (this.isDead) return;

    // Lazily acquire touch controls reference
    if (!this.touchControls) {
      this.touchControls = this.scene.scene.get('TouchControls');
    }

    const touch = this.touchControls || {};
    const onGround = this.body.blocked.down || this.body.touching.down;

    // Emit dust on landing
    if (onGround && this.wasInAir) {
      this.particles.emitDust(this.x, this.y + this.height / 2);
    }
    this.wasInAir = !onGround;

    // Horizontal movement (keyboard OR touch)
    if (this.cursors.left.isDown || touch.isLeft) {
      this.setVelocityX(-PLAYER.SPEED);
      this.setFlipX(true);
      if (onGround) this.play('mozart_walk', true);
    } else if (this.cursors.right.isDown || touch.isRight) {
      this.setVelocityX(PLAYER.SPEED);
      this.setFlipX(false);
      if (onGround) this.play('mozart_walk', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('mozart_idle', true);
    }

    // Jumping (keyboard OR touch)
    if ((this.cursors.up.isDown || this.spaceKey.isDown || touch.isJump) && onGround) {
      this.setVelocityY(PLAYER.JUMP_VELOCITY);
      this.play('mozart_jump', true);
      if (this.scene.sound.get('sfx_jump')) {
        this.scene.sound.play('sfx_jump', { volume: 0.3 });
      }
    }

    // In-air animation
    if (!onGround) {
      this.play('mozart_jump', true);
    }

    // Musical combat update
    if (this.combat) {
      this.combat.update(time || this.scene.time.now);
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

    // If there's a checkpoint, respawn there
    if (this.scene.lastCheckpoint) {
      this.isDead = true;
      this.setVelocity(0, -200);

      this.scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 500,
        ease: 'Quad.easeIn'
      });

      this.scene.time.delayedCall(600, () => {
        const cp = this.scene.lastCheckpoint;
        this.respawn(cp.x, cp.y - 40);
      });
      return;
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
    this.setVelocity(0, 0);

    if (this.scene.sound.get('sfx_death')) {
      this.scene.sound.play('sfx_death', { volume: 0.3 });
    }

    // Brief slow-motion effect
    this.scene.time.timeScale = 0.3;
    this.scene.physics.world.timeScale = 3;

    // Dramatic spin
    this.scene.tweens.add({
      targets: this,
      angle: 720,
      duration: 800,
      ease: 'Quad.easeIn'
    });

    // After slow-mo, launch upward and fall off screen
    this.scene.time.delayedCall(400, () => {
      this.scene.time.timeScale = 1;
      this.scene.physics.world.timeScale = 1;
      this.setVelocity(0, -400);
      this.body.setAllowGravity(true);
    });

    // In co-op, only game over if both players are dead or lives are 0
    const coopMode = this.scene.registry.get('coopMode');
    if (!coopMode) {
      this.scene.time.delayedCall(1800, () => {
        this.scene.scene.stop('UIScene');
        this.scene.scene.start('MenuScene');
      });
    }
  }

  /**
   * Respawn at a given position with sparkle effect.
   */
  respawn(x, y) {
    this.isDead = false;
    this.isInvincible = true;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAngle(0);
    this.setAlpha(0);
    this.body.setAllowGravity(true);

    // Sparkle respawn effect
    this.particles.emitRespawnSparkle(x, y);

    // Fade in with brief invincibility
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        // Flicker to show invincibility ending
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            this.alpha = 1;
            this.isInvincible = false;
          }
        });
      }
    });
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
