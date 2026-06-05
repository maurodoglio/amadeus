import Phaser from 'phaser';
import { SFXGenerator } from '../utils/SFXGenerator.js';

// Note definitions with pitch, color, and display
const NOTES = {
  C4: { name: 'C4', color: 0xFF4444, colorHex: '#FF4444', semitone: 0 },
  E4: { name: 'E4', color: 0xFFDD44, colorHex: '#FFDD44', semitone: 4 },
  G4: { name: 'G4', color: 0x4488FF, colorHex: '#4488FF', semitone: 7 },
  C5: { name: 'C5', color: 0xFF6688, colorHex: '#FF6688', semitone: 12 },
  Fs4: { name: 'F#4', color: 0x884488, colorHex: '#884488', semitone: 6 } // tritone
};

// Interval detection results
const INTERVALS = {
  UNISON: { name: 'Unison', damage: 1, effect: 'basic' },
  MAJOR_THIRD: { name: 'Harmony Beam', damage: 2, effect: 'pierce' },
  PERFECT_FIFTH: { name: 'Power Chord', damage: 3, effect: 'knockback' },
  OCTAVE: { name: 'Resonance Blast', damage: 3, effect: 'area' },
  TRITONE: { name: 'Dissonance', damage: 1, effect: 'stun' },
  TRIAD: { name: 'Chord Burst', damage: 5, effect: 'screen_clear', energyCost: 50 }
};

/**
 * Musical combat system for Mozart.
 * Tracks notes played, detects intervals, and spawns projectiles.
 */
export class MusicalCombat {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Energy system
    this.energy = 100;
    this.maxEnergy = 100;

    // Note history for interval detection (last 3 notes within 1 second)
    this.noteHistory = [];
    this.historyWindow = 1000; // 1 second window

    // Projectile group
    this.projectiles = scene.physics.add.group();

    // Attack cooldown
    this.canAttack = true;
    this.attackCooldown = 250; // ms between attacks

