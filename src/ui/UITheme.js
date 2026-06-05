import Phaser from 'phaser';

/**
 * Shared UI theme constants and helpers for the 18th-century classical music manuscript aesthetic.
 * All visuals are procedural (Phaser graphics, no external images).
 */

// Color palette
export const COLORS = {
  parchment: 0xF5E6C8,
  parchmentDark: 0xD4C4A0,
  parchmentEdge: 0xC8A96E,
  gold: 0xFFD700,
  goldDark: 0xB8860B,
  goldLight: 0xFFE55C,
  ink: 0x2B1810,
  inkLight: 0x4A3728,
  sepia: 0x704214,
  cream: 0xFFF8E7,
  burgundy: 0x722F37,
  navyBlue: 0x1a1a2e,
  forestGreen: 0x2d4a2d,
  grey: 0x808080,
  greyLight: 0xAAAAAA,
  greyDark: 0x555555,
  white: 0xFFFFFF,
  black: 0x000000,
  curtainRed: 0x8B0000,
  curtainRedLight: 0xAA2222,
};

// Font styles
export const FONTS = {
  heading: { fontFamily: 'Georgia, serif', fontSize: '42px', color: '#FFD700', stroke: '#8B4513', strokeThickness: 3 },
  subheading: { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#FFF8E7' },
  body: { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#F5E6C8' },
  button: { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#2B1810' },
  buttonHover: { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#FFD700' },
  small: { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#C8A96E' },
  hud: { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#FFD700' },
  hudSmall: { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#F5E6C8' },
  combo: { fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#FFD700', stroke: '#000000', strokeThickness: 3 },
};

// Spacing
export const SPACING = {
  buttonPadX: 24,
  buttonPadY: 10,
  buttonGap: 54,
  panelPad: 20,
  cornerRadius: 8,
};

/**
 * Draw a parchment-textured background (clean gradient, no noise).
 */
export function drawParchmentBackground(scene, width, height) {
  const graphics = scene.add.graphics();

  // Clean gradient background
  graphics.fillGradientStyle(COLORS.parchment, COLORS.parchmentDark, COLORS.parchmentEdge, COLORS.parchment);
  graphics.fillRect(0, 0, width, height);

  // Subtle vignette
  const edgeG = scene.add.graphics();
  edgeG.fillStyle(COLORS.ink, 0.08);
  edgeG.fillRect(0, 0, width, 4);
  edgeG.fillRect(0, height - 4, width, 4);
  edgeG.fillRect(0, 0, 4, height);
  edgeG.fillRect(width - 4, 0, 4, height);

  return graphics;
}

/**
 * Draw an elegant dark concert-hall background with smooth radial gradient.
 */
export function drawConcertHallBackground(scene, width, height) {
  const graphics = scene.add.graphics();

  // Deep navy base
  graphics.fillStyle(0x0d0d1a, 1);
  graphics.fillRect(0, 0, width, height);

  // Radial warm glow from center-top (stage spotlight feel)
  const layers = 12;
  for (let i = layers; i >= 0; i--) {
    const alpha = 0.03 + (i / layers) * 0.06;
    const radiusX = (width * 0.5) * (1 - i / (layers * 1.5));
    const radiusY = (height * 0.6) * (1 - i / (layers * 1.5));
    graphics.fillStyle(0x1a1030, alpha);
    graphics.fillEllipse(width / 2, height * 0.35, radiusX * 2, radiusY * 2);
  }

  // Warm golden spotlight glow
  for (let i = 8; i >= 0; i--) {
    const alpha = 0.015 * (8 - i);
    const radius = 60 + i * 30;
    graphics.fillStyle(0xFFD700, alpha);
    graphics.fillEllipse(width / 2, height * 0.25, radius * 2.5, radius * 1.2);
  }

  return graphics;
}

/**
 * Draw a musical staff divider at position y.
 */
export function drawStaffDivider(scene, x, y, lineWidth) {
  const graphics = scene.add.graphics();
  graphics.lineStyle(1, COLORS.goldDark, 0.5);
  const staffGap = 5;
  for (let i = 0; i < 5; i++) {
    graphics.beginPath();
    graphics.moveTo(x, y + i * staffGap);
    graphics.lineTo(x + lineWidth, y + i * staffGap);
    graphics.strokePath();
  }
  return graphics;
}

/**
 * Draw a treble clef ornament (simplified procedural version).
 */
export function drawTrebleClef(scene, x, y, scale = 1) {
  const graphics = scene.add.graphics();
  graphics.lineStyle(2 * scale, COLORS.gold, 0.8);

  // Simplified treble clef as a series of curves
  const s = scale;
  graphics.beginPath();
  // Main spiral
  graphics.arc(x, y, 8 * s, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(330), false);
  graphics.strokePath();

  graphics.beginPath();
  graphics.arc(x, y - 6 * s, 4 * s, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(0), false);
  graphics.strokePath();

  // Vertical stem
  graphics.beginPath();
  graphics.moveTo(x + 4 * s, y - 6 * s);
  graphics.lineTo(x + 4 * s, y + 16 * s);
  graphics.strokePath();

  // Bottom curl
  graphics.beginPath();
  graphics.arc(x + 2 * s, y + 16 * s, 3 * s, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false);
  graphics.strokePath();

  return graphics;
}

/**
 * Draw a music note icon (quarter note).
 * Returns the graphics object for positioning/animation.
 */
export function drawMusicNote(scene, x, y, filled = true, color = COLORS.gold) {
  const graphics = scene.add.graphics();
  const emptyColor = COLORS.greyDark;
  const c = filled ? color : emptyColor;

  // Note head (filled ellipse)
  graphics.fillStyle(c, 1);
  graphics.fillEllipse(x, y, 10, 8);

  // Stem
  graphics.lineStyle(2, c, 1);
  graphics.beginPath();
  graphics.moveTo(x + 5, y);
  graphics.lineTo(x + 5, y - 16);
  graphics.strokePath();

  // Flag
  graphics.beginPath();
  graphics.moveTo(x + 5, y - 16);
  graphics.lineTo(x + 9, y - 10);
  graphics.strokePath();

  return graphics;
}

/**
 * Create an ornate button with parchment background and gold border.
 * Returns a container with interactive behavior.
 */
export function createButton(scene, x, y, text, onClick, width = 180) {
  const container = scene.add.container(x, y);
  const height = 40;
  const hw = width / 2;
  const hh = height / 2;

  // Button background
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.parchment, 0.9);
  bg.fillRoundedRect(-hw, -hh, width, height, 6);
  bg.lineStyle(2, COLORS.goldDark, 1);
  bg.strokeRoundedRect(-hw, -hh, width, height, 6);
  container.add(bg);

  // Button text
  const label = scene.add.text(0, 0, text, {
    fontFamily: 'Georgia, serif',
    fontSize: '18px',
    color: '#2B1810',
  }).setOrigin(0.5);
  container.add(label);

  // Interaction zone
  const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
  container.add(hitArea);

  // Hover effects
  hitArea.on('pointerover', () => {
    bg.clear();
    bg.fillStyle(COLORS.goldLight, 0.95);
    bg.fillRoundedRect(-hw, -hh, width, height, 6);
    bg.lineStyle(2, COLORS.gold, 1);
    bg.strokeRoundedRect(-hw, -hh, width, height, 6);
    label.setStyle({ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2B1810' });
    scene.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
  });

  hitArea.on('pointerout', () => {
    bg.clear();
    bg.fillStyle(COLORS.parchment, 0.9);
    bg.fillRoundedRect(-hw, -hh, width, height, 6);
    bg.lineStyle(2, COLORS.goldDark, 1);
    bg.strokeRoundedRect(-hw, -hh, width, height, 6);
    label.setStyle({ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2B1810' });
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
  });

  hitArea.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.95, scaleY: 0.95,
      duration: 60,
      yoyo: true,
      onComplete: () => { if (onClick) onClick(); }
    });
  });

  return container;
}

/**
 * Create a panel with parchment styling.
 */
export function createPanel(scene, x, y, width, height) {
  const graphics = scene.add.graphics();

  // Shadow
  graphics.fillStyle(COLORS.ink, 0.3);
  graphics.fillRoundedRect(x + 3, y + 3, width, height, 10);

  // Main panel
  graphics.fillStyle(COLORS.parchment, 0.95);
  graphics.fillRoundedRect(x, y, width, height, 10);

  // Border
  graphics.lineStyle(3, COLORS.goldDark, 0.8);
  graphics.strokeRoundedRect(x, y, width, height, 10);

  // Inner border
  graphics.lineStyle(1, COLORS.gold, 0.3);
  graphics.strokeRoundedRect(x + 6, y + 6, width - 12, height - 12, 7);

  return graphics;
}

/**
 * Theater curtain transition - rise animation.
 * Returns a promise-like object with tweens for curtain opening.
 */
export function createCurtainRise(scene, width, height, onComplete) {
  const leftCurtain = scene.add.graphics();
  const rightCurtain = scene.add.graphics();

  // Draw left curtain
  leftCurtain.fillStyle(COLORS.curtainRed, 1);
  leftCurtain.fillRect(0, 0, width / 2, height);
  // Folds
  for (let i = 0; i < 5; i++) {
    leftCurtain.fillStyle(COLORS.curtainRedLight, 0.3);
    leftCurtain.fillRect(i * (width / 10), 0, 4, height);
  }

  // Draw right curtain
  rightCurtain.fillStyle(COLORS.curtainRed, 1);
  rightCurtain.fillRect(width / 2, 0, width / 2, height);
  for (let i = 0; i < 5; i++) {
    rightCurtain.fillStyle(COLORS.curtainRedLight, 0.3);
    rightCurtain.fillRect(width / 2 + i * (width / 10), 0, 4, height);
  }

  // Gold trim at the center
  leftCurtain.fillStyle(COLORS.gold, 0.8);
  leftCurtain.fillRect(width / 2 - 4, 0, 4, height);
  rightCurtain.fillStyle(COLORS.gold, 0.8);
  rightCurtain.fillRect(width / 2, 0, 4, height);

  // Pelmet (top decoration)
  const pelmet = scene.add.graphics();
  pelmet.fillStyle(COLORS.curtainRed, 1);
  pelmet.fillRect(0, 0, width, 30);
  pelmet.fillStyle(COLORS.gold, 0.9);
  pelmet.fillRect(0, 26, width, 6);
  // Scalloped edge
  for (let i = 0; i < width; i += 20) {
    pelmet.fillStyle(COLORS.curtainRed, 1);
    pelmet.fillTriangle(i, 32, i + 10, 44, i + 20, 32);
  }

  // Animate curtains opening
  scene.tweens.add({
    targets: leftCurtain,
    x: -width / 2,
    duration: 1200,
    ease: 'Power2',
    delay: 300
  });

  scene.tweens.add({
    targets: rightCurtain,
    x: width / 2,
    duration: 1200,
    ease: 'Power2',
    delay: 300
  });

  scene.tweens.add({
    targets: pelmet,
    y: -50,
    duration: 800,
    ease: 'Power2',
    delay: 600,
    onComplete: () => {
      leftCurtain.destroy();
      rightCurtain.destroy();
      pelmet.destroy();
      if (onComplete) onComplete();
    }
  });

  return { leftCurtain, rightCurtain, pelmet };
}

/**
 * Gold confetti particle burst effect.
 */
export function createGoldConfetti(scene, x, y, count = 40) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const px = x + Phaser.Math.Between(-20, 20);
    const py = y;
    const size = Phaser.Math.Between(3, 7);
    const color = Phaser.Math.RND.pick([COLORS.gold, COLORS.goldLight, COLORS.goldDark, COLORS.white]);
    const particle = scene.add.rectangle(px, py, size, size * 0.6, color);
    particle.setAngle(Phaser.Math.Between(0, 360));
    particles.push(particle);

    scene.tweens.add({
      targets: particle,
      x: px + Phaser.Math.Between(-150, 150),
      y: py + Phaser.Math.Between(100, 350),
      angle: Phaser.Math.Between(-360, 360),
      alpha: 0,
      duration: Phaser.Math.Between(1500, 3000),
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }
  return particles;
}

/**
 * Sepia desaturation death effect using camera post-FX pipeline or tint overlay.
 */
export function createSepiaOverlay(scene, width, height, onComplete) {
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, COLORS.sepia, 0);
  overlay.setDepth(1000);

  scene.tweens.add({
    targets: overlay,
    alpha: 0.6,
    duration: 800,
    ease: 'Power2',
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });

  return overlay;
}

/**
 * Page-turn transition effect for menu navigation.
 */
export function createPageTurn(scene, width, height, direction, onMidpoint, onComplete) {
  const page = scene.add.graphics();
  page.fillStyle(COLORS.parchment, 1);
  page.fillRect(0, 0, width, height);
  page.lineStyle(2, COLORS.goldDark, 0.5);
  page.strokeRect(0, 0, width, height);

  // Start off-screen
  const startX = direction === 'left' ? width : -width;
  page.setX(startX);

  // Slide in (page covers screen)
  scene.tweens.add({
    targets: page,
    x: 0,
    duration: 400,
    ease: 'Power2',
    onComplete: () => {
      if (onMidpoint) onMidpoint();
      // Slide out
      scene.tweens.add({
        targets: page,
        x: direction === 'left' ? -width : width,
        duration: 400,
        ease: 'Power2',
        delay: 100,
        onComplete: () => {
          page.destroy();
          if (onComplete) onComplete();
        }
      });
    }
  });

  return page;
}
