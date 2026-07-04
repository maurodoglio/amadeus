import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Boss phase definitions for each level's multi-phase boss fight.
 * Each phase has: hp, attackInterval, update function, and description.
 */

/**
 * Level 1: Leopold Mozart — 2 phases
 * Phase 1: Dodge sheet music projectiles
 * Phase 2: Hit during conduct pauses (vulnerability windows)
 */
export function getLeopoldPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 100;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.6),
      name: 'Conducting Fury',
      update(manager, time) {
        // Simple movement toward player — no projectiles (tutorial boss)
        manager.moveTowardTarget(baseSpeed * 0.7);

        // Boss is always vulnerable in phase 1 (tutorial boss)
        manager.isVulnerable = true;
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.4),
      name: 'Grand Finale',
      update(manager, time) {
        const boss = manager.boss;

        // Slightly faster movement, still no projectiles
        manager.moveTowardTarget(baseSpeed);

        // Brief pauses with vulnerability windows
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2500;
          // Conduct pause — vulnerability window
          manager.scene.time.delayedCall(800, () => {
            if (!boss || !boss.body || manager.isDefeated) return;
            boss.setVelocityX(0);
            manager.openVulnerability(2000);
          });
        }
      }
    }
  ];
}

/**
 * Level 2: Empress Maria Theresa — 3 phases
 * Phase 1: Dodge guards (projectiles from sides)
 * Phase 2: Dodge coins (falling from above)
 * Phase 3: Dodge chandelier + return coins to hit boss
 */
export function getMariaTheresaPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 100;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.4),
      name: 'Royal Guard',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 0.8);

        // Guards charge from the sides as projectiles
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2500;
          const boss = manager.boss;
          const proj = manager.projectiles.create(
            boss.x > GAME_WIDTH / 2 ? 50 : GAME_WIDTH - 50,
            GAME_HEIGHT - 100, 'bossGuardProjectile'
          );
          if (proj) {
            proj.body.setAllowGravity(false);
            const dir = boss.x > GAME_WIDTH / 2 ? 1 : -1;
            proj.setVelocityX(180 * dir);
            manager.scene.time.delayedCall(4000, () => { if (proj.active) proj.destroy(); });
          }
        }

        // Periodically vulnerable
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 4000;
          manager.openVulnerability(1500);
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Imperial Coins',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed);

        // Coins fall from above
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 1800;
          const target = manager.getTarget();
          const coinX = target.x + Phaser.Math.Between(-60, 60);
          const coin = manager.projectiles.create(coinX, 30, 'bossCoinProjectile');
          if (coin) {
            coin.body.setAllowGravity(false);
            coin.setVelocityY(200);
            manager.scene.time.delayedCall(3000, () => { if (coin.active) coin.destroy(); });
          }
        }

        // Vulnerable after catching falling coins (simulated by timer)
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 5000;
          manager.scene.time.delayedCall(2000, () => {
            manager.openVulnerability(1800);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Chandelier Crash',
      update(manager, time) {
        const boss = manager.boss;
        boss.setVelocityX(0);

        // Chandelier falls periodically at player position
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 3000;
          const target = manager.getTarget();
          // Warning indicator
          const warning = manager.scene.add.text(target.x, 30, '⚠', {
            font: '24px serif', fill: '#FF0000'
          }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

          manager.scene.time.delayedCall(800, () => {
            warning.destroy();
            const chandelier = manager.projectiles.create(target.x, 50, 'bossChandelierProjectile');
            if (chandelier) {
              chandelier.body.setAllowGravity(false);
              chandelier.setVelocityY(250);
              chandelier.setScale(2);
              manager.scene.time.delayedCall(2000, () => { if (chandelier.active) chandelier.destroy(); });
            }
          });

          // Vulnerability after chandelier crashes
          manager.scene.time.delayedCall(1500, () => {
            manager.openVulnerability(2000);
          });
        }
      }
    }
  ];
}

/**
 * Level 3: Archbishop Colloredo — 3 phases
 * Phase 1: Jump over shockwaves
 * Phase 2: Survive disappearing platforms
 * Phase 3: Hit during stumble (boss trips on chains)
 */