    // Input keys
    this.attackKey1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.attackKey2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Energy bar graphics
    this.energyBarBg = scene.add.rectangle(70, 18, 104, 10, 0x333333)
      .setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
    this.energyBarFill = scene.add.rectangle(72, 18, 100, 6, 0x44DDFF)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
    this.energyLabel = scene.add.text(20, 18, '♪', {
      font: '12px monospace', fill: '#44DDFF'
    }).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
  }

  update(time) {
    if (this.player.isDead) return;

    // Check attack input
    if (Phaser.Input.Keyboard.JustDown(this.attackKey1) ||
        Phaser.Input.Keyboard.JustDown(this.attackKey2)) {
      this.performAttack(time);
    }

    // Clean up old note history
    this.noteHistory = this.noteHistory.filter(n => time - n.time < this.historyWindow);

    // Update energy bar
    const fillWidth = (this.energy / this.maxEnergy) * 100;
    this.energyBarFill.setSize(fillWidth, 6);

    // Update projectiles (remove off-screen)
    this.projectiles.getChildren().forEach(proj => {
      if (proj.x < this.scene.cameras.main.scrollX - 50 ||
          proj.x > this.scene.cameras.main.scrollX + 850 ||
          proj.y < -50 || proj.y > 530) {
        proj.destroy();
      }
    });
  }

  performAttack(time) {
    if (!this.canAttack) return;

    // Determine which note based on direction held
    const cursors = this.player.cursors;
    let note;
    if (cursors.up.isDown) {
      note = NOTES.E4;
    } else if (cursors.down.isDown) {
      note = NOTES.G4;
    } else {
      note = NOTES.C4;
    }

    // Record note in history
    this.noteHistory.push({ note, time });

    // Detect interval from recent notes
    const interval = this.detectInterval(time);

    // Handle triad (screen clear) - costs energy
    if (interval === INTERVALS.TRIAD) {
      if (this.energy >= interval.energyCost) {
        this.energy -= interval.energyCost;
        this.fireChordBurst();
      } else {
        // Not enough energy, fire basic note instead
        this.fireProjectile(note, INTERVALS.UNISON);
      }
    } else if (interval) {
      this.fireProjectile(note, interval);
    } else {
      this.fireProjectile(note, INTERVALS.UNISON);
    }

    // Attack cooldown
    this.canAttack = false;
    this.scene.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }

  detectInterval(time) {
    const recent = this.noteHistory.filter(n => time - n.time < this.historyWindow);
    if (recent.length < 2) return null;

    // Check for triad (C+E+G all within window)
    const hasC = recent.some(n => n.note === NOTES.C4);
    const hasE = recent.some(n => n.note === NOTES.E4);
    const hasG = recent.some(n => n.note === NOTES.G4);
    if (hasC && hasE && hasG && recent.length >= 3) {
      return INTERVALS.TRIAD;
    }

    // Check last two notes for interval
    const last = recent[recent.length - 1].note;
    const prev = recent[recent.length - 2].note;

    const semitoneGap = Math.abs(last.semitone - prev.semitone);

    if (semitoneGap === 0) return INTERVALS.UNISON;
    if (semitoneGap === 4) return INTERVALS.MAJOR_THIRD;
    if (semitoneGap === 7) return INTERVALS.PERFECT_FIFTH;
    if (semitoneGap === 12) return INTERVALS.OCTAVE;
    if (semitoneGap === 6) return INTERVALS.TRITONE;

    return null;
  }

  fireProjectile(note, interval) {
    const facingRight = !this.player.flipX;
    const x = this.player.x + (facingRight ? 16 : -16);
    const y = this.player.y - 4;

    SFXGenerator.play(this.scene, 'sfx_attack', 0.2);

    const proj = this.scene.physics.add.sprite(x, y, 'noteProjectile');
    proj.body.setAllowGravity(false);
    proj.setDisplaySize(16, 16);
    this.projectiles.add(proj);

    // Set projectile properties
    proj.noteData = note;
    proj.interval = interval;
    proj.damage = interval.damage;
    proj.effect = interval.effect;

    const speed = 300;
    const vx = facingRight ? speed : -speed;
    proj.setVelocity(vx, 0);
    proj.setTint(note.color);

    // Pierce effect: projectile doesn't get destroyed on first hit
    proj.piercing = interval.effect === 'pierce';

    // Add trail effect
    this.addProjectileTrail(proj, note);

    // Area effect for octave: create expanding blast at player position
    if (interval.effect === 'area') {
      this.fireAreaBlast(x, y, interval);
    }

    // Stun effect for tritone: applies to all enemies in range
    if (interval.effect === 'stun') {
      this.applyStunNearby();
    }

    // Destroy after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (proj.active) proj.destroy();
    });

    // Play note sound
    this.playNoteSound(note);

    // Show interval name briefly
    if (interval !== INTERVALS.UNISON) {
      this.showIntervalText(interval.name, note.colorHex);
    }
  }

  fireAreaBlast(x, y, interval) {
    // Create expanding circle effect
    const blast = this.scene.add.circle(x, y, 10, 0xFF6688, 0.5).setDepth(50);
    this.scene.tweens.add({
      targets: blast,
      radius: 80,
      alpha: 0,
      duration: 500,
      onUpdate: () => {
        blast.setRadius(blast.radius || 10);
      },
      onComplete: () => blast.destroy()
    });

    // Damage enemies in radius
    if (this.scene.enemies) {
      this.scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (dist < 80) {
          this.damageEnemy(enemy, interval.damage, interval);
        }
      });
    }
  }

  applyStunNearby() {
    if (!this.scene.enemies) return;
    const range = 120;
    this.scene.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist < range) {
        this.stunEnemy(enemy, 2000);
      }
    });
  }

  stunEnemy(enemy, duration) {
    if (enemy.isStunned) return;
    enemy.isStunned = true;
    const originalSpeed = enemy.speed || 0;
    enemy.speed = 0;
    if (enemy.body) enemy.setVelocity(0, enemy.body.velocity.y);

    // Visual stun indicator
    enemy.setTint(0x884488);

    this.scene.time.delayedCall(duration, () => {
      if (enemy.active) {
        enemy.isStunned = false;
        enemy.speed = originalSpeed;
        enemy.clearTint();
      }
    });
  }

  fireChordBurst() {
    // Screen-clearing chord burst
    const cam = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      cam.scrollX + 400, cam.scrollY + 240, 800, 480, 0xFFFFFF, 0.6
    ).setDepth(200);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy()
    });

    // Destroy all on-screen enemies
    if (this.scene.enemies) {
      this.scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const ex = enemy.x;
        const ey = enemy.y;
        if (ex > cam.scrollX - 50 && ex < cam.scrollX + 850 &&
            ey > cam.scrollY - 50 && ey < cam.scrollY + 530) {
          this.damageEnemy(enemy, INTERVALS.TRIAD.damage, INTERVALS.TRIAD);
        }
      });
    }

    this.showIntervalText('Chord Burst!', '#FFFFFF');
  }

  addProjectileTrail(proj, note) {
    // Create particle trail using timed events
    const trailEvent = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!proj.active) {
          trailEvent.remove();
          return;
        }
        const trail = this.scene.add.circle(proj.x, proj.y, 3, note.color, 0.6)
          .setDepth(49);
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 300,
          onComplete: () => trail.destroy()
        });
      },
      loop: true
    });
  }

  playNoteSound(note) {
    // Use Web Audio to play the note frequency
    if (!this.scene.sound.context) return;
    try {
      const ctx = this.scene.sound.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Map notes to frequencies
      const freqMap = {
        C4: 261.63, E4: 329.63, G4: 392.00, C5: 523.25, 'F#4': 369.99
      };
      osc.frequency.value = freqMap[note.name] || 261.63;
      osc.type = 'sine';
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context may not be available
    }
  }

  showIntervalText(text, color) {
    const label = this.scene.add.text(this.player.x, this.player.y - 40, text, {
      font: '10px monospace',
      fill: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(150);

    this.scene.tweens.add({
      targets: label,
      y: label.y - 20,
      alpha: 0,
      duration: 800,
      onComplete: () => label.destroy()
    });
  }

  /**
   * Handle projectile hitting an enemy. Called by scene overlap handler.
   */
  handleProjectileHit(enemy, projectile) {
    if (!projectile.active || !enemy.active) return;

    const interval = projectile.interval;
    let damage = projectile.damage;

    // Apply enemy weakness multipliers
    damage = this.applyWeakness(enemy, interval, damage);

    this.damageEnemy(enemy, damage, interval);

    // Knockback effect
    if (interval.effect === 'knockback' && enemy.body) {
      const dir = enemy.x > this.player.x ? 1 : -1;
      enemy.setVelocityX(dir * 200);
      enemy.setVelocityY(-100);
    }

    // Destroy projectile unless it's piercing
    if (!projectile.piercing) {
      projectile.destroy();
    }
  }

  applyWeakness(enemy, interval, baseDamage) {
    // Singer: weak to harmony (thirds)
    if (enemy.constructor.name === 'Singer' && interval === INTERVALS.MAJOR_THIRD) {
      return baseDamage * 2;
    }
    // DrumTroll: weak to quick successive hits
    if (enemy.constructor.name === 'DrumTroll' && interval === INTERVALS.UNISON) {
      return baseDamage * 2;
    }
    // DissonantNote: weak to consonance (fifths, octaves)
    if (enemy.constructor.name === 'DissonantNote' &&
        (interval === INTERVALS.PERFECT_FIFTH || interval === INTERVALS.OCTAVE)) {
      return baseDamage * 2;
    }
    return baseDamage;
  }

  damageEnemy(enemy, damage, interval) {
    if (!enemy.active) return;

    // Initialize health if not set
    if (enemy.health === undefined) {
      enemy.health = 3;
    }

    enemy.health -= damage;

    // Hit flash
    enemy.setTint(0xFFFFFF);
    this.scene.time.delayedCall(100, () => {
      if (enemy.active && !enemy.isStunned) enemy.clearTint();
    });

    if (enemy.health <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  destroyEnemy(enemy) {
    // Particle burst
    if (this.scene.particles) {
      this.scene.particles.emitStomp(enemy.x, enemy.y);
    }

    // Award score
    const score = this.scene.registry.get('score') + 100;
    this.scene.registry.set('score', score);

    // Refill energy on kill
    this.addEnergy(10);

    // Remove from scene arrays
    if (this.scene.singers) {
      this.scene.singers = this.scene.singers.filter(s => s !== enemy);
    }
    if (this.scene.notes) {
      this.scene.notes = this.scene.notes.filter(n => n !== enemy);
    }

    if (this.scene.sound && this.scene.sound.get('sfx_coin')) {
      this.scene.sound.play('sfx_coin', { volume: 0.2 });
    }

    enemy.destroy();
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  /**
   * Set up collision between projectiles and enemy group in scene.
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
    if (this.energyBarBg) this.energyBarBg.destroy();
    if (this.energyBarFill) this.energyBarFill.destroy();
    if (this.energyLabel) this.energyLabel.destroy();
  }
}
