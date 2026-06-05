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

  graphics.fillStyle(0x070814, 1);
  graphics.fillRect(0, 0, width, height);

  const wallLayers = 18;
  for (let i = 0; i < wallLayers; i++) {
    const progress = i / (wallLayers - 1);
    const alpha = 0.05 + progress * 0.035;
    graphics.fillStyle(progress < 0.5 ? 0x140f26 : 0x22163c, alpha);
    graphics.fillEllipse(width / 2, height * 0.28, width * (1.05 - progress * 0.45), height * (0.92 - progress * 0.34));
  }

  for (let i = 0; i < 7; i++) {
    const beamWidth = width * (0.13 + i * 0.025);
    const beamHeight = height * (0.18 + i * 0.04);
    graphics.fillStyle(COLORS.gold, 0.012 + i * 0.003);
    graphics.fillEllipse(width / 2, height * 0.2, beamWidth, beamHeight);
  }

  const balcony = scene.add.graphics();
  balcony.fillStyle(0x05050b, 0.5);
  balcony.fillRect(0, height * 0.62, width, height * 0.06);
  balcony.fillStyle(0x24172e, 0.55);
  balcony.fillRect(0, height * 0.68, width, height * 0.32);
  balcony.lineStyle(2, COLORS.goldDark, 0.5);
  balcony.beginPath();
  balcony.moveTo(0, height * 0.62);
  balcony.quadraticCurveTo(width / 2, height * 0.58, width, height * 0.62);
  balcony.strokePath();

  const columns = scene.add.graphics();
  [0.12, 0.32, 0.68, 0.88].forEach(ratio => {
    const cx = width * ratio;
    columns.fillStyle(0x0d0916, 0.45);
    columns.fillRoundedRect(cx - 16, 20, 32, height * 0.78, 10);
    columns.fillStyle(0x352143, 0.25);
    columns.fillRoundedRect(cx - 7, 20, 14, height * 0.78, 8);
  });

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
  const height = 42;
  const hw = width / 2;
  const hh = height / 2;
  const shadow = scene.add.graphics();
  const glow = scene.add.graphics();
  const glass = scene.add.graphics();
  const sheen = scene.add.graphics();

  const redraw = (hovered = false) => {
    shadow.clear();
    glow.clear();
    glass.clear();
    sheen.clear();

    shadow.fillStyle(COLORS.black, hovered ? 0.32 : 0.22);
    shadow.fillRoundedRect(-hw + 3, -hh + 5, width, height, 10);

    if (hovered) {
      glow.lineStyle(8, COLORS.gold, 0.18);
      glow.strokeRoundedRect(-hw - 2, -hh - 2, width + 4, height + 4, 12);
    }

    glass.fillStyle(COLORS.navyBlue, hovered ? 0.8 : 0.68);
    glass.fillRoundedRect(-hw, -hh, width, height, 10);
    glass.fillStyle(COLORS.white, hovered ? 0.14 : 0.09);
    glass.fillRoundedRect(-hw + 2, -hh + 2, width - 4, height * 0.48, 8);
    glass.lineStyle(2, hovered ? COLORS.gold : COLORS.parchmentEdge, hovered ? 0.95 : 0.8);
    glass.strokeRoundedRect(-hw, -hh, width, height, 10);
    glass.lineStyle(1, COLORS.white, hovered ? 0.24 : 0.16);
    glass.strokeRoundedRect(-hw + 4, -hh + 4, width - 8, height - 8, 8);

    sheen.fillStyle(COLORS.goldLight, hovered ? 0.18 : 0.08);
    sheen.fillRoundedRect(-hw + width * 0.08, -hh + 5, width * 0.34, 5, 3);
  };

  redraw(false);
  container.add([shadow, glow, glass, sheen]);

  const label = scene.add.text(0, 0, text, {
    fontFamily: 'Georgia, serif',
    fontSize: '18px',
    fontStyle: 'bold',
    color: '#F5E6C8'
  }).setOrigin(0.5);
  container.add(label);

  const hitArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
  container.add(hitArea);

  hitArea.on('pointerover', () => {
    redraw(true);
    label.setColor('#FFF8E7');
    scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 110, ease: 'Sine.easeOut' });
  });

  hitArea.on('pointerout', () => {
    redraw(false);
    label.setColor('#F5E6C8');
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110, ease: 'Sine.easeOut' });
  });

  hitArea.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeInOut',
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

  graphics.fillStyle(COLORS.black, 0.26);
  graphics.fillRoundedRect(x + 6, y + 8, width, height, 16);

  graphics.fillStyle(COLORS.parchment, 0.96);
  graphics.fillRoundedRect(x, y, width, height, 16);
  graphics.fillStyle(COLORS.white, 0.18);
  graphics.fillRoundedRect(x + 8, y + 8, width - 16, height * 0.18, 12);

  graphics.lineStyle(3, COLORS.goldDark, 0.85);
  graphics.strokeRoundedRect(x, y, width, height, 16);
  graphics.lineStyle(1.5, COLORS.gold, 0.45);
  graphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 12);

  const ornamentRadius = 6;
  [
    [x + 22, y + 22],
    [x + width - 22, y + 22],
    [x + 22, y + height - 22],
    [x + width - 22, y + height - 22]
  ].forEach(([ox, oy]) => {
    graphics.fillStyle(COLORS.gold, 0.75);
    graphics.fillCircle(ox, oy, ornamentRadius);
    graphics.lineStyle(1, COLORS.parchmentDark, 0.7);
    graphics.strokeCircle(ox, oy, ornamentRadius + 2);
  });

  return graphics;
}

