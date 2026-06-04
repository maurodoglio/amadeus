import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Reusable boss fight mixin that provides standard boss behavior.
 * Call setupBoss() in create() and updateBossAI() in update().
 */
export function setupBoss(scene, config) {
  const {
    x,
    y,
    texture,
    scale = 2.5,
    health = 5,
    name = 'Boss',
    activateX = x - 400,
    speed = 100,
    jumpForce = -350,
    attackInterval = 2500,
    coopHealthBonus = 2,
    dialogue = null,
    victoryQuote = null
  } = config;

  scene.bossDefeated = false;
  scene.bossDialogue = dialogue;
  scene.bossVictoryQuote = victoryQuote;
  scene.bossDialogueShown = false;

  scene.boss = scene.physics.add.sprite(x, y, texture);
  scene.boss.setScale(scale);
  scene.boss.body.setAllowGravity(true);
  scene.boss.setCollideWorldBounds(true);

  const totalHealth = scene.coopMode ? health + coopHealthBonus : health;
  scene.boss.health = totalHealth;
  scene.boss.maxHealth = totalHealth;
  scene.boss.isActive = false;
  scene.boss.attackTimer = 0;
  scene.boss.phase = 1;
  scene.boss.speed = speed;
  scene.boss.jumpForce = jumpForce;
  scene.boss.attackInterval = attackInterval;
  scene.boss.activateX = activateX;

  scene.physics.add.collider(scene.boss, scene.platforms);

  // Boss health bar (initially hidden)
  scene.bossHealthBg = scene.add.rectangle(GAME_WIDTH / 2, 60, 200, 20, 0x333333)
    .setScrollFactor(0).setVisible(false).setDepth(100);
  scene.bossHealthBar = scene.add.rectangle(GAME_WIDTH / 2, 60, 196, 16, 0xFF0000)
    .setScrollFactor(0).setVisible(false).setDepth(101);
  scene.bossLabel = scene.add.text(GAME_WIDTH / 2, 40, name, {
    font: '12px monospace', fill: '#FFD700'
  }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(101);

  // Overlap with players
  scene.physics.add.overlap(scene.mozart, scene.boss, (player, boss) => hitBoss(scene, player, boss), null, scene);
  if (scene.coopMode && scene.nannerl) {
    scene.physics.add.overlap(scene.nannerl, scene.boss, (player, boss) => hitBoss(scene, player, boss), null, scene);
  }
}

/**
 * Show pre-fight dialogue as a text overlay.
 */
export function showBossDialogue(scene, lines, onComplete) {
  if (!lines || lines.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  scene.boss.setVelocityX(0);
  scene.boss.setVelocityY(0);

  const bg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH - 80, 70, 0x000000, 0.85)
    .setScrollFactor(0).setDepth(200);
  const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, lines[0], {
    font: '14px monospace', fill: '#FFFFFF', wordWrap: { width: GAME_WIDTH - 120 }, align: 'center'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

  let lineIndex = 0;
  scene.bossDialogueActive = true;

  const advanceKey = scene.input.keyboard.addKey('SPACE');
  const advanceDialogue = () => {
    lineIndex++;
    if (lineIndex < lines.length) {
      text.setText(lines[lineIndex]);
    } else {
      bg.destroy();
      text.destroy();
      advanceKey.off('down', advanceDialogue);
      scene.bossDialogueActive = false;
      if (onComplete) onComplete();
    }
  };
  advanceKey.on('down', advanceDialogue);
}

/**
 * Call in update() to handle boss activation and default AI.
 * Pass a custom updateFn for unique attack patterns.
 */
export function updateBossAI(scene, time, customUpdateFn) {
  if (!scene.boss || !scene.boss.active) return;
  if (scene.bossDialogueActive) return;

  // Activate boss when player gets close
  if (!scene.boss.isActive) {
    const anyPlayerClose = (scene.mozart && !scene.mozart.isDead && scene.mozart.x > scene.boss.activateX) ||
      (scene.nannerl && !scene.nannerl.isDead && scene.nannerl.x > scene.boss.activateX);
    if (anyPlayerClose) {
      scene.boss.isActive = true;
      scene.bossHealthBg.setVisible(true);
      scene.bossHealthBar.setVisible(true);
      scene.bossLabel.setVisible(true);

      scene.sound.stopAll();
      if (scene.sound.get('music_boss')) {
        scene.sound.play('music_boss', { loop: true, volume: 0.3 });
      }

      // Show pre-fight dialogue
      if (scene.bossDialogue && !scene.bossDialogueShown) {
        scene.bossDialogueShown = true;
        showBossDialogue(scene, scene.bossDialogue);
      }
    }
    return;
  }

  // Determine phase based on remaining health
  const healthPercent = scene.boss.health / scene.boss.maxHealth;
  if (healthPercent <= 0.33) scene.boss.phase = 3;
  else if (healthPercent <= 0.66) scene.boss.phase = 2;
  else scene.boss.phase = 1;

  if (customUpdateFn) {
    customUpdateFn(scene, time);
  } else {
    defaultBossUpdate(scene, time);
  }
}

function defaultBossUpdate(scene, time) {
  const boss = scene.boss;
  const target = getBossTarget(scene);

  // Move toward target
  const speedMult = boss.phase === 3 ? 1.5 : boss.phase === 2 ? 1.25 : 1;
  const currentSpeed = boss.speed * speedMult;

  if (target.x > boss.x + 30) {
    boss.setVelocityX(currentSpeed);
    boss.setFlipX(false);
  } else if (target.x < boss.x - 30) {
    boss.setVelocityX(-currentSpeed);
    boss.setFlipX(true);
  } else {
    boss.setVelocityX(0);
  }

  // Jump attack with phase-based interval
  const interval = boss.attackInterval / boss.phase;
  if (time > boss.attackTimer && (boss.body.blocked.down || boss.body.touching.down)) {
    boss.setVelocityY(boss.jumpForce);
    boss.attackTimer = time + interval;
  }
}

export function getBossTarget(scene) {
  let target = scene.mozart;
  if (scene.coopMode && scene.nannerl && !scene.nannerl.isDead) {
    if (scene.mozart.isDead) {
      target = scene.nannerl;
    } else {
      const d1 = Math.abs(scene.mozart.x - scene.boss.x);
      const d2 = Math.abs(scene.nannerl.x - scene.boss.x);
      target = d1 < d2 ? scene.mozart : scene.nannerl;
    }
  }
  return target;
}

function hitBoss(scene, player, boss) {
  if (scene.bossDefeated) return;

  if (player.body.velocity.y > 0 && player.y < boss.y - 20) {
    boss.health--;
    player.setVelocityY(-300);

    if (scene.combo) {
      const multiplier = scene.combo.registerAction();
      const points = 200 * multiplier;
      const score = scene.registry.get('score') + points;
      scene.registry.set('score', score);
      scene.registry.set('comboMultiplier', scene.combo.getMultiplier());
      scene.registry.set('comboCount', scene.combo.getComboCount());
    }

    scene.particles.screenShake(0.015, 300);
    scene.particles.emitStomp(boss.x, boss.y - 20);

    const healthPercent = boss.health / boss.maxHealth;
    scene.bossHealthBar.setSize(196 * healthPercent, 16);

    if (scene.sound.get('sfx_hit')) scene.sound.play('sfx_hit', { volume: 0.3 });

    // Flash boss
    scene.tweens.add({
      targets: boss,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3
    });

    if (boss.health <= 0) {
      defeatBoss(scene);
    }
  } else {
    player.hit();
  }
}

function defeatBoss(scene) {
  scene.bossDefeated = true;

  scene.particles.screenShake(0.025, 500);

  // Musical note explosion (not violent)
  emitMusicalNoteExplosion(scene, scene.boss.x, scene.boss.y);
  scene.particles.emitSparkleCollect(scene.boss.x, scene.boss.y);

  scene.boss.destroy();
  scene.bossHealthBg.setVisible(false);
  scene.bossHealthBar.setVisible(false);
  scene.bossLabel.setVisible(false);

  // Show instrument
  if (scene.instrument) {
    scene.instrument.setVisible(true);
    scene.instrument.body.enable = true;

    scene.tweens.add({
      targets: scene.instrument,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    scene.instrumentSparkle = scene.particles.emitSparkle(scene.instrument.x, scene.instrument.y);
  }

  // Victory quote
  const victoryMessage = scene.bossVictoryQuote || 'Boss Defeated!';
  const victoryText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, victoryMessage, {
    font: '24px monospace',
    fill: '#FFD700',
    stroke: '#000000',
    strokeThickness: 4,
    wordWrap: { width: GAME_WIDTH - 100 },
    align: 'center'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

  scene.tweens.add({
    targets: victoryText,
    alpha: 0,
    delay: 3000,
    duration: 1000
  });

  if (scene.sound.get('sfx_levelComplete')) {
    scene.sound.play('sfx_levelComplete', { volume: 0.5 });
  }
}

/**
 * Emit a burst of musical notes in all directions (non-violent defeat).
 */
function emitMusicalNoteExplosion(scene, x, y) {
  const particles = scene.add.particles(x, y, 'particleNote', {
    speed: { min: 100, max: 250 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.5, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 1200,
    quantity: 20,
    tint: [0xFFD700, 0xFFFFFF, 0xFF69B4, 0x87CEEB],
    rotate: { min: 0, max: 360 },
    gravityY: -30,
    emitting: false
  });

  particles.explode();
  scene.time.delayedCall(1500, () => particles.destroy());
}