export function getColloredoPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 120;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Chain of Command',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed);

        // Ground shockwaves
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2000;
          manager.fireShockwave(200, 1);
          manager.fireShockwave(200, -1);
        }

        // Vulnerable after jumping
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 5000;
          manager.jump(-400);
          manager.scene.time.delayedCall(1200, () => {
            manager.openVulnerability(1500);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Crumbling Authority',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 1.2);

        // Faster shockwaves
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 1500;
          manager.fireShockwave(250, 1);
          manager.scene.time.delayedCall(500, () => {
            manager.fireShockwave(250, -1);
          });
        }

        // Boss occasionally stumbles — vulnerability
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 6000;
          manager.boss.setVelocityX(0);
          manager.scene.time.delayedCall(1000, () => {
            manager.openVulnerability(1800);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Broken Chains',
      update(manager, time) {
        const boss = manager.boss;

        // Erratic movement
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 1200;
          // Triple shockwave
          manager.fireShockwave(280, 1);
          manager.fireShockwave(280, -1);
          manager.scene.time.delayedCall(400, () => {
            manager.fireShockwave(200, boss.flipX ? 1 : -1);
          });
        }

        manager.moveTowardTarget(baseSpeed * 0.9);

        // Stumbles frequently in final phase
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 4000;
          boss.setVelocityX(0);
          manager.openVulnerability(2000);
        }
      }
    }
  ];
}

/**
 * Level 4: Antonio Salieri — 3 phases
 * Phase 1: Rhythm duel (dodge timed notes)
 * Phase 2: Dodge ink blots
 * Phase 3: Both combined
 */
export function getSalieriPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 110;
  const projSpeed = difficulty.bossProjectileSpeed || 140;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Rhythm Duel',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed);

        // Fire notes in rhythmic pattern
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2400;
          // Rhythmic burst — 4 notes at even intervals
          for (let i = 0; i < 4; i++) {
            manager.scene.time.delayedCall(i * 400, () => {
              manager.fireProjectile(projSpeed, 'bossNoteProjectile');
            });
          }
          // Pause after rhythm — vulnerable
          manager.scene.time.delayedCall(1800, () => {
            manager.openVulnerability(1200);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Ink Storm',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 1.1);

        // Ink blots rain from above
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 1600;
          const target = manager.getTarget();
          for (let i = -1; i <= 1; i++) {
            const ink = manager.projectiles.create(
              target.x + i * 60, 20, 'bossInkProjectile'
            );
            if (ink) {
              ink.body.setAllowGravity(false);
              ink.setVelocityY(180);
              manager.scene.time.delayedCall(3000, () => { if (ink.active) ink.destroy(); });
            }
          }
        }

        // Vulnerable periodically
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 5000;
          manager.openVulnerability(1500);
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Crescendo Finale',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 1.3);

        // Combined: rhythmic notes AND ink
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2000;
          // Notes
          for (let i = 0; i < 3; i++) {
            manager.scene.time.delayedCall(i * 350, () => {
              manager.fireProjectile(projSpeed + 20, 'bossNoteProjectile');
            });
          }
          // Ink
          manager.scene.time.delayedCall(800, () => {
            const target = manager.getTarget();
            const ink = manager.projectiles.create(target.x, 20, 'bossInkProjectile');
            if (ink) {
              ink.body.setAllowGravity(false);
              ink.setVelocityY(200);
              manager.scene.time.delayedCall(3000, () => { if (ink.active) ink.destroy(); });
            }
          });

          // Brief vulnerability after combo attack
          manager.scene.time.delayedCall(1500, () => {
            if (!manager.boss || !manager.boss.body || manager.isDefeated) return;
            manager.boss.setVelocityX(0);
            manager.openVulnerability(1200);
          });
        }
      }
    }
  ];
}

/**
 * Level 5: Debt Collector (Clementi stand-in) — 3 phases
 * Phase 1: Dodge bills (projectiles)
 * Phase 2: Kill minions before they multiply
 * Phase 3: Rapid button sequence (timed hits)
 */