/**
 * Draw an ornate gold frame around a region.
 */
export function drawOrnateFrame(scene, x, y, width, height, color = COLORS.gold, alpha = 0.7) {
  const graphics = scene.add.graphics();
  graphics.lineStyle(3, color, alpha);
  graphics.strokeRoundedRect(x, y, width, height, 18);
  graphics.lineStyle(1, COLORS.white, alpha * 0.4);
  graphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 14);

  [
    [x + 16, y + 16, 1],
    [x + width - 16, y + 16, -1],
    [x + 16, y + height - 16, 1],
    [x + width - 16, y + height - 16, -1]
  ].forEach(([cx, cy, dir]) => {
    graphics.lineStyle(2, color, alpha * 0.8);
    graphics.beginPath();
    graphics.moveTo(cx, cy + 12 * dir);
    graphics.quadraticCurveTo(cx + 12 * dir, cy, cx, cy - 12 * dir);
    graphics.quadraticCurveTo(cx - 12 * dir, cy, cx, cy + 12 * dir);
    graphics.strokePath();
    graphics.fillStyle(color, alpha * 0.45);
    graphics.fillCircle(cx, cy, 3);
  });

  return graphics;
}

/**
 * Draw a simple instrument glyph for UI screens.
 */
export function createInstrumentIcon(scene, x, y, instrument, color = COLORS.goldDark, scale = 1) {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.lineStyle(Math.max(1, 1.5 * scale), color, 1);
  g.fillStyle(color, 0.18);
  const s = scale;

  switch (instrument) {
    case 'violin':
      g.strokeEllipse(0, -2 * s, 10 * s, 12 * s);
      g.strokeEllipse(0, 7 * s, 11 * s, 13 * s);
      g.beginPath();
      g.moveTo(0, -12 * s);
      g.lineTo(0, 15 * s);
      g.strokePath();
      g.beginPath();
      g.moveTo(-4 * s, -15 * s);
      g.lineTo(4 * s, -15 * s);
      g.strokePath();
      break;
    case 'flute':
      g.beginPath();
      g.moveTo(-16 * s, 0);
      g.lineTo(16 * s, -4 * s);
      g.strokePath();
      [-10, -4, 2, 8].forEach(offset => g.fillCircle(offset * s, -2 * s, 1.6 * s));
      break;
    case 'piano':
    case 'harpsichord':
      g.strokeRoundedRect(-16 * s, -12 * s, 32 * s, 22 * s, 4 * s);
      g.beginPath();
      g.moveTo(-12 * s, -2 * s);
      g.lineTo(12 * s, -2 * s);
      g.strokePath();
      [-8, -3, 2, 7].forEach(offset => {
        g.beginPath();
        g.moveTo(offset * s, -2 * s);
        g.lineTo(offset * s, 8 * s);
        g.strokePath();
      });
      break;
    case 'trumpet':
      g.beginPath();
      g.moveTo(-15 * s, 3 * s);
      g.lineTo(3 * s, 3 * s);
      g.lineTo(10 * s, -3 * s);
      g.lineTo(10 * s, 9 * s);
      g.lineTo(3 * s, 3 * s);
      g.strokePath();
      g.beginPath();
      g.moveTo(-15 * s, 3 * s);
      g.lineTo(-18 * s, -3 * s);
      g.strokePath();
      [ -5, -1, 3 ].forEach(offset => g.fillCircle(offset * s, 0, 1.5 * s));
      break;
    case 'drums':
      g.strokeEllipse(0, 2 * s, 22 * s, 14 * s);
      g.beginPath();
      g.moveTo(-11 * s, 2 * s);
      g.lineTo(-11 * s, 14 * s);
      g.lineTo(11 * s, 14 * s);
      g.lineTo(11 * s, 2 * s);
      g.strokePath();
      g.beginPath();
      g.moveTo(-14 * s, -10 * s);
      g.lineTo(-4 * s, -2 * s);
      g.moveTo(14 * s, -10 * s);
      g.lineTo(4 * s, -2 * s);
      g.strokePath();
      break;
    case 'harp':
      g.beginPath();
      g.moveTo(-12 * s, 12 * s);
      g.lineTo(-2 * s, -14 * s);
      g.lineTo(12 * s, 12 * s);
      g.lineTo(-12 * s, 12 * s);
      g.strokePath();
      [-4, 0, 4].forEach(offset => {
        g.beginPath();
        g.moveTo(offset * s - 2 * s, -6 * s);
        g.lineTo(offset * s, 10 * s);
        g.strokePath();
      });
      break;
    default:
      g.fillCircle(0, 0, 4 * s);
      g.beginPath();
      g.moveTo(4 * s, 0);
      g.lineTo(4 * s, -14 * s);
      g.lineTo(9 * s, -9 * s);
      g.strokePath();
      break;
  }

  return g;
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
