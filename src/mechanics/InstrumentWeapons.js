// @ts-check
import Phaser from 'phaser';

/**
 * Weapon definitions for each instrument collected across levels.
 * Each weapon has unique attack behavior, cooldown, and effects.
 */
const WEAPON_DEFS = {
  violin: {
    name: 'Violin',
    level: 1,
    key: '1',
    damage: 2,
    cooldown: 400,
    range: 60,
    color: 0xFF8844,
    description: 'Short-range arc slash',
    icon: '🎻'
  },
  flute: {
    name: 'Flute',
    level: 2,
    key: '2',
    damage: 1.5,
    cooldown: 600,
    range: 300,
    color: 0x88CCFF,
    description: 'Horizontal projectile with pushback',
    icon: '🎵'
  },
  frenchhorn: {
    name: 'French Horn',
    level: 3,
    key: '3',
    damage: 1,
    cooldown: 1200,
    range: 100,
    stunDuration: 1500,
    color: 0xFFDD44,
    description: 'Cone stun',
    icon: '📯'
  },
  piano: {
    name: 'Piano',
    level: 4,
    key: '4',
    damage: 4,
    cooldown: 2000,
    range: 150,
    color: 0xFFFFFF,
    description: 'Area rain of keys from above',
    icon: '🎹'
  },
  clarinet: {
    name: 'Clarinet',
    level: 5,
    key: '5',
    damage: 0,
    cooldown: 3000,
    range: 120,
    charmDuration: 5000,
    color: 0xAA44FF,
    description: 'Charms enemy to fight for Mozart',
    icon: '🎶'
  },
  timpani: {
    name: 'Timpani',
    level: 6,
    key: '6',
    damage: 3,
    cooldown: 1500,
    range: 200,
    color: 0xFF4444,
    description: 'Ground shockwave hitting all grounded enemies',
    icon: '🥁'
  }
};

// Map level numbers to weapon keys for unlocking
const LEVEL_TO_WEAPON = {
  1: 'violin',
  2: 'flute',
  3: 'frenchhorn',
  4: 'piano',
  5: 'clarinet',
  6: 'timpani'
};

export { WEAPON_DEFS, LEVEL_TO_WEAPON };

/**
 * InstrumentWeapons manages the weapon system for Mozart.
 * Weapons are unlocked by completing levels. Each weapon has a unique attack.
 */
export class InstrumentWeapons {
  /**
   * @param {Phaser.Scene} scene - The current game scene
   * @param {import('../sprites/Mozart.js').Mozart} player - The player sprite
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.currentWeapon = null;
    this.weapons = {}; // unlocked weapons with cooldown state
    this.cooldowns = {}; // remaining cooldown per weapon key

    // Projectile group for flute and piano attacks
    this.projectiles = scene.physics.add.group();

    // Input keys for weapon switching (1-6)
    this.switchKeys = {};
    for (let i = 1; i <= 6; i++) {
      this.switchKeys[i] = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes[`ONE`].valueOf() + (i - 1)
      );
    }
    // Correct key code mapping
    this.switchKeys = {
      1: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      2: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      3: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      4: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      5: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
      6: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX)
    };

    // Attack key (Q key)
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Initialize available weapons from registry
    this.refreshAvailableWeapons();

    // HUD elements
    this.hudIcons = [];
    this.hudCooldownBars = [];
    this.createHUD();
  }

  /**
   * Refresh which weapons are available based on completedLevels registry.
   */
  refreshAvailableWeapons() {
    const completedLevels = this.scene.registry.get('completedLevels') || [];
    this.weapons = {};

    for (const [level, weaponKey] of Object.entries(LEVEL_TO_WEAPON)) {
      if (completedLevels.includes(Number(level))) {
        this.weapons[weaponKey] = WEAPON_DEFS[weaponKey];
        if (this.cooldowns[weaponKey] === undefined) {
          this.cooldowns[weaponKey] = 0;
        }
      }
    }

    // Auto-select first available weapon if none selected
    if (!this.currentWeapon || !this.weapons[this.currentWeapon]) {
      const available = Object.keys(this.weapons);
      this.currentWeapon = available.length > 0 ? available[0] : null;
    }
  }