export function getDebtCollectorPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 100;
  const projSpeed = difficulty.bossProjectileSpeed || 130;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Mounting Debts',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed);

        // Throw bills (spread pattern)
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2200;
          const angles = [-0.3, 0, 0.3];
          const target = manager.getTarget();
          const baseAngle = Phaser.Math.Angle.Between(
            manager.boss.x, manager.boss.y, target.x, target.y
          );
          angles.forEach(offset => {
            const proj = manager.projectiles.create(
              manager.boss.x, manager.boss.y - 10, 'bossBillProjectile'
            );
            if (proj) {
              proj.body.setAllowGravity(false);
              const a = baseAngle + offset;
              proj.setVelocity(Math.cos(a) * projSpeed, Math.sin(a) * projSpeed);
              manager.scene.time.delayedCall(3500, () => { if (proj.active) proj.destroy(); });
            }
          });
        }

        // Vulnerable after throwing
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 4500;
          manager.openVulnerability(1500);
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Multiplying Creditors',
      update(manager, time) {
        const boss = manager.boss;
        boss.setVelocityX(0);

        // Spawn minions that must be killed quickly
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 4000;
          const side = Phaser.Math.Between(0, 1) ? -1 : 1;
          manager.spawnMinion(
            boss.x + side * 100,
            boss.y - 30,
            'bossMinion', 70
          );
        }

        // Boss is vulnerable while minions are spawning
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 5000;
          manager.openVulnerability(2000);
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Final Notice',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 1.4);

        // Rapid-fire bills
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 1500;
          manager.fireProjectile(projSpeed + 40, 'bossBillProjectile');
          manager.scene.time.delayedCall(300, () => {
            manager.fireProjectile(projSpeed + 20, 'bossBillProjectile');
          });
        }

        // Quick vulnerability windows
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 3500;
          manager.boss.setVelocityX(0);
          manager.openVulnerability(1000);
        }
      }
    }
  ];
}

/**
 * Level 6: Grey Messenger — 3 phases
 * Phase 1: Predict from shadow (appears briefly then teleports)
 * Phase 2: Destroy homing notes
 * Phase 3: Audio puzzle in dark (follow sound cues)
 */
export function getGreyMessengerPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 90;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Shadow Apparition',
      update(manager, time) {
        const boss = manager.boss;

        // Teleport pattern: appear briefly, then vanish
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 3000;
          // Fade out
          manager.scene.tweens.add({
            targets: boss, alpha: 0.2, duration: 300,
            onComplete: () => {
              // Teleport to random position near player
              const target = manager.getTarget();
              const newX = target.x + Phaser.Math.Between(-150, 150);
              boss.setPosition(
                Phaser.Math.Clamp(newX, 100, GAME_WIDTH * 3 - 100),
                boss.y
              );
              // Reappear and become vulnerable
              manager.scene.tweens.add({
                targets: boss, alpha: 1, duration: 200,
                onComplete: () => {
                  manager.openVulnerability(1200);
                  // Fire projectile when reappearing
                  manager.fireProjectile(120, 'bossProjectile');
                }
              });
            }
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.35),
      name: 'Requiem Notes',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed);

        // Homing notes that slowly track the player
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2500;
          const target = manager.getTarget();
          const note = manager.projectiles.create(manager.boss.x, manager.boss.y - 10, 'bossNoteProjectile');
          if (note) {
            note.body.setAllowGravity(false);
            // Slow homing behavior
            const trackEvent = manager.scene.time.addEvent({
              delay: 100, repeat: 20,
              callback: () => {
                if (!note.active) { trackEvent.remove(); return; }
                const angle = Phaser.Math.Angle.Between(note.x, note.y, target.x, target.y);
                note.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
              }
            });
            manager.scene.time.delayedCall(3000, () => { if (note.active) note.destroy(); });
          }
        }

        // Vulnerable periodically
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 5000;
          manager.openVulnerability(1500);
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.3),
      name: 'Eternal Requiem',
      update(manager, time) {
        const boss = manager.boss;

        // Combination: teleports AND fires homing notes
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 3500;
          manager.scene.tweens.add({
            targets: boss, alpha: 0.3, duration: 200,
            onComplete: () => {
              const target = manager.getTarget();
              boss.setPosition(
                Phaser.Math.Clamp(target.x + Phaser.Math.Between(-120, 120), 100, GAME_WIDTH * 3 - 100),
                boss.y
              );
              manager.scene.tweens.add({
                targets: boss, alpha: 1, duration: 200,
                onComplete: () => {
                  manager.fireProjectile(130, 'bossNoteProjectile');
                  manager.openVulnerability(1500);
                }
              });
            }
          });
        }
      }
    }
  ];
}

