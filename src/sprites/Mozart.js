import Phaser from 'phaser';
import { PLAYER } from '../config/constants.js';
import { ParticleManager } from '../utils/ParticleManager.js';
import { MusicalCombat } from '../mechanics/MusicalCombat.js';
import { SFXGenerator } from '../utils/SFXGenerator.js';
import { AnimationManager } from '../utils/AnimationManager.js';

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
    this.isAttacking = false;

    // Gameplay feel state
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumpHeld = false;
    this.currentVelocityX = 0;

    // Idle animation state
    this.idleTime = 0;
    this.idleSpecialPlayed = false;

    this.particles = new ParticleManager(scene);

    // Register animations via centralized manager
    const animManager = new AnimationManager(scene);
    animManager.registerMozartAnimations();

    this.play('mozart_idle');

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Musical combat system
    this.combat = new MusicalCombat(scene, this);

    // Reference to touch controls scene (if running)
    this.touchControls = null;
  }

  update(time, delta) {
    if (this.isDead) return;
    if (this.isAttacking) return;

    const dt = delta || 16;

    // Lazily acquire touch controls reference
    if (!this.touchControls) {
      this.touchControls = this.scene.scene.get('TouchControls');
    }

    const touch = this.touchControls || {};
    const onGround = this.body.blocked.down || this.body.touching.down;

    // --- Coyote time ---
    if (onGround) {
      this.coyoteTimer = PLAYER.COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }
    const canCoyoteJump = this.coyoteTimer > 0;

    // --- Jump input buffering ---
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
                        (touch.isJump && !this._prevTouchJump);
    this._prevTouchJump = !!touch.isJump;

    if (jumpPressed) {
      this.jumpBufferTimer = PLAYER.JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer -= dt;
    }

    const jumpHeld = this.cursors.up.isDown || this.spaceKey.isDown || touch.isJump;

    // --- Landing detection (squash + buffered jump) ---
    if (onGround && this.wasInAir) {
      this.particles.emitDust(this.x, this.y + this.height / 2);
      SFXGenerator.play(this.scene, 'sfx_land', 0.2);
      // Landing squash
      this.setScale(1.2, 0.8);
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: 'Back.easeOut'
      });
    }
    this.wasInAir = !onGround;

    // --- Horizontal movement with acceleration/deceleration ---
    let targetVX = 0;
    if (this.cursors.left.isDown || touch.isLeft) {
      targetVX = -PLAYER.SPEED;
      this.setFlipX(true);
    } else if (this.cursors.right.isDown || touch.isRight) {
      targetVX = PLAYER.SPEED;
      this.setFlipX(false);
    }

    if (targetVX !== 0) {
      // Accelerate toward target
      if (this.currentVelocityX < targetVX) {
        this.currentVelocityX = Math.min(this.currentVelocityX + PLAYER.ACCELERATION * (dt / 1000), targetVX);
      } else if (this.currentVelocityX > targetVX) {
        this.currentVelocityX = Math.max(this.currentVelocityX - PLAYER.ACCELERATION * (dt / 1000), targetVX);
      }
    } else {
      // Decelerate to stop
      if (this.currentVelocityX > 0) {
        this.currentVelocityX = Math.max(0, this.currentVelocityX - PLAYER.DECELERATION * (dt / 1000));
      } else if (this.currentVelocityX < 0) {
        this.currentVelocityX = Math.min(0, this.currentVelocityX + PLAYER.DECELERATION * (dt / 1000));
      }
    }

    this.setVelocityX(this.currentVelocityX);

    // --- Animations ---
    if (onGround) {
      if (Math.abs(this.currentVelocityX) > 10) {
        this.idleTime = 0;
        this.idleSpecialPlayed = false;
        if (Math.abs(this.currentVelocityX) > PLAYER.SPEED * 0.7) {
          this.play('mozart_run', true);
        } else {
          this.play('mozart_walk', true);
        }
      } else {
        // Idle with occasional special animations
        this.idleTime += dt;
        this.play('mozart_idle', true);
      }
    }

    // --- Jumping (with coyote time + input buffer) ---
    if (this.jumpBufferTimer > 0 && canCoyoteJump) {
      this.executeJump();
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    // --- Variable jump height ---
    if (!onGround && this.body.velocity.y < 0 && !jumpHeld) {
      this.body.velocity.y += PLAYER.GRAVITY * PLAYER.VARIABLE_JUMP_GRAVITY_MULT * (dt / 1000);
    }

    // In-air animations: ascent vs descent
    if (!onGround) {
      if (this.body.velocity.y < 0) {
        this.play('mozart_jump_up', true);
      } else {
        this.play('mozart_jump_down', true);
      }
    }

    // Musical combat update
    if (this.combat) {
      this.combat.update(time || this.scene.time.now);
    }
  }

  executeJump() {
    this.setVelocityY(PLAYER.JUMP_VELOCITY);
    this.play('mozart_jump_up', true);
    // Jump stretch
    this.setScale(0.85, 1.15);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Quad.easeOut'
    });
    SFXGenerator.play(this.scene, 'sfx_jump', 0.3);
  }

  /**
   * Play the attack animation (dramatic conductor pose).
   */
  playAttack(onComplete) {
    this.isAttacking = true;
    this.play('mozart_attack');
    this.once('animationcomplete-mozart_attack', () => {
      this.isAttacking = false;
      if (onComplete) onComplete();
    });
  }

  /**
   * Play victory bow animation.
   */
  playVictory() {
    this.play('mozart_victory');
  }

  hit(damageSource) {
    if (this.isInvincible || this.isDead) return;

    // Difficulty-based damage reduction (early levels are forgiving)
    const damageMultiplier = this.scene.difficulty?.enemyDamageMultiplier ?? 1.0;
    if (damageMultiplier < 1.0 && Math.random() > damageMultiplier) {
      // Damage resisted - still show feedback but don't lose a life
      this.isInvincible = true;
      SFXGenerator.play(this.scene, 'sfx_takeDamage', 0.15);
      this.scene.cameras.main.shake(80, 0.002);
      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 80,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.alpha = 1;
          this.isInvincible = false;
        }
      });
      return;
    }

    this.isInvincible = true;

    // Play damage animation (wig askew, stagger)
    this.play('mozart_damage');

    const lives = this.scene.registry.get('lives') - 1;
    this.scene.registry.set('lives', lives);

    if (lives <= 0) {
      this.die();
      return;
    }

    // Hit feedback
    SFXGenerator.play(this.scene, 'sfx_takeDamage', 0.3);

    // Screen shake on damage
    this.scene.cameras.main.shake(150, 0.005);

    // Knockback away from damage source
    let knockbackDir = this.flipX ? 1 : -1;
    if (damageSource && damageSource.x !== undefined) {
      knockbackDir = this.x < damageSource.x ? -1 : 1;
    }
    this.setVelocity(PLAYER.KNOCKBACK_X * knockbackDir, PLAYER.KNOCKBACK_Y);
    this.currentVelocityX = PLAYER.KNOCKBACK_X * knockbackDir;

    // If there's a checkpoint, respawn there
    if (this.scene.lastCheckpoint) {
      this.isDead = true;

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
    SFXGenerator.play(this.scene, 'sfx_takeDamage', 0.35);

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