  createHUD() {
    const startX = 180;
    const y = 18;
    const spacing = 30;

    for (let i = 0; i < 6; i++) {
      const weaponKey = LEVEL_TO_WEAPON[i + 1];
      const def = WEAPON_DEFS[weaponKey];

      // Background slot
      const bg = this.scene.add.rectangle(startX + i * spacing, y, 24, 24, 0x222222, 0.7)
        .setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0x555555);

      // Icon text
      const icon = this.scene.add.text(startX + i * spacing, y, def.icon, {
        font: '12px monospace'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0.3);

      // Key number
      this.scene.add.text(startX + i * spacing - 10, y - 10, `${i + 1}`, {
        font: '8px monospace',
        fill: '#888888'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      // Cooldown overlay
      const cdBar = this.scene.add.rectangle(startX + i * spacing, y + 12, 22, 3, 0x44FF44, 0)
        .setScrollFactor(0).setDepth(102).setOrigin(0.5);

      this.hudIcons.push({ bg, icon, weaponKey });
      this.hudCooldownBars.push(cdBar);
    }
  }

  updateHUD() {
    for (let i = 0; i < this.hudIcons.length; i++) {
      const { bg, icon, weaponKey } = this.hudIcons[i];
      const isAvailable = !!this.weapons[weaponKey];
      const isSelected = this.currentWeapon === weaponKey;

      icon.setAlpha(isAvailable ? 1 : 0.3);
      bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xFFD700 : 0x555555);
      bg.setFillStyle(isSelected ? 0x444400 : 0x222222, 0.7);

      // Cooldown bar
      const cdBar = this.hudCooldownBars[i];
      if (isAvailable && this.cooldowns[weaponKey] > 0) {
        const def = WEAPON_DEFS[weaponKey];
        const ratio = 1 - (this.cooldowns[weaponKey] / def.cooldown);
        cdBar.setSize(22 * ratio, 3);
        cdBar.setAlpha(1);
        cdBar.setFillStyle(0xFF4444);
      } else if (isAvailable) {
        cdBar.setSize(22, 3);
        cdBar.setAlpha(0.6);
        cdBar.setFillStyle(0x44FF44);
      } else {
        cdBar.setAlpha(0);
      }
    }
  }

  /**
   * Update weapon cooldowns, handle input, and manage projectiles.
   * @param {number} time - Current game time in ms
   * @param {number} delta - Time elapsed since last frame in ms
   */
  update(time, delta) {
    if (this.player.isDead) return;

    const dt = delta || 16;

    // Decrease cooldowns
    for (const key of Object.keys(this.cooldowns)) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      }
    }