/**
 * Level 7: Mozart's Shadow — 4 phases
 * Phase 1: Mirror match (shadow copies player moves)
 * Phase 2: Find real among clones
 * Phase 3: Giant battle (boss grows)
 * Phase 4: Requiem rhythm (final showdown)
 */
export function getMozartShadowPhases(difficulty) {
  const baseSpeed = difficulty.boss.speed || 130;
  const projSpeed = difficulty.bossProjectileSpeed || 150;

  return [
    {
      hp: Math.ceil(difficulty.boss.health * 0.25),
      name: 'Mirror Match',
      update(manager, time) {
        // Shadow mirrors player movement
        const target = manager.getTarget();
        const boss = manager.boss;

        // Mirror X movement (inverted)
        const centerX = (boss.x + target.x) / 2;
        const mirrorX = centerX + (centerX - target.x) * 0.5;
        boss.setVelocityX((mirrorX - boss.x) * 2);

        // Fire mirror projectiles
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2000;
          manager.fireProjectile(projSpeed, 'bossNoteProjectile');
        }

        // Vulnerable when standing still
        if (Math.abs(boss.body.velocity.x) < 20) {
          if (!manager.isVulnerable) {
            manager.openVulnerability(800);
          }
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.25),
      name: 'Shadow Clones',
      update(manager, time) {
        manager.moveTowardTarget(baseSpeed * 0.8);

        // Spawn clone decoys (visual only, can't be hit)
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 3500;
          // Create fake shadow sprites
          for (let i = 0; i < 2; i++) {
            const fakeX = manager.boss.x + Phaser.Math.Between(-200, 200);
            const fake = manager.scene.add.sprite(fakeX, manager.boss.y, 'bossMozartShadow');
            fake.setScale(manager.scale);
            fake.setAlpha(0.6);
            fake.setTint(0x666666);
            manager.scene.tweens.add({
              targets: fake, alpha: 0, duration: 2500,
              onComplete: () => fake.destroy()
            });
          }
          // Real boss becomes slightly more visible
          manager.boss.setAlpha(0.9);
          manager.scene.time.delayedCall(1000, () => {
            manager.boss.setAlpha(1);
          });
        }

        // Fire projectiles from boss
        if (time > (manager.vulnerabilityTimer || 0)) {
          manager.vulnerabilityTimer = time + 2500;
          manager.fireProjectile(projSpeed, 'bossNoteProjectile');
          manager.scene.time.delayedCall(1500, () => {
            manager.openVulnerability(1200);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.25),
      name: 'Giant Shadow',
      update(manager, time) {
        const boss = manager.boss;
        // Boss grows larger in this phase
        if (boss.scaleX < manager.scale * 1.8) {
          boss.setScale(boss.scaleX + 0.002);
        }

        manager.moveTowardTarget(baseSpeed * 0.7);

        // Slam attacks creating shockwaves
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 2500;
          manager.jump(-500);
          manager.scene.time.delayedCall(800, () => {
            manager.fireShockwave(250, 1);
            manager.fireShockwave(250, -1);
            if (manager.scene.particles) {
              manager.scene.particles.screenShake(0.02, 300);
            }
          });

          // Vulnerable after landing
          manager.scene.time.delayedCall(1500, () => {
            manager.openVulnerability(1500);
          });
        }
      }
    },
    {
      hp: Math.ceil(difficulty.boss.health * 0.25),
      name: 'Requiem Finale',
      update(manager, time) {
        const boss = manager.boss;
        // Return to normal size
        if (boss.scaleX > manager.scale) {
          boss.setScale(boss.scaleX - 0.005);
        }

        manager.moveTowardTarget(baseSpeed * 1.5);

        // Rapid rhythm pattern — notes fire in musical sequence
        if (time > manager.attackTimer) {
          manager.attackTimer = time + 3000;
          // Musical cascade
          for (let i = 0; i < 5; i++) {
            manager.scene.time.delayedCall(i * 350, () => {
              manager.fireProjectile(projSpeed + i * 10, 'bossNoteProjectile');
            });
          }

          // Exhaustion vulnerability after the cascade
          manager.scene.time.delayedCall(2200, () => {
            if (!boss || !boss.body || manager.isDefeated) return;
            boss.setVelocityX(0);
            manager.openVulnerability(1500);
          });
        }
      }
    }
  ];
}