    // Handle weapon switching
    for (let i = 1; i <= 6; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.switchKeys[i])) {
        const weaponKey = LEVEL_TO_WEAPON[i];
        if (this.weapons[weaponKey]) {
          this.currentWeapon = weaponKey;
        }
      }
    }

    // Handle attack input
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.attack();
    }

    // Update projectiles (remove off-screen)
    this.projectiles.getChildren().forEach(proj => {
      if (proj.x < this.scene.cameras.main.scrollX - 100 ||
          proj.x > this.scene.cameras.main.scrollX + 900 ||
          proj.y < -100 || proj.y > 600) {
        proj.destroy();
      }
    });

    this.updateHUD();
  }

  /**
   * Execute the current weapon's attack if off cooldown.
   */
  attack() {
    if (!this.currentWeapon) return;
    if (this.cooldowns[this.currentWeapon] > 0) return;

    const def = WEAPON_DEFS[this.currentWeapon];
    this.cooldowns[this.currentWeapon] = def.cooldown;

    switch (this.currentWeapon) {
      case 'violin': this.attackViolin(def); break;
      case 'flute': this.attackFlute(def); break;
      case 'frenchhorn': this.attackFrenchHorn(def); break;
      case 'piano': this.attackPiano(def); break;
      case 'clarinet': this.attackClarinet(def); break;
      case 'timpani': this.attackTimpani(def); break;
    }
  }

  /**
   * Violin: Short-range arc slash, medium damage, fast cooldown
   */
  attackViolin(def) {
    const facingRight = !this.player.flipX;
    const cx = this.player.x + (facingRight ? 20 : -20);
    const cy = this.player.y - 5;

    // Visual arc slash
    const arc = this.scene.add.arc(cx, cy, def.range, facingRight ? -60 : 120, facingRight ? 60 : 240, false, def.color, 0.6)
      .setDepth(50);

    this.scene.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      onComplete: () => arc.destroy()
    });

    // Damage enemies in arc range
    this.damageEnemiesInRange(cx, cy, def.range, def.damage, facingRight, 90);

    this.playWeaponSound(440, 0.1);
  }

  /**
   * Flute: Horizontal projectile, pushes enemies back
   */
  attackFlute(def) {
    const facingRight = !this.player.flipX;
    const x = this.player.x + (facingRight ? 16 : -16);
    const y = this.player.y - 4;

    const proj = this.scene.physics.add.sprite(x, y, 'weaponFlute');
    proj.body.setAllowGravity(false);
    proj.setDisplaySize(18, 10);
    proj.setTint(def.color);
    this.projectiles.add(proj);

    proj.weaponData = {
      damage: def.damage,
      effect: 'pushback',
      pushForce: 250
    };

    const speed = 350;
    proj.setVelocityX(facingRight ? speed : -speed);

    // Trail effect
    this.addTrail(proj, def.color);

    // Auto-destroy after 2s
    this.scene.time.delayedCall(2000, () => {
      if (proj.active) proj.destroy();
    });

    this.playWeaponSound(880, 0.15);
  }

  /**
   * French Horn: Cone stun (1.5s freeze), low damage
   */
  attackFrenchHorn(def) {
    const facingRight = !this.player.flipX;
    const cx = this.player.x + (facingRight ? 15 : -15);
    const cy = this.player.y;

    // Visual cone effect
    const cone = this.scene.add.triangle(
      cx + (facingRight ? 40 : -40), cy,
      0, -30,
      0, 30,
      facingRight ? 60 : -60, 0,
      def.color, 0.4
    ).setDepth(50);

    this.scene.tweens.add({
      targets: cone,
      alpha: 0,
      duration: 400,
      onComplete: () => cone.destroy()
    });

    // Stun enemies in cone area
    if (this.scene.enemies) {
      this.scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const dx = enemy.x - this.player.x;
        const dy = Math.abs(enemy.y - this.player.y);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check if in cone direction and range
        const inDirection = facingRight ? dx > 0 : dx < 0;
        if (inDirection && dist < def.range && dy < 50) {
          this.stunEnemy(enemy, def.stunDuration);
          this.damageEnemy(enemy, def.damage);
        }
      });
    }

    this.playWeaponSound(220, 0.2);
  }

  /**
   * Piano: Area rain of keys from above, high damage, slow cooldown
   */
  attackPiano(def) {
    const cx = this.player.x;
    const startY = this.scene.cameras.main.scrollY + 20;

    // Rain 5 keys over an area
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const kx = cx + Phaser.Math.Between(-def.range, def.range);
        const key = this.scene.physics.add.sprite(kx, startY, 'weaponPianoKey');
        key.setDisplaySize(12, 20);
        key.setTint(i % 2 === 0 ? 0xFFFFFF : 0x222222);
        key.body.setAllowGravity(true);
        key.body.setGravityY(600);
        this.projectiles.add(key);

        key.weaponData = {
          damage: def.damage,
          effect: 'impact'
        };

        // Destroy when hitting ground level
        this.scene.time.delayedCall(2000, () => {
          if (key.active) {
            this.createImpactEffect(key.x, key.y, def.color);
            key.destroy();
          }
        });
      });
    }

    this.playWeaponSound(523, 0.15);
  }

  /**
   * Clarinet: Charms nearest enemy to fight for Mozart (5s)
   */
  attackClarinet(def) {
    if (!this.scene.enemies) return;

    let nearest = null;
    let nearestDist = def.range;

    this.scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.isCharmed) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    });

    if (nearest) {
      this.charmEnemy(nearest, def.charmDuration);

      // Visual charm effect
      const heart = this.scene.add.text(nearest.x, nearest.y - 30, '💜', {
        font: '16px monospace'
      }).setOrigin(0.5).setDepth(150);

      this.scene.tweens.add({
        targets: heart,
        y: heart.y - 20,
        alpha: 0,
        duration: 1000,
        onComplete: () => heart.destroy()
      });
    }

    this.playWeaponSound(660, 0.12);
  }

  /**
   * Timpani: Ground shockwave hitting all grounded enemies
   */
  attackTimpani(def) {
    const px = this.player.x;
    const groundY = this.player.y + this.player.height / 2;

    // Expanding shockwave ring visual
    const ring = this.scene.add.circle(px, groundY, 10, def.color, 0.5)
      .setDepth(50);

    this.scene.tweens.add({
      targets: ring,
      radius: def.range,
      alpha: 0,
      duration: 500,
      onUpdate: () => {
        ring.setRadius(ring.radius || 10);
      },
      onComplete: () => ring.destroy()
    });

    // Camera shake
    this.scene.cameras.main.shake(100, 0.003);

    // Damage all grounded enemies in range
    if (this.scene.enemies) {
      this.scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        // Only hit grounded enemies
        const isGrounded = enemy.body && (enemy.body.blocked.down || enemy.body.touching.down);
        if (!isGrounded) return;

        const dist = Math.abs(enemy.x - px);
        if (dist < def.range) {
          this.damageEnemy(enemy, def.damage);
          // Knock up
          if (enemy.body) {
            enemy.setVelocityY(-200);
          }
        }
      });
    }

    this.playWeaponSound(110, 0.25);
  }

  // --- Helper methods ---

  /**
   * Damage all enemies within an arc range from a center point.
   * @param {number} cx - Center X position
   * @param {number} cy - Center Y position
   * @param {number} range - Maximum distance in pixels
   * @param {number} damage - Damage to apply
   * @param {boolean} facingRight - Whether the attack faces right
   * @param {number} angleDeg - Arc angle in degrees
   */
  damageEnemiesInRange(cx, cy, range, damage, facingRight, angleDeg) {
    if (!this.scene.enemies) return;

    this.scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dx = enemy.x - cx;
      const dy = enemy.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > range) return;

      // Check direction for arc attacks
      if (facingRight && dx < -10) return;
      if (!facingRight && dx > 10) return;

      this.damageEnemy(enemy, damage);
    });
  }

  /**
   * Apply damage to a single enemy and destroy it if health depletes.
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy sprite
   * @param {number} damage - Amount of damage to deal
   */
  damageEnemy(enemy, damage) {
    if (!enemy.active) return;
    if (enemy.health === undefined) enemy.health = 3;

    enemy.health -= damage;
    enemy.setTint(0xFFFFFF);
    this.scene.time.delayedCall(100, () => {
      if (enemy.active && !enemy.isStunned && !enemy.isCharmed) enemy.clearTint();
    });

    if (enemy.health <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  /**
   * Destroy an enemy with particle effects and score reward.
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy to destroy
   */
  destroyEnemy(enemy) {
    if (this.scene.particles) {
      this.scene.particles.emitStomp(enemy.x, enemy.y);
    }

    const score = this.scene.registry.get('score') + 100;
    this.scene.registry.set('score', score);

    if (this.scene.sound && this.scene.sound.get('sfx_coin')) {
      this.scene.sound.play('sfx_coin', { volume: 0.2 });
    }

    enemy.destroy();
  }

  /**
   * Stun an enemy for the specified duration.
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy to stun
   * @param {number} duration - Stun duration in milliseconds
   */
  stunEnemy(enemy, duration) {
    if (enemy.isStunned) return;
    enemy.isStunned = true;
    const originalSpeed = enemy.speed || 0;
    enemy.speed = 0;
    if (enemy.body) enemy.setVelocity(0, enemy.body.velocity.y);

    enemy.setTint(0xFFDD44);

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.isStunned = false;
        enemy.speed = originalSpeed;
        enemy.clearTint();
      }
    });
  }

  /**
   * Charm an enemy to fight on Mozart's side for the specified duration.
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy to charm
   * @param {number} duration - Charm duration in milliseconds
   */
  charmEnemy(enemy, duration) {
    enemy.isCharmed = true;
    const originalSpeed = enemy.speed || 60;
    enemy.setTint(0xAA44FF);

    // Charmed enemy moves toward other enemies
    const charmTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        if (!enemy.active || !enemy.isCharmed) {
          charmTimer.remove();
          return;
        }
        // Find nearest non-charmed enemy and move toward it
        let target = null;
        let minDist = 200;
        if (this.scene.enemies) {
          this.scene.enemies.getChildren().forEach(other => {
            if (other === enemy || !other.active || other.isCharmed) return;
            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
            if (d < minDist) {
              target = other;
              minDist = d;
            }
          });
        }
        if (target && enemy.body) {
          const dir = target.x > enemy.x ? 1 : -1;
          enemy.setVelocityX(dir * originalSpeed * 1.5);
          // Damage on contact
          if (minDist < 30) {
            this.damageEnemy(target, 1);
          }
        }
      },
      loop: true
    });

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.isCharmed = false;
        enemy.speed = originalSpeed;
        enemy.clearTint();
        charmTimer.remove();
      }
    });
  }

  addTrail(proj, color) {
    const trailEvent = this.scene.time.addEvent({
      delay: 60,
      callback: () => {
        if (!proj.active) {
          trailEvent.remove();
          return;
        }
        const trail = this.scene.add.circle(proj.x, proj.y, 3, color, 0.5)
          .setDepth(49);
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 250,
          onComplete: () => trail.destroy()
        });
      },
      loop: true
    });
  }

  createImpactEffect(x, y, color) {
    const impact = this.scene.add.circle(x, y, 5, color, 0.7).setDepth(50);
    this.scene.tweens.add({
      targets: impact,
      radius: 20,
      alpha: 0,
      duration: 300,
      onComplete: () => impact.destroy()
    });
  }

  playWeaponSound(freq, duration) {
    if (!this.scene.sound || !this.scene.sound.context) return;
    try {
      const ctx = this.scene.sound.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.value = 0.12;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context may not be available
    }
  }

  /**
   * Handle projectile hitting an enemy (called by scene overlap handler).
   * @param {Phaser.Physics.Arcade.Sprite} enemy - The enemy hit
   * @param {Phaser.Physics.Arcade.Sprite} projectile - The projectile that hit
   */
  handleProjectileHit(enemy, projectile) {
    if (!projectile.active || !enemy.active) return;
    if (!projectile.weaponData) return;

    const { damage, effect, pushForce } = projectile.weaponData;
    this.damageEnemy(enemy, damage);

    if (effect === 'pushback' && enemy.body) {
      const dir = enemy.x > this.player.x ? 1 : -1;
      enemy.setVelocityX(dir * (pushForce || 200));
      enemy.setVelocityY(-80);
    }

    projectile.destroy();
  }

  /**
   * Set up overlap detection between weapon projectiles and enemy group.
   * @param {Phaser.Physics.Arcade.Group} enemyGroup - The group of enemies to check collisions against
   */
  setupCollision(enemyGroup) {
    this.scene.physics.add.overlap(
      this.projectiles,
      enemyGroup,
      (proj, enemy) => this.handleProjectileHit(enemy, proj),
      null,
      this
    );
  }

  destroy() {
    this.projectiles.destroy(true);
    this.hudIcons.forEach(({ bg, icon }) => {
      bg.destroy();
      icon.destroy();
    });
    this.hudCooldownBars.forEach(bar => bar.destroy());
  }
}
