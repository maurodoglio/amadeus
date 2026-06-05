// @ts-check
import { TILE_SIZE } from '../config/constants.js';
import { generateAllParallaxTextures } from './ParallaxBackground.js';

const BACKGROUND_WIDTH = 800;
const BACKGROUND_HEIGHT = 480;

/**
 * Generates smooth vector-style sprites and textures programmatically using Canvas 2D.
 */
export class PixelArtGenerator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
  }

  generateAll() {
    this.generateMozart();
    this.generateNannerl();
    this.generateEnemies();
    this.generateNPCs();
    this.generateBosses();
    this.generateTiles();
    this.generateItems();
    this.generateCheckpointAndUI();
    this.generateBackgrounds();
    this.generateParticles();
    this.generateNoteProjectiles();
    this.generateParallaxLayers();
    this.generateRhythmSprites();
    this.generateCompositionNotes();
    this.generateWeaponSprites();
  }

  /**
   * Legacy pixel-array texture helper kept for compatibility.
   * @param {string} key
   * @param {(string|null)[][]} pixelData
   * @param {number} [scale=2]
   */
  createTexture(key, pixelData, scale = 2) {
    const width = pixelData[0].length;
    const height = pixelData.length;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = pixelData[y][x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    this.scene.textures.addCanvas(key, canvas);
  }

  /**
   * Legacy pixel-array sprite-sheet helper kept for compatibility.
   * @param {string} key
   * @param {(string|null)[][][]} frames
   * @param {number} [scale=2]
   */
  createSpriteSheet(key, frames, scale = 2) {
    const width = frames[0][0].length;
    const height = frames[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale * frames.length;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frames.forEach((frame, frameIndex) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = frame[y][x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect((frameIndex * width + x) * scale, y * scale, scale, scale);
          }
        }
      }
    });

    this.scene.textures.addSpriteSheet(key, canvas, {
      frameWidth: width * scale,
      frameHeight: height * scale
    });
  }

  /**
   * @param {string} key
   * @param {number} width
   * @param {number} height
   * @param {(ctx: CanvasRenderingContext2D, width: number, height: number) => void} drawFn
   */
  createCanvasTexture(key, width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    drawFn(ctx, width, height);
    this.scene.textures.addCanvas(key, canvas);
  }

  /**
   * @param {string} key
   * @param {number} frameWidth
   * @param {number} frameHeight
   * @param {number} frameCount
   * @param {(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => void} drawFrameFn
   */
  createCanvasSpriteSheet(key, frameWidth, frameHeight, frameCount, drawFrameFn) {
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * frameCount;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    for (let i = 0; i < frameCount; i++) {
      ctx.save();
      ctx.translate(i * frameWidth, 0);
      ctx.beginPath();
      ctx.rect(0, 0, frameWidth, frameHeight);
      ctx.clip();
      drawFrameFn(ctx, frameWidth, frameHeight, i);
      ctx.restore();
    }

    this.scene.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight });
  }

  /** @param {CanvasRenderingContext2D} ctx */
  resetEffects(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }

  /** @param {CanvasRenderingContext2D} ctx */
  pathRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    this.pathRoundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
    this.pathRoundRect(ctx, x, y, width, height, radius);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  drawShadow(ctx, x, y, rx, ry, alpha = 0.18) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, `rgba(20, 14, 20, ${alpha})`);
    g.addColorStop(1, 'rgba(20, 14, 20, 0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSparkle(ctx, x, y, size, color = '#ffffff', alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      const radius = i % 2 === 0 ? size : size * 0.35;
      const px = x + Math.cos(angle - Math.PI / 2) * radius;
      const py = y + Math.sin(angle - Math.PI / 2) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawNoteGlyph(ctx, x, y, scale, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowBlur = scale * 1.8;
      ctx.shadowColor = glow;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + scale * 2.6, scale * 1.55, scale * 1.15, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + scale * 0.8, y - scale * 2.8, scale * 0.7, scale * 5.4);
    ctx.beginPath();
    ctx.moveTo(x + scale * 1.45, y - scale * 2.7);
    ctx.bezierCurveTo(x + scale * 4.4, y - scale * 2.4, x + scale * 4.6, y + scale * 0.7, x + scale * 1.8, y + scale * 0.6);
    ctx.lineTo(x + scale * 1.45, y + scale * 0.1);
    ctx.closePath();
    ctx.fill();
    this.resetEffects(ctx);
    ctx.restore();
  }

  drawFace(ctx, x, y, radius, skin, eyeColor = '#222', blush = 'rgba(255,160,170,0.25)') {
    const face = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.55, radius * 0.2, x, y, radius);
    face.addColorStop(0, '#fff6ea');
    face.addColorStop(0.35, skin);
    face.addColorStop(1, this.tint(skin, -18));
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(x - radius * 0.34, y - radius * 0.08, radius * 0.08, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.34, y - radius * 0.08, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(80, 46, 46, 0.65)`;
    ctx.lineWidth = Math.max(1, radius * 0.12);
    ctx.beginPath();
    ctx.arc(x, y + radius * 0.1, radius * 0.35, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(x - radius * 0.48, y + radius * 0.22, radius * 0.15, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.48, y + radius * 0.22, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPowderedWig(ctx, x, y, radius) {
    ctx.save();
    ctx.fillStyle = '#f5f3ef';
    ctx.shadowBlur = radius * 0.8;
    ctx.shadowColor = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.1, radius * 1.05, Math.PI, Math.PI * 2);
    ctx.arc(x - radius * 0.9, y + radius * 0.2, radius * 0.45, Math.PI * 0.6, Math.PI * 1.85);
    ctx.arc(x + radius * 0.9, y + radius * 0.2, radius * 0.45, Math.PI * 1.15, Math.PI * 0.4, true);
    ctx.closePath();
    ctx.fill();
    this.resetEffects(ctx);
    ctx.fillStyle = '#e1ddd6';
    ctx.beginPath();
    ctx.arc(x - radius * 1.05, y + radius * 0.5, radius * 0.28, 0, Math.PI * 2);
    ctx.arc(x + radius * 1.05, y + radius * 0.5, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d3cb';
    ctx.fillRect(x - radius * 0.18, y + radius * 0.82, radius * 0.36, radius * 0.48);
    ctx.restore();
  }

  drawHair(ctx, x, y, radius, color, bowColor) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.1, radius * 1.02, Math.PI * 1.05, Math.PI * 1.95, false);
    ctx.quadraticCurveTo(x + radius, y + radius * 0.7, x + radius * 0.7, y + radius * 1.1);
    ctx.quadraticCurveTo(x, y + radius * 0.4, x - radius * 0.7, y + radius * 1.1);
    ctx.quadraticCurveTo(x - radius, y + radius * 0.7, x - radius, y - radius * 0.05);
    ctx.fill();
    ctx.fillStyle = this.tint(color, 24);
    ctx.beginPath();
    ctx.arc(x + radius * 0.55, y + radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.arc(x - radius * 0.55, y + radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    if (bowColor) {
      ctx.fillStyle = bowColor;
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.3, y - radius * 0.75);
      ctx.quadraticCurveTo(x - radius * 0.8, y - radius * 1.05, x - radius * 0.45, y - radius * 0.45);
      ctx.quadraticCurveTo(x - radius * 0.15, y - radius * 0.65, x - radius * 0.3, y - radius * 0.75);
      ctx.moveTo(x + radius * 0.3, y - radius * 0.75);
      ctx.quadraticCurveTo(x + radius * 0.8, y - radius * 1.05, x + radius * 0.45, y - radius * 0.45);
      ctx.quadraticCurveTo(x + radius * 0.15, y - radius * 0.65, x + radius * 0.3, y - radius * 0.75);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - radius * 0.72, radius * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLimb(ctx, x, y, length, angle, width, color, jointColor) {
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(angle) * length * 0.45, y + Math.sin(angle) * length * 0.38, ex, ey);
    ctx.stroke();
    if (jointColor) {
      ctx.fillStyle = jointColor;
      ctx.beginPath();
      ctx.arc(ex, ey, width * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return { x: ex, y: ey };
  }

  drawPlayableCharacter(ctx, width, height, palette, pose) {
    const cx = width / 2;
    const groundY = height - 9;
    const headRadius = width * 0.15;
    const lift = pose.lift ?? 0;
    const sway = pose.sway ?? 0;
    const tilt = pose.tilt ?? 0;
    const shoulderY = height * 0.38 + lift;
    const hipY = height * 0.64 + lift;
    const coatTop = shoulderY - 4;
    const coatHeight = height * 0.34;

    ctx.clearRect(0, 0, width, height);
    this.drawShadow(ctx, cx, groundY, width * 0.18, 5, pose.type === 'jump' ? 0.08 : 0.16);

    ctx.save();
    ctx.translate(sway, lift);
    ctx.translate(cx, shoulderY + 5);
    ctx.rotate(tilt);
    ctx.translate(-cx, -(shoulderY + 5));

    if (palette.cape) {
      const cape = ctx.createLinearGradient(cx - 10, coatTop + 8, cx + 16, hipY + 12);
      cape.addColorStop(0, this.tint(palette.cape, 18));
      cape.addColorStop(1, this.tint(palette.cape, -22));
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.fillStyle = cape;
      ctx.beginPath();
      ctx.moveTo(cx + 7, coatTop + 4);
      ctx.bezierCurveTo(cx + 18, coatTop + 10, cx + 16 + (pose.capeFlow ?? 0) * 9, hipY + 4, cx + 10, hipY + 16);
      ctx.quadraticCurveTo(cx + 2, hipY + 8, cx - 1, coatTop + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const leftFoot = this.drawLimb(ctx, cx - 5, hipY, height * 0.17, 1.48 + (pose.leftLeg ?? 0), 6, palette.stockings || '#f0f0f0', palette.shoe || '#1e1d2a');
    const rightFoot = this.drawLimb(ctx, cx + 5, hipY, height * 0.17, 1.48 + (pose.rightLeg ?? 0), 6, palette.stockings || '#f0f0f0', palette.shoe || '#1e1d2a');
    this.fillRoundRect(ctx, leftFoot.x - 5, leftFoot.y - 1, 10, 5, 2.5, palette.shoe || '#1e1d2a');
    this.fillRoundRect(ctx, rightFoot.x - 5, rightFoot.y - 1, 10, 5, 2.5, palette.shoe || '#1e1d2a');

    const leftHand = this.drawLimb(ctx, cx - 10, shoulderY + 3, height * 0.17, 1.55 + (pose.leftArm ?? 0), 5, palette.skin, palette.skin);
    const rightHand = this.drawLimb(ctx, cx + 10, shoulderY + 3, height * 0.17, 1.55 + (pose.rightArm ?? 0), 5, palette.skin, palette.skin);

    if (pose.handToHead) {
      ctx.strokeStyle = palette.skin;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 10, shoulderY + 3);
      ctx.quadraticCurveTo(cx - 14, shoulderY - 12, cx - 6, shoulderY - 18);
      ctx.stroke();
    }

    const body = ctx.createLinearGradient(cx, coatTop, cx, coatTop + coatHeight);
    body.addColorStop(0, this.tint(palette.primary, 24));
    body.addColorStop(0.58, palette.primary);
    body.addColorStop(1, this.tint(palette.primary, -22));
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    if (palette.dress) {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(cx - 9, coatTop);
      ctx.quadraticCurveTo(cx - 15, coatTop + 11, cx - 16, hipY - 2);
      ctx.lineTo(cx - 19, hipY + 16);
      ctx.quadraticCurveTo(cx, hipY + 24, cx + 19, hipY + 16);
      ctx.lineTo(cx + 16, hipY - 2);
      ctx.quadraticCurveTo(cx + 15, coatTop + 11, cx + 9, coatTop);
      ctx.closePath();
      ctx.fill();
    } else {
      this.fillRoundRect(ctx, cx - 12, coatTop, 24, coatHeight, 9, body);
      ctx.fillStyle = this.tint(palette.primary, -10);
      ctx.beginPath();
      ctx.moveTo(cx - 10, coatTop + 12);
      ctx.lineTo(cx, coatTop + 23);
      ctx.lineTo(cx + 10, coatTop + 12);
      ctx.lineTo(cx + 10, hipY + 8);
      ctx.quadraticCurveTo(cx + 3, hipY + 16, cx, hipY + 16);
      ctx.quadraticCurveTo(cx - 3, hipY + 16, cx - 10, hipY + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = palette.trim || '#f1d278';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, coatTop + 4);
    ctx.lineTo(cx, hipY + 10);
    ctx.moveTo(cx - 9, coatTop + 7);
    ctx.lineTo(cx - 9, hipY + 6);
    ctx.moveTo(cx + 9, coatTop + 7);
    ctx.lineTo(cx + 9, hipY + 6);
    ctx.stroke();
    ctx.fillStyle = palette.trim || '#f1d278';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx + 5, coatTop + 10 + i * 8, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawFace(ctx, cx, height * 0.24 + lift, headRadius, palette.skin, palette.eyeColor, palette.blush);
    if (palette.wig) this.drawPowderedWig(ctx, cx, height * 0.22 + lift, headRadius * 0.95);
    else this.drawHair(ctx, cx, height * 0.22 + lift, headRadius, palette.hair, palette.bowColor);

    if (pose.hurt) {
      this.drawSparkle(ctx, cx - 12, height * 0.11, 4, '#ffd56a', 0.9);
      this.drawSparkle(ctx, cx + 12, height * 0.15, 3, '#ffffff', 0.8);
    }

    if (palette.apron) {
      this.fillRoundRect(ctx, cx - 6, coatTop + 12, 12, 16, 4, palette.apron);
    }

    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.arc(leftHand.x, leftHand.y, 2.4, 0, Math.PI * 2);
    ctx.arc(rightHand.x, rightHand.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawNPC(ctx, width, height, palette, frame) {
    const swayFrames = [0, 0.8, 0, -0.8, 0];
    const armFrames = [0.08, 0.16, 0.05, -0.08, 0];
    this.drawPlayableCharacter(ctx, width, height, palette, {
      type: 'npc',
      sway: swayFrames[frame] ?? 0,
      leftLeg: frame === 4 ? 0.02 : 0.08,
      rightLeg: frame === 4 ? -0.02 : -0.08,
      leftArm: armFrames[frame] ?? 0,
      rightArm: -(armFrames[frame] ?? 0),
      capeFlow: frame === 4 ? 0 : 0.12,
      lift: frame === 1 ? -0.4 : 0,
      tilt: frame === 3 ? -0.03 : 0
    });
  }

  drawEnemy(ctx, width, height, type, frame) {
    const centerX = width / 2;
    const centerY = height / 2;
    const pulse = Math.sin((frame / 4) * Math.PI * 2);
    ctx.clearRect(0, 0, width, height);
    this.drawShadow(ctx, centerX, height - 6, width * 0.22, 4);

    switch (type) {
      case 'rat': {
        const body = ctx.createLinearGradient(8, 8, 24, 24);
        body.addColorStop(0, '#8d7d6d');
        body.addColorStop(1, '#4d4035');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.ellipse(centerX - 1, centerY + 4, 10, 7.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 8, centerY + 1, 6.5, 5.5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b9999a';
        ctx.beginPath();
        ctx.arc(centerX + 11, centerY - 3, 2.2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 3.5, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ba8fa2';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY + 5);
        ctx.bezierCurveTo(centerX - 18, centerY + 2 + pulse * 2, centerX - 16, centerY - 5, centerX - 7, centerY - 6);
        ctx.stroke();
        ctx.fillStyle = '#ff5454';
        ctx.beginPath();
        ctx.arc(centerX + 11, centerY + 1, 1.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'bat': {
        const wingLift = [0, -4, 0, 3][frame];
        ctx.fillStyle = '#2c2342';
        ctx.beginPath();
        ctx.moveTo(centerX - 2, centerY + 2);
        ctx.quadraticCurveTo(centerX - 13, centerY - 10 + wingLift, 4, centerY + 4);
        ctx.quadraticCurveTo(10, centerY + 8, centerX - 2, centerY + 7);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 2, centerY + 2);
        ctx.quadraticCurveTo(centerX + 13, centerY - 10 + wingLift, width - 4, centerY + 4);
        ctx.quadraticCurveTo(width - 10, centerY + 8, centerX + 2, centerY + 7);
        ctx.fill();
        ctx.fillStyle = '#493066';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 6, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#60d4ff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#60d4ff';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY + 4, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 2, centerY + 4, 1, 0, Math.PI * 2);
        ctx.fill();
        this.resetEffects(ctx);
        break;
      }
      case 'ghost': {
        const ghost = ctx.createLinearGradient(8, 7, 24, 26);
        ghost.addColorStop(0, '#eef4ff');
        ghost.addColorStop(0.55, '#b2d3ff');
        ghost.addColorStop(1, '#7ca8ff');
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = 'rgba(143,190,255,0.75)';
        ctx.fillStyle = ghost;
        ctx.beginPath();
        ctx.moveTo(8, 20);
        ctx.quadraticCurveTo(8, 8, centerX, 6);
        ctx.quadraticCurveTo(24, 8, 24, 20);
        ctx.lineTo(24, 24);
        for (let i = 0; i < 4; i++) {
          ctx.quadraticCurveTo(21 - i * 4, 29 + (i % 2 === 0 ? pulse : -pulse), 18 - i * 4, 24);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#24345f';
        ctx.beginPath();
        ctx.arc(centerX - 3, 16, 1.4, 0, Math.PI * 2);
        ctx.arc(centerX + 3, 16, 1.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'knight': {
        const metal = ctx.createLinearGradient(8, 5, 24, 27);
        metal.addColorStop(0, '#d0d8e8');
        metal.addColorStop(1, '#57647a');
        this.fillRoundRect(ctx, 9, 7, 14, 19, 6, metal);
        ctx.fillStyle = '#3b4556';
        this.fillRoundRect(ctx, 10, 5, 12, 8, 5, '#c4cede');
        ctx.fillRect(14, 8, 4, 8);
        ctx.fillStyle = '#841f38';
        ctx.beginPath();
        ctx.moveTo(16, 4);
        ctx.quadraticCurveTo(21 + pulse, 7, 17, 12);
        ctx.lineTo(15, 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f6d06e';
        ctx.fillRect(6 + frame, 12, 4, 2);
        break;
      }
      case 'spider': {
        ctx.fillStyle = '#241b32';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 3, 7.5, 6.5, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX, centerY - 3, 5.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#17101f';
        ctx.lineWidth = 2;
        for (let side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            const y = 10 + i * 4;
            ctx.beginPath();
            ctx.moveTo(centerX + side * 4, y);
            ctx.quadraticCurveTo(centerX + side * (10 + i * 1.3), y - 3 + pulse, centerX + side * (13 + i * 1.4), y + 3);
            ctx.stroke();
          }
        }
        ctx.fillStyle = '#ff6161';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - 4, 1.1, 0, Math.PI * 2);
        ctx.arc(centerX + 2, centerY - 4, 1.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'skeleton': {
        const bone = ctx.createLinearGradient(11, 7, 21, 27);
        bone.addColorStop(0, '#fffff2');
        bone.addColorStop(1, '#b8c1c0');
        ctx.fillStyle = bone;
        ctx.beginPath();
        ctx.arc(centerX, 10, 6.5, 0, Math.PI * 2);
        ctx.fill();
        this.fillRoundRect(ctx, 12, 16, 8, 10, 3, '#dce2dc');
        ctx.strokeStyle = '#dce2dc';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(centerX, 26);
        ctx.lineTo(centerX, 19);
        ctx.moveTo(10, 18);
        ctx.lineTo(22, 18);
        ctx.moveTo(13, 25);
        ctx.lineTo(10 + frame, 30);
        ctx.moveTo(19, 25);
        ctx.lineTo(22 - frame, 30);
        ctx.stroke();
        ctx.fillStyle = '#3f4f60';
        ctx.beginPath();
        ctx.arc(centerX - 2.4, 10, 1.1, 0, Math.PI * 2);
        ctx.arc(centerX + 2.4, 10, 1.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'gargoyle': {
        const stone = ctx.createLinearGradient(8, 6, 26, 28);
        stone.addColorStop(0, '#93a0a9');
        stone.addColorStop(1, '#4f5c66');
        ctx.fillStyle = stone;
        ctx.beginPath();
        ctx.moveTo(centerX, 6);
        ctx.lineTo(centerX - 3, 10);
        ctx.lineTo(centerX - 8, 12);
        ctx.lineTo(centerX - 9, 23);
        ctx.quadraticCurveTo(centerX, 30, centerX + 9, 23);
        ctx.lineTo(centerX + 8, 12);
        ctx.lineTo(centerX + 3, 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX - 8, 13);
        ctx.quadraticCurveTo(6, 9 + pulse, 4, 18);
        ctx.quadraticCurveTo(10, 18, 12, 22);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 8, 13);
        ctx.quadraticCurveTo(26, 9 + pulse, 28, 18);
        ctx.quadraticCurveTo(22, 18, 20, 22);
        ctx.fill();
        ctx.fillStyle = '#62ddff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#62ddff';
        ctx.beginPath();
        ctx.arc(centerX - 2.4, 15, 1.2, 0, Math.PI * 2);
        ctx.arc(centerX + 2.4, 15, 1.2, 0, Math.PI * 2);
        ctx.fill();
        this.resetEffects(ctx);
        break;
      }
      default:
        break;
    }
  }

  drawBossFigure(ctx, width, height, palette, options = {}) {
    const cx = width / 2;
    const headR = width * 0.14;
    const bodyTop = height * 0.28;
    const skirtBottom = height * 0.83;
    ctx.clearRect(0, 0, width, height);
    this.drawShadow(ctx, cx, height - 6, width * 0.22, 5, 0.18);

    ctx.save();
    ctx.shadowBlur = 22;
    ctx.shadowColor = options.aura || 'rgba(255,255,255,0.1)';
    const cape = ctx.createLinearGradient(0, bodyTop, width, skirtBottom);
    cape.addColorStop(0, this.tint(palette.secondary, 20));
    cape.addColorStop(1, this.tint(palette.secondary, -28));
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.18, bodyTop + 6);
    ctx.quadraticCurveTo(cx - width * 0.4, height * 0.58, cx - width * 0.22, skirtBottom);
    ctx.lineTo(cx + width * 0.22, skirtBottom);
    ctx.quadraticCurveTo(cx + width * 0.4, height * 0.58, cx + width * 0.18, bodyTop + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const robe = ctx.createLinearGradient(cx, bodyTop, cx, skirtBottom);
    robe.addColorStop(0, this.tint(palette.primary, 24));
    robe.addColorStop(0.55, palette.primary);
    robe.addColorStop(1, this.tint(palette.primary, -25));
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.16, bodyTop);
    ctx.lineTo(cx - width * 0.19, skirtBottom);
    ctx.quadraticCurveTo(cx, height * 0.92, cx + width * 0.19, skirtBottom);
    ctx.lineTo(cx + width * 0.16, bodyTop);
    ctx.quadraticCurveTo(cx, bodyTop - 12, cx - width * 0.16, bodyTop);
    ctx.fill();

    ctx.strokeStyle = palette.trim;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop + 1);
    ctx.lineTo(cx, skirtBottom - 4);
    ctx.moveTo(cx - width * 0.11, bodyTop + 7);
    ctx.lineTo(cx - width * 0.14, skirtBottom - 12);
    ctx.moveTo(cx + width * 0.11, bodyTop + 7);
    ctx.lineTo(cx + width * 0.14, skirtBottom - 12);
    ctx.stroke();

    this.drawFace(ctx, cx, height * 0.19, headR, palette.skin, options.eyeColor || '#1c1d27', options.blush || 'rgba(255,170,170,0.18)');
    if (options.wig) this.drawPowderedWig(ctx, cx, height * 0.17, headR * 0.95);
    else this.drawHair(ctx, cx, height * 0.17, headR, palette.hair || '#39251c', options.bowColor);

    if (options.crown) {
      ctx.fillStyle = palette.trim;
      ctx.beginPath();
      ctx.moveTo(cx - 8, height * 0.075);
      ctx.lineTo(cx - 4, height * 0.03);
      ctx.lineTo(cx, height * 0.075);
      ctx.lineTo(cx + 4, height * 0.03);
      ctx.lineTo(cx + 8, height * 0.075);
      ctx.closePath();
      ctx.fill();
      this.fillRoundRect(ctx, cx - 9, height * 0.075, 18, 4, 2, this.tint(palette.trim, -18));
    }

    if (options.staff) {
      ctx.strokeStyle = options.staffColor || '#7e5b2f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width - 10, bodyTop + 6);
      ctx.lineTo(width - 8, height - 8);
      ctx.stroke();
      ctx.fillStyle = palette.trim;
      ctx.beginPath();
      ctx.arc(width - 10, bodyTop + 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (options.weapon === 'quill') {
      ctx.strokeStyle = '#d8c89b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width - 13, bodyTop + 8);
      ctx.lineTo(width - 4, bodyTop - 6);
      ctx.stroke();
      ctx.fillStyle = '#f2f2ec';
      ctx.beginPath();
      ctx.ellipse(width - 4, bodyTop - 6, 3.5, 1.8, -0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (options.symbol === 'lightning') {
      ctx.fillStyle = '#9fe8ff';
      ctx.beginPath();
      ctx.moveTo(cx + 10, bodyTop + 2);
      ctx.lineTo(cx + 18, bodyTop + 6);
      ctx.lineTo(cx + 12, bodyTop + 12);
      ctx.lineTo(cx + 19, bodyTop + 14);
      ctx.lineTo(cx + 9, bodyTop + 24);
      ctx.lineTo(cx + 13, bodyTop + 15);
      ctx.lineTo(cx + 7, bodyTop + 12);
      ctx.closePath();
      ctx.fill();
    }

    if (options.darkCore) {
      const g = ctx.createRadialGradient(cx, bodyTop + 16, 1, cx, bodyTop + 16, 16);
      g.addColorStop(0, 'rgba(187,112,255,0.85)');
      g.addColorStop(1, 'rgba(30,0,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, bodyTop + 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  tint(hex, amount) {
    const clean = hex.replace('#', '');
    const num = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp(((num >> 16) & 255) + amount);
    const g = clamp(((num >> 8) & 255) + amount);
    const b = clamp((num & 255) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  generateMozart() {
    const frames = [
      { type: 'idle', sway: 0, leftArm: 0.1, rightArm: -0.1, leftLeg: 0.03, rightLeg: -0.03, capeFlow: 0.1 },
      { type: 'idle', sway: 1.1, leftArm: 0.18, rightArm: -0.15, leftLeg: 0.06, rightLeg: -0.06, capeFlow: 0.15, tilt: 0.03 },
      { type: 'idle', sway: -1.1, leftArm: 0.08, rightArm: -0.1, leftLeg: 0.03, rightLeg: -0.03, handToHead: true, capeFlow: 0.08, tilt: -0.03 },
      { type: 'run', tilt: 0.1, leftArm: -0.75, rightArm: 0.7, leftLeg: -0.7, rightLeg: 0.62, capeFlow: 0.8 },
      { type: 'run', tilt: 0.08, leftArm: -0.32, rightArm: 0.34, leftLeg: -0.35, rightLeg: 0.2, capeFlow: 0.55 },
      { type: 'run', tilt: 0.03, leftArm: 0.02, rightArm: -0.02, leftLeg: -0.08, rightLeg: 0.08, capeFlow: 0.3 },
      { type: 'run', tilt: -0.03, leftArm: 0.32, rightArm: -0.32, leftLeg: 0.2, rightLeg: -0.35, capeFlow: 0.25 },
      { type: 'run', tilt: -0.08, leftArm: 0.68, rightArm: -0.68, leftLeg: 0.62, rightLeg: -0.7, capeFlow: 0.22 },
      { type: 'run', tilt: -0.02, leftArm: 0.22, rightArm: -0.22, leftLeg: 0.1, rightLeg: -0.18, capeFlow: 0.28 },
      { type: 'jump', lift: -4, leftArm: -0.92, rightArm: 0.92, leftLeg: -0.42, rightLeg: -0.42, capeFlow: 0.55 },
      { type: 'fall', lift: -1, leftArm: 0.38, rightArm: -0.38, leftLeg: 0.18, rightLeg: 0.18, capeFlow: 0.2 },
      { type: 'hurt', sway: -1, tilt: -0.18, leftArm: 0.75, rightArm: -0.85, leftLeg: -0.18, rightLeg: 0.25, capeFlow: 0.5, hurt: true }
    ];

    const palette = {
      skin: '#f5ccb1',
      primary: '#466fdf',
      secondary: '#253f8d',
      trim: '#f5d370',
      cape: '#2b3d8b',
      stockings: '#f3f0ef',
      shoe: '#1c2138',
      wig: true,
      eyeColor: '#202234',
      blush: 'rgba(255,186,186,0.18)'
    };

    this.createCanvasSpriteSheet('mozart', 48, 72, frames.length, (ctx, width, height, frame) => {
      this.drawPlayableCharacter(ctx, width, height, palette, frames[frame]);
    });
  }

  generateNannerl() {
    const frames = [
      { type: 'idle', sway: 0, leftArm: 0.08, rightArm: -0.08, leftLeg: 0.03, rightLeg: -0.03 },
      { type: 'idle', sway: 1, leftArm: 0.15, rightArm: -0.1, leftLeg: 0.05, rightLeg: -0.05, tilt: 0.03 },
      { type: 'idle', sway: -1, leftArm: 0.02, rightArm: -0.12, leftLeg: 0.03, rightLeg: -0.03, handToHead: true, tilt: -0.03 },
      { type: 'run', tilt: 0.08, leftArm: -0.65, rightArm: 0.6, leftLeg: -0.58, rightLeg: 0.55 },
      { type: 'run', tilt: 0.04, leftArm: -0.28, rightArm: 0.28, leftLeg: -0.24, rightLeg: 0.18 },
      { type: 'run', leftArm: 0.04, rightArm: -0.04, leftLeg: -0.06, rightLeg: 0.06 },
      { type: 'run', tilt: -0.03, leftArm: 0.28, rightArm: -0.28, leftLeg: 0.18, rightLeg: -0.24 },
      { type: 'run', tilt: -0.08, leftArm: 0.62, rightArm: -0.62, leftLeg: 0.55, rightLeg: -0.58 },
      { type: 'run', tilt: -0.02, leftArm: 0.2, rightArm: -0.2, leftLeg: 0.08, rightLeg: -0.15 },
      { type: 'jump', lift: -4, leftArm: -0.8, rightArm: 0.8, leftLeg: -0.32, rightLeg: -0.32 },
      { type: 'fall', lift: -1, leftArm: 0.28, rightArm: -0.28, leftLeg: 0.14, rightLeg: 0.14 },
      { type: 'hurt', sway: 1, tilt: 0.18, leftArm: 0.72, rightArm: -0.78, leftLeg: -0.12, rightLeg: 0.18, hurt: true }
    ];

    const palette = {
      skin: '#f6d2bb',
      primary: '#ef94b9',
      secondary: '#b8518c',
      trim: '#fff3cf',
      dress: true,
      hair: '#7b5032',
      bowColor: '#ffe8f6',
      apron: 'rgba(255,255,255,0.55)',
      shoe: '#683257',
      eyeColor: '#3b2a33',
      blush: 'rgba(255,155,182,0.22)'
    };

    this.createCanvasSpriteSheet('nannerl', 48, 72, frames.length, (ctx, width, height, frame) => {
      this.drawPlayableCharacter(ctx, width, height, palette, frames[frame]);
    });
  }

  generateEnemies() {
    const modernEnemies = [
      'enemy_rat',
      'enemy_bat',
      'enemy_ghost',
      'enemy_knight',
      'enemy_spider',
      'enemy_skeleton',
      'enemy_gargoyle'
    ];

    modernEnemies.forEach((key) => {
      const type = key.replace('enemy_', '');
      this.createCanvasSpriteSheet(key, 32, 32, 4, (ctx, width, height, frame) => {
        this.drawEnemy(ctx, width, height, type, frame);
      });
    });

    this.createCanvasTexture('singer', 32, 48, (ctx, width, height) => {
      this.drawNPC(ctx, width, height, {
        skin: '#f1c8af', primary: '#6a213d', secondary: '#2f0f1d', trim: '#f3d277', dress: true,
        hair: '#21161a', shoe: '#2f1020', eyeColor: '#22151f'
      }, 4);
      this.drawNoteGlyph(ctx, 6, 18, 2.2, '#fff3b0', 'rgba(255,243,176,0.9)');
    });

    this.createCanvasTexture('drumTroll', 32, 32, (ctx) => {
      const skin = ctx.createLinearGradient(10, 6, 22, 26);
      skin.addColorStop(0, '#8db465');
      skin.addColorStop(1, '#466b32');
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(16, 12, 8.5, 0, Math.PI * 2);
      ctx.fill();
      this.fillRoundRect(ctx, 8, 16, 16, 10, 5, '#6a3d23');
      this.fillRoundRect(ctx, 9, 17, 14, 8, 4, '#d6b16f');
      ctx.fillStyle = '#ff845f';
      ctx.beginPath();
      ctx.arc(13, 12, 1.2, 0, Math.PI * 2);
      ctx.arc(19, 12, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    this.createCanvasSpriteSheet('dissonantNote', 32, 32, 8, (ctx, width, height, frame) => {
      const aggro = frame >= 4;
      const localFrame = frame % 4;
      const glow = aggro ? 'rgba(255,90,160,0.95)' : 'rgba(112,205,255,0.95)';
      const color = aggro ? '#ff6aa9' : '#c9f4ff';
      ctx.clearRect(0, 0, width, height);
      this.drawShadow(ctx, 16, 27, 7, 3, 0.1);
      this.drawNoteGlyph(ctx, 12 + Math.sin(localFrame * Math.PI / 2) * 1.2, 13, 3.2, color, glow);
      this.drawSparkle(ctx, 23, 8 + localFrame, 4, aggro ? '#ffd0f0' : '#ffffff', 0.8);
    });

    this.createCanvasTexture('brokenInstrument', 32, 32, (ctx) => {
      this.drawShadow(ctx, 16, 28, 8, 3, 0.12);
      ctx.strokeStyle = '#8f613a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(9, 7);
      ctx.lineTo(23, 23);
      ctx.stroke();
      ctx.strokeStyle = '#d6a66d';
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.lineTo(22, 20);
      ctx.stroke();
      ctx.strokeStyle = '#ff6a6a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, 22);
      ctx.lineTo(19, 14);
      ctx.stroke();
      this.drawSparkle(ctx, 20, 12, 4, '#fff7bf', 0.8);
    });
  }

  generateNPCs() {
    const npcs = {
      npc_haydn: {
        skin: '#f1ccb8', primary: '#5ea36f', secondary: '#274e36', trim: '#e4e3c0', wig: true, shoe: '#22342a', eyeColor: '#20231e'
      },
      npc_salieri: {
        skin: '#eec3ac', primary: '#3a2237', secondary: '#0f0c1e', trim: '#d0a55f', hair: '#161118', shoe: '#170d17', eyeColor: '#191119'
      },
      npc_nannerl: {
        skin: '#f6d2bb', primary: '#ef94b9', secondary: '#b8518c', trim: '#fff3cf', dress: true, hair: '#7b5032', bowColor: '#ffe8f6', apron: 'rgba(255,255,255,0.55)', shoe: '#683257', eyeColor: '#3b2a33'
      },
      npc_leopold: {
        skin: '#efc9b6', primary: '#5f6987', secondary: '#2b3147', trim: '#d7d9ec', wig: true, shoe: '#1d2439', eyeColor: '#20233a'
      },
      npc_constanze: {
        skin: '#f6d4c0', primary: '#93cce6', secondary: '#4d92b9', trim: '#fff1ca', dress: true, hair: '#8a5d40', bowColor: '#e7fbff', apron: 'rgba(255,255,255,0.5)', shoe: '#446b84', eyeColor: '#223542'
      },
      npc_beethoven: {
        skin: '#ebc4ae', primary: '#6c5d8f', secondary: '#35294f', trim: '#f2ddac', hair: '#53442d', shoe: '#251d33', eyeColor: '#262132'
      }
    };

    Object.entries(npcs).forEach(([key, palette]) => {
      this.createCanvasSpriteSheet(key, 32, 48, 5, (ctx, width, height, frame) => {
        this.drawNPC(ctx, width, height, palette, frame);
      });
    });
  }

  generateBosses() {
    this.createCanvasTexture('bossLeopoldMozart', 40, 48, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#efc9b6', primary: '#596789', secondary: '#25324d', trim: '#f0d56f'
      }, { wig: true, aura: 'rgba(131,156,255,0.28)', staff: true });
    });

    this.createCanvasTexture('bossEmpressMaria', 40, 48, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#f1d0bd', primary: '#c18fcb', secondary: '#6a3e7a', trim: '#ffd86f', hair: '#d8d4d0'
      }, { crown: true, aura: 'rgba(255,214,111,0.3)', wig: true, bowColor: '#fff0ff' });
    });

    this.createCanvasSpriteSheet('bossArchbishopColloredo', 40, 48, 4, (ctx, width, height, frame) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#ecc6b0', primary: '#b4404f', secondary: '#631924', trim: '#f0d27d', hair: '#8b8b93'
      }, { wig: true, aura: frame % 2 === 0 ? 'rgba(255,180,120,0.2)' : 'rgba(255,220,160,0.3)', staff: true, staffColor: '#c9984a' });
    });

    this.createCanvasSpriteSheet('bossSalieri', 36, 48, 4, (ctx, width, height, frame) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#e8c0a8', primary: '#2f213a', secondary: '#0d0914', trim: '#c9a260', hair: '#141119'
      }, { aura: frame % 2 === 0 ? 'rgba(164,106,255,0.25)' : 'rgba(95,139,255,0.22)', staff: true, staffColor: '#644ac9' });
      ctx.strokeStyle = '#f2d8a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 20 + frame * 0.6);
      ctx.quadraticCurveTo(15, 14 - frame * 0.6, 24, 18);
      ctx.stroke();
    });

    this.createCanvasTexture('bossMuzioClementi', 36, 44, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#edc7af', primary: '#8c5b35', secondary: '#42230f', trim: '#eec37b', hair: '#3d2618'
      }, { aura: 'rgba(255,193,103,0.25)', weapon: 'quill' });
    });
    this.createCanvasTexture('bossClementi', 36, 44, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#edc7af', primary: '#8c5b35', secondary: '#42230f', trim: '#eec37b', hair: '#3d2618'
      }, { aura: 'rgba(255,193,103,0.25)', weapon: 'quill' });
    });

    this.createCanvasTexture('bossBeethovenYoung', 40, 48, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#efc6ae', primary: '#4f566d', secondary: '#242b3a', trim: '#9fe8ff', hair: '#5d4b31'
      }, { aura: 'rgba(159,232,255,0.35)', symbol: 'lightning' });
    });

    this.createCanvasTexture('bossGreyMessenger', 40, 48, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#e8c2ad', primary: '#727885', secondary: '#353944', trim: '#c8d7e6', hair: '#524a44'
      }, { aura: 'rgba(220,240,255,0.24)', symbol: 'lightning' });
    });

    this.createCanvasTexture('bossDarkMaestro', 48, 56, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#d9c1b7', primary: '#1f1633', secondary: '#08050d', trim: '#b777ff', hair: '#0d0914'
      }, { aura: 'rgba(183,119,255,0.36)', darkCore: true, staff: true, staffColor: '#8b57ff' });
    });

    this.createCanvasTexture('bossMozartShadow', 48, 56, (ctx, width, height) => {
      this.drawBossFigure(ctx, width, height, {
        skin: '#c4bac7', primary: '#251833', secondary: '#0b0710', trim: '#8fc6ff'
      }, { wig: true, aura: 'rgba(143,198,255,0.28)', darkCore: true, staff: true, staffColor: '#7cb6ff' });
    });

    this.generateBossProjectiles();
  }

  generateBossProjectiles() {
    const orb = (key, colors, symbol) => {
      this.createCanvasTexture(key, 16, 16, (ctx, width, height) => {
        const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
        g.addColorStop(0, colors[0]);
        g.addColorStop(0.65, colors[1]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        if (symbol === 'note') this.drawNoteGlyph(ctx, 5.5, 6.5, 1.45, '#fffef5', colors[1]);
        if (symbol === 'bolt') {
          ctx.fillStyle = '#fffef5';
          ctx.beginPath();
          ctx.moveTo(8, 2);
          ctx.lineTo(5.5, 8);
          ctx.lineTo(8.5, 8);
          ctx.lineTo(7, 14);
          ctx.lineTo(11, 7.5);
          ctx.lineTo(8.2, 7.5);
          ctx.closePath();
          ctx.fill();
        }
        if (symbol === 'ring') {
          ctx.strokeStyle = '#fffef5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(8, 8, 4.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    };

    orb('bossProjectile', ['rgba(255,246,198,0.95)', 'rgba(255,174,76,0.65)'], 'bolt');
    orb('darkProjectile', ['rgba(208,160,255,0.95)', 'rgba(90,40,140,0.7)'], 'ring');
    orb('chainProjectile', ['rgba(211,228,255,0.95)', 'rgba(95,120,160,0.7)'], 'ring');
    orb('bossShockwave', ['rgba(255,255,255,0.9)', 'rgba(113,204,255,0.3)'], 'ring');
    orb('bossGuardProjectile', ['rgba(255,229,171,0.95)', 'rgba(197,123,54,0.72)'], 'bolt');
    orb('bossCoinProjectile', ['rgba(255,244,183,0.95)', 'rgba(255,188,64,0.78)'], 'ring');
    orb('bossChandelierProjectile', ['rgba(255,249,223,0.95)', 'rgba(255,195,118,0.75)'], 'bolt');
    orb('bossNoteProjectile', ['rgba(255,255,255,0.95)', 'rgba(124,202,255,0.7)'], 'note');
    orb('bossInkProjectile', ['rgba(216,209,255,0.95)', 'rgba(59,40,120,0.8)'], 'ring');
    orb('bossBillProjectile', ['rgba(249,255,230,0.95)', 'rgba(121,201,143,0.75)'], 'bolt');

    this.createCanvasTexture('bossMinion', 24, 24, (ctx, width, height) => {
      this.drawEnemy(ctx, width, height, 'ghost', 1);
    });

    this.createCanvasTexture('mozartNote', 16, 16, (ctx, width, height) => {
      const g = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.75, 'rgba(116,171,255,0.72)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(8, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      this.drawNoteGlyph(ctx, 5.5, 6.5, 1.4, '#ffffff', 'rgba(255,255,255,0.8)');
    });
  }

  generateTiles() {
    const stoneTile = (key, colors) => {
      this.createCanvasTexture(key, TILE_SIZE, TILE_SIZE, (ctx, width, height) => {
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, colors[0]);
        g.addColorStop(0.5, colors[1]);
        g.addColorStop(1, colors[2]);
        this.fillRoundRect(ctx, 0, 0, width, height, 10, g);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let y = 10; y < height; y += 10) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        for (let x = 10; x < width; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = `rgba(255,255,255,${0.03 + i * 0.005})`;
          ctx.beginPath();
          ctx.arc((i * 17) % width, (i * 11) % height, 1.3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    stoneTile('ground', ['#8a6846', '#6a4b30', '#4f3625']);

    this.createCanvasTexture('platform', TILE_SIZE, TILE_SIZE / 2, (ctx, width, height) => {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, '#a77c52');
      g.addColorStop(1, '#684528');
      this.fillRoundRect(ctx, 0, 0, width, height, 10, g);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(4, 3, width - 8, 3);
      ctx.strokeStyle = 'rgba(52,31,17,0.4)';
      ctx.lineWidth = 2;
      for (let x = 6; x < width; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 4);
        ctx.lineTo(x, height - 4);
        ctx.stroke();
      }
    });

    this.createCanvasTexture('building', TILE_SIZE, TILE_SIZE, (ctx, width, height) => {
      const wall = ctx.createLinearGradient(0, 0, 0, height);
      wall.addColorStop(0, '#e7d7be');
      wall.addColorStop(1, '#b79469');
      this.fillRoundRect(ctx, 0, 0, width, height, 8, wall);
      this.fillRoundRect(ctx, 7, 6, 10, 12, 3, '#a8d2eb');
      this.fillRoundRect(ctx, 23, 6, 10, 12, 3, '#a8d2eb');
      this.fillRoundRect(ctx, 14, 21, 12, 17, 4, '#6a4326');
      ctx.fillStyle = '#8f5f3a';
      ctx.beginPath();
      ctx.moveTo(3, 8);
      ctx.lineTo(width / 2, 1);
      ctx.lineTo(width - 3, 8);
      ctx.closePath();
      ctx.fill();
    });

    stoneTile('viennaGround', ['#c9b7a5', '#a08873', '#775f4f']);
    stoneTile('gardenGround', ['#7ac16a', '#4f8e47', '#315934']);
    stoneTile('castleGround', ['#a8b1c1', '#717c8f', '#50596b']);
    stoneTile('theaterGround', ['#82504a', '#5a2e32', '#35181f']);
    stoneTile('mountainGround', ['#8f8b96', '#66616d', '#44404c']);
    stoneTile('caveGround', ['#54506d', '#2c2942', '#18162a']);
    stoneTile('skyGround', ['#d7f3ff', '#9ed8ff', '#69b1ec']);

    stoneTile('forestGround', ['#7ac16a', '#4f8e47', '#315934']);
    stoneTile('palaceGround', ['#a8b1c1', '#717c8f', '#50596b']);
    stoneTile('operaGround', ['#82504a', '#5a2e32', '#35181f']);
  }

  drawInstrument(ctx, width, height, type) {
    ctx.clearRect(0, 0, width, height);
    this.drawShadow(ctx, width / 2, height - 4, width * 0.2, 4, 0.1);
    switch (type) {
      case 'violin':
        ctx.fillStyle = '#9f5c2b';
        ctx.beginPath();
        ctx.ellipse(16, 22, 5.5, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(16, 11, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(14.8, 3, 2.4, 22);
        ctx.strokeStyle = '#f2d9b4';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(14 + i * 1.3, 4);
          ctx.lineTo(14 + i * 1.3, 25);
          ctx.stroke();
        }
        break;
      case 'piano':
        this.fillRoundRect(ctx, 5, 12, 22, 13, 4, '#10141d');
        this.fillRoundRect(ctx, 7, 13, 18, 10, 3, '#1e2430');
        for (let i = 0; i < 6; i++) this.fillRoundRect(ctx, 8 + i * 3, 16, 2.4, 7, 1, '#f6f1e5');
        ctx.fillStyle = '#d3a55f';
        ctx.beginPath();
        ctx.moveTo(5, 12);
        ctx.lineTo(27, 12);
        ctx.lineTo(24, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        break;
      case 'flute':
        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate(-0.35);
        this.fillRoundRect(ctx, -11, -3, 22, 6, 3, '#d8ebf7');
        ctx.fillStyle = '#9eb6c5';
        for (let i = -7; i <= 7; i += 4) {
          ctx.beginPath();
          ctx.arc(i, 0, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      case 'trumpet':
        ctx.fillStyle = '#efc157';
        ctx.beginPath();
        ctx.moveTo(8, 17);
        ctx.lineTo(21, 17);
        ctx.lineTo(27, 11);
        ctx.lineTo(27, 23);
        ctx.closePath();
        ctx.fill();
        this.fillRoundRect(ctx, 6, 14, 7, 6, 2, '#efc157');
        ctx.fillRect(11, 11, 2, 4);
        ctx.fillRect(14, 11, 2, 4);
        ctx.fillRect(17, 11, 2, 4);
        break;
      case 'harp':
        ctx.strokeStyle = '#d8ac4c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(11, 25);
        ctx.quadraticCurveTo(12, 5, 22, 7);
        ctx.lineTo(22, 25);
        ctx.stroke();
        ctx.strokeStyle = '#f6ead3';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(12 + i * 2, 24);
          ctx.lineTo(21, 8 + i * 3);
          ctx.stroke();
        }
        break;
      case 'organ':
        this.fillRoundRect(ctx, 6, 13, 20, 12, 4, '#6b4b30');
        ctx.fillStyle = '#c59e58';
        [9, 13, 17, 21].forEach((x, i) => this.fillRoundRect(ctx, x, 6 - i % 2, 3, 11 + i * 1.5, 1.5, '#b78a43'));
        for (let i = 0; i < 5; i++) this.fillRoundRect(ctx, 8 + i * 3.2, 18, 2.2, 6, 1, '#f6f1e5');
        break;
      case 'baton':
        ctx.strokeStyle = '#f6f2ea';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, 24);
        ctx.lineTo(24, 8);
        ctx.stroke();
        ctx.fillStyle = '#b9e6ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#b9e6ff';
        ctx.beginPath();
        ctx.arc(24, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        this.resetEffects(ctx);
        break;
      case 'harpsichord':
        this.fillRoundRect(ctx, 4, 13, 24, 11, 3, '#613c28');
        ctx.fillStyle = '#d8b363';
        ctx.beginPath();
        ctx.moveTo(4, 13);
        ctx.lineTo(28, 13);
        ctx.lineTo(24, 8);
        ctx.lineTo(7, 8);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 6; i++) this.fillRoundRect(ctx, 7 + i * 3.1, 17, 2.1, 5.5, 1, '#f6f1e5');
        break;
      case 'drums':
        this.fillRoundRect(ctx, 9, 13, 14, 10, 4, '#c84d4d');
        ctx.strokeStyle = '#f5dfb3';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(9.75, 14, 12.5, 8.5);
        ctx.strokeStyle = '#caa16a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 10);
        ctx.lineTo(14, 17);
        ctx.moveTo(24, 10);
        ctx.lineTo(18, 17);
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  generateItems() {
    this.createCanvasTexture('note', 32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.45, 'rgba(255,244,156,0.92)');
      g.addColorStop(1, 'rgba(255,176,66,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      this.drawNoteGlyph(ctx, 11, 10, 3.2, '#fffdf7', 'rgba(255,247,171,0.95)');
      this.drawSparkle(ctx, 24, 9, 4, '#ffffff', 0.85);
    });
    this.createCanvasTexture('musicNote', 32, 32, (ctx, width, height) => {
      const g = ctx.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, 15);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.45, 'rgba(255,244,156,0.92)');
      g.addColorStop(1, 'rgba(255,176,66,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 15, 0, Math.PI * 2);
      ctx.fill();
      this.drawNoteGlyph(ctx, 11, 10, 3.2, '#fffdf7', 'rgba(255,247,171,0.95)');
      this.drawSparkle(ctx, 24, 9, 4, '#ffffff', 0.85);
    });

    this.createCanvasTexture('heart', 32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 14, 1, 16, 16, 15);
      g.addColorStop(0, '#ffb5cb');
      g.addColorStop(1, '#d4305f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(16, 26);
      ctx.bezierCurveTo(4, 18, 6, 8, 12, 8);
      ctx.bezierCurveTo(15, 8, 16, 11, 16, 11);
      ctx.bezierCurveTo(16, 11, 17, 8, 20, 8);
      ctx.bezierCurveTo(26, 8, 28, 18, 16, 26);
      ctx.fill();
      this.drawSparkle(ctx, 23, 9, 4, '#ffdfe9', 0.65);
    });

    this.createCanvasTexture('star', 32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16, 16, 1, 16, 16, 14);
      g.addColorStop(0, '#fff8d8');
      g.addColorStop(1, '#f3ba36');
      ctx.fillStyle = g;
      this.drawSparkle(ctx, 16, 16, 12, '#ffe47e', 1);
      this.drawSparkle(ctx, 16, 16, 6, '#fff8e2', 1);
    });

    this.createCanvasTexture('sheetMusic', 32, 40, (ctx) => {
      const page = ctx.createLinearGradient(0, 0, 0, 40);
      page.addColorStop(0, '#fffdf3');
      page.addColorStop(1, '#efe5cb');
      this.fillRoundRect(ctx, 6, 4, 20, 30, 4, page);
      ctx.fillStyle = '#d9ceb2';
      ctx.beginPath();
      ctx.moveTo(22, 4);
      ctx.lineTo(26, 8);
      ctx.lineTo(22, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6f7ea5';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(9, 12 + i * 5);
        ctx.lineTo(23, 12 + i * 5);
        ctx.stroke();
      }
      this.drawNoteGlyph(ctx, 12, 12, 1.6, '#43507a', 'rgba(0,0,0,0)');
    });

    const instruments = {
      instrument_violin: 'violin',
      instrument_piano: 'piano',
      instrument_flute: 'flute',
      instrument_trumpet: 'trumpet',
      instrument_harp: 'harp',
      instrument_organ: 'organ',
      instrument_conductor_baton: 'baton',
      violin: 'violin',
      piano: 'piano',
      flute: 'flute',
      trumpet: 'trumpet',
      harp: 'harp',
      organ: 'organ',
      harpsichord: 'harpsichord',
      drums: 'drums'
    };

    Object.entries(instruments).forEach(([key, type]) => {
      this.createCanvasTexture(key, 32, 32, (ctx, width, height) => this.drawInstrument(ctx, width, height, type));
    });
  }

  generateCheckpointAndUI() {
    const drawCheckpoint = (ctx, width, height, active) => {
      ctx.clearRect(0, 0, width, height);
      this.drawShadow(ctx, width / 2, height - 4, width * 0.18, 4, 0.12);
      ctx.strokeStyle = '#775533';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(11, height - 4);
      ctx.lineTo(11, 7);
      ctx.stroke();
      const flag = ctx.createLinearGradient(11, 8, 29, 24);
      flag.addColorStop(0, active ? '#fff5ae' : '#dfe8f5');
      flag.addColorStop(1, active ? '#ff9d48' : '#8ab1db');
      ctx.fillStyle = flag;
      ctx.beginPath();
      ctx.moveTo(13, 8);
      ctx.quadraticCurveTo(26, 7, 28, 14);
      ctx.quadraticCurveTo(20, 18, 13, 22);
      ctx.closePath();
      ctx.fill();
      if (active) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,204,102,0.8)';
        this.drawSparkle(ctx, 24, 9, 5, '#fff0bc', 0.9);
        this.resetEffects(ctx);
      }
    };

    this.createCanvasTexture('checkpoint', 32, 40, (ctx, width, height) => drawCheckpoint(ctx, width, height, false));
    this.createCanvasTexture('checkpoint_active', 32, 40, (ctx, width, height) => drawCheckpoint(ctx, width, height, true));
    this.createCanvasTexture('checkpointFlag', 32, 40, (ctx, width, height) => drawCheckpoint(ctx, width, height, false));

    this.createCanvasTexture('dialogBubble', 64, 48, (ctx, width, height) => {
      const bubble = ctx.createLinearGradient(0, 0, 0, height);
      bubble.addColorStop(0, 'rgba(255,255,255,0.98)');
      bubble.addColorStop(1, 'rgba(232,242,255,0.95)');
      this.fillRoundRect(ctx, 4, 4, width - 8, height - 14, 14, bubble);
      this.strokeRoundRect(ctx, 4, 4, width - 8, height - 14, 14, 'rgba(91,122,160,0.45)', 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(22, height - 14);
      ctx.lineTo(16, height - 4);
      ctx.lineTo(29, height - 14);
      ctx.closePath();
      ctx.fill();
      this.drawSparkle(ctx, 48, 14, 5, '#d2ecff', 0.8);
    });

    this.createCanvasTexture('mozartHead', 28, 28, (ctx) => {
      this.drawFace(ctx, 14, 14, 8, '#f5ccb1', '#22273b', 'rgba(255,186,186,0.18)');
      this.drawPowderedWig(ctx, 14, 13, 7.5);
    });
  }

  generateBackgrounds() {
    const create = (key, oldKey, drawFn) => {
      this.createCanvasTexture(key, BACKGROUND_WIDTH, BACKGROUND_HEIGHT, drawFn);
      if (oldKey) this.createCanvasTexture(oldKey, BACKGROUND_WIDTH, BACKGROUND_HEIGHT, drawFn);
    };

    create('bg_vienna', 'bgVienna', (ctx, width, height) => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#ffe5cc');
      sky.addColorStop(0.45, '#f3c2b1');
      sky.addColorStop(1, '#7a97c6');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
      const sun = ctx.createRadialGradient(170, 100, 10, 170, 100, 110);
      sun.addColorStop(0, 'rgba(255,243,189,0.85)');
      sun.addColorStop(1, 'rgba(255,243,189,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      [[120, 90, 54], [340, 70, 44], [650, 110, 58]].forEach(([x, y, s]) => {
        ctx.beginPath();
        ctx.arc(x, y, s * 0.35, 0, Math.PI * 2);
        ctx.arc(x + s * 0.25, y - s * 0.1, s * 0.28, 0, Math.PI * 2);
        ctx.arc(x + s * 0.5, y, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(118,86,74,0.35)';
      for (let i = 0; i < 11; i++) {
        const x = i * 78;
        const h = 95 + (i % 3) * 28;
        ctx.fillRect(x, height - h - 55, 58, h);
        ctx.beginPath();
        ctx.moveTo(x - 2, height - h - 55);
        ctx.lineTo(x + 29, height - h - 76 - (i % 2) * 10);
        ctx.lineTo(x + 60, height - h - 55);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(84,61,52,0.52)';
      for (let i = 0; i < 6; i++) {
        const x = i * 135 + 20;
        const h = 130 + (i % 2) * 34;
        ctx.fillRect(x, height - h - 30, 98, h);
        for (let wy = 0; wy < 3; wy++) {
          for (let wx = 0; wx < 3; wx++) {
            this.fillRoundRect(ctx, x + 13 + wx * 28, height - h - 12 + wy * 34, 11, 16, 2, 'rgba(255,241,202,0.25)');
          }
        }
      }
    });

    create('bg_garden', 'bgForest', (ctx, width, height) => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#b6f0ff');
      sky.addColorStop(0.6, '#a9d7a0');
      sky.addColorStop(1, '#4e8852');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.bezierCurveTo(120, 230, 250, 260, 390, 220);
      ctx.bezierCurveTo(520, 180, 670, 240, width, 210);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 90;
        ctx.fillStyle = 'rgba(58,79,41,0.3)';
        ctx.fillRect(x + 12, 250, 10, 140);
        ctx.fillStyle = 'rgba(69,128,64,0.38)';
        ctx.beginPath();
        ctx.arc(x + 17, 220, 34, 0, Math.PI * 2);
        ctx.arc(x - 2, 235, 22, 0, Math.PI * 2);
        ctx.arc(x + 34, 236, 24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      this.fillRoundRect(ctx, 320, 210, 160, 12, 6, 'rgba(242,247,228,0.3)');
      ctx.strokeStyle = 'rgba(242,247,228,0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(350, 222);
      ctx.lineTo(350, 300);
      ctx.moveTo(450, 222);
      ctx.lineTo(450, 300);
      ctx.stroke();
    });

    create('bg_castle', 'bgPalace', (ctx, width, height) => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#1b173b');
      sky.addColorStop(0.58, '#40235c');
      sky.addColorStop(1, '#2d3248');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 45; i++) this.drawSparkle(ctx, (i * 137) % width, (i * 89) % 250, 2 + (i % 2), '#ffffff', 0.55);
      ctx.fillStyle = 'rgba(38,28,57,0.78)';
      [60, 180, 340, 500, 660].forEach((x, i) => {
        const towerH = 170 + (i % 2) * 50;
        ctx.fillRect(x, height - towerH - 50, 58, towerH);
        ctx.beginPath();
        ctx.moveTo(x - 3, height - towerH - 50);
        ctx.lineTo(x + 29, height - towerH - 90);
        ctx.lineTo(x + 61, height - towerH - 50);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillRect(40, height - 140, 720, 90);
      ctx.fillStyle = 'rgba(255,224,154,0.12)';
      for (let i = 0; i < 16; i++) this.fillRoundRect(ctx, 70 + i * 40, height - 120, 14, 22, 3, 'rgba(255,224,154,0.14)');
    });

    create('bg_theater', 'bgOpera', (ctx, width, height) => {
      const wall = ctx.createLinearGradient(0, 0, 0, height);
      wall.addColorStop(0, '#401018');
      wall.addColorStop(0.55, '#641b2a');
      wall.addColorStop(1, '#17070b');
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(125,18,48,0.8)';
      for (let i = 0; i < 6; i++) {
        const x = i * 140;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 70, 100, x + 140, 0);
        ctx.lineTo(x + 140, 180);
        ctx.quadraticCurveTo(x + 70, 120, x, 180);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,231,175,0.13)';
      ctx.beginPath();
      ctx.arc(400, 100, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#502112';
      ctx.fillRect(0, height - 80, width, 80);
      ctx.fillStyle = 'rgba(255,215,152,0.15)';
      for (let i = 0; i < 5; i++) this.fillRoundRect(ctx, 80 + i * 150, 230, 70, 120, 20, 'rgba(255,255,255,0.05)');
    });

    create('bg_mountain', 'bgMountain', (ctx, width, height) => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#8bd4ff');
      sky.addColorStop(0.45, '#d6f0ff');
      sky.addColorStop(1, '#688bb8');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
      const sun = ctx.createRadialGradient(620, 100, 10, 620, 100, 100);
      sun.addColorStop(0, 'rgba(255,241,187,0.88)');
      sun.addColorStop(1, 'rgba(255,241,187,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, width, height);
      const layers = [
        { color: 'rgba(135,160,190,0.45)', y: 310, amp: 90 },
        { color: 'rgba(95,115,145,0.6)', y: 340, amp: 120 },
        { color: 'rgba(66,77,97,0.8)', y: 390, amp: 140 }
      ];
      layers.forEach((layer, index) => {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, layer.y);
        for (let x = 0; x <= width; x += 120) {
          ctx.lineTo(x, layer.y - (index % 2 === 0 ? layer.amp : layer.amp * 0.65) * ((x / 120) % 2 === 0 ? 1 : 0.45));
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      });
    });

    create('bg_cave', 'bgCaves', (ctx, width, height) => {
      const cave = ctx.createLinearGradient(0, 0, 0, height);
      cave.addColorStop(0, '#1a1730');
      cave.addColorStop(1, '#06050e');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(67,61,101,0.75)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= width; x += 60) ctx.lineTo(x, 30 + (x % 120 === 0 ? 20 : 0));
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(112, 97, 184, 0.35)';
      [[120, 260, 28], [320, 210, 22], [510, 285, 30], [680, 230, 26]].forEach(([x, y, r]) => {
        const crystal = ctx.createRadialGradient(x, y, 2, x, y, r);
        crystal.addColorStop(0, 'rgba(188,166,255,0.75)');
        crystal.addColorStop(1, 'rgba(188,166,255,0)');
        ctx.fillStyle = crystal;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(18,12,32,0.88)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, 360);
      ctx.quadraticCurveTo(200, 280, 420, 360);
      ctx.quadraticCurveTo(620, 420, width, 340);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    });

    create('bg_sky', 'bgSky', (ctx, width, height) => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#173661');
      sky.addColorStop(0.55, '#4778cc');
      sky.addColorStop(1, '#b9efff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
      const moon = ctx.createRadialGradient(620, 90, 10, 620, 90, 90);
      moon.addColorStop(0, 'rgba(255,255,255,0.9)');
      moon.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = moon;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      [[120, 300, 80], [300, 180, 64], [520, 270, 70], [690, 140, 58]].forEach(([x, y, s]) => {
        ctx.beginPath();
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        ctx.arc(x + s * 0.42, y - s * 0.12, s * 0.38, 0, Math.PI * 2);
        ctx.arc(x + s * 0.8, y, s * 0.32, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(0, 380);
      ctx.bezierCurveTo(120, 340, 260, 400, 380, 360);
      ctx.bezierCurveTo(540, 310, 640, 390, 800, 350);
      ctx.lineTo(800, 480);
      ctx.lineTo(0, 480);
      ctx.fill();
    });
  }

  generateParticles() {
    this.createCanvasTexture('particle', 10, 10, (ctx, width, height) => {
      const g = ctx.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, 5);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.createCanvasTexture('sparkle', 12, 12, (ctx) => this.drawSparkle(ctx, 6, 6, 5, '#ffffff', 0.95));
    this.createCanvasTexture('particleDust', 10, 10, (ctx, width, height) => {
      const g = ctx.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, 5);
      g.addColorStop(0, 'rgba(222,186,137,0.8)');
      g.addColorStop(1, 'rgba(222,186,137,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    this.createCanvasTexture('particleNote', 12, 12, (ctx) => this.drawNoteGlyph(ctx, 3.8, 3.8, 1.3, '#fff5c8', 'rgba(255,245,200,0.7)'));
    this.createCanvasTexture('particlePoof', 14, 14, (ctx, width, height) => {
      const g = ctx.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, 7);
      g.addColorStop(0, 'rgba(255,255,255,0.92)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    this.createCanvasTexture('particleSparkle', 12, 12, (ctx) => this.drawSparkle(ctx, 6, 6, 5, '#ffffff', 0.95));
  }

  generateNoteProjectiles() {
    const variants = {
      noteProjectile: ['#ffffff', '#7ec7ff'],
      noteProjectile_piano: ['#ffffff', '#8a9bff'],
      noteProjectile_flute: ['#f5fff5', '#7be4d3'],
      noteProjectile_trumpet: ['#fff5d8', '#ffba58'],
      noteProjectile_harp: ['#fff3ff', '#df9cff'],
      noteProjectile_organ: ['#fffaf1', '#d6a25a'],
      noteProjectile_baton: ['#f9fbff', '#b1e7ff']
    };

    Object.entries(variants).forEach(([key, [inner, outer]]) => {
      this.createCanvasTexture(key, 16, 16, (ctx, width, height) => {
        const g = ctx.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, 8);
        g.addColorStop(0, inner);
        g.addColorStop(0.55, outer);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        this.drawNoteGlyph(ctx, 5.3, 6.2, 1.55, '#ffffff', outer);
      });
    });
  }

  generateParallaxLayers() {
    generateAllParallaxTextures(this.scene);
  }

  generateRhythmSprites() {
    this.createCanvasTexture('rhythm_target', 36, 36, (ctx) => {
      ctx.strokeStyle = '#bfe7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(18, 18, 12, 0, Math.PI * 2);
      ctx.arc(18, 18, 6, 0, Math.PI * 2);
      ctx.stroke();
    });

    this.createCanvasTexture('rhythm_hit', 36, 36, (ctx) => {
      const g = ctx.createRadialGradient(18, 18, 2, 18, 18, 16);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#6dffa6');
      ctx.fillStyle = g;
      this.drawSparkle(ctx, 18, 18, 14, '#a8ffd4', 1);
    });

    this.createCanvasTexture('rhythm_miss', 36, 36, (ctx) => {
      ctx.strokeStyle = '#ff97a9';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(9, 9);
      ctx.lineTo(27, 27);
      ctx.moveTo(27, 9);
      ctx.lineTo(9, 27);
      ctx.stroke();
    });

    this.createCanvasTexture('practiceStage', 40, 32, (ctx, width, height) => {
      const base = ctx.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, '#7c4350');
      base.addColorStop(1, '#32131e');
      this.fillRoundRect(ctx, 3, 12, width - 6, 14, 6, base);
      this.fillRoundRect(ctx, 7, 6, width - 14, 10, 5, '#d2a25f');
      this.drawSparkle(ctx, width / 2, 9, 4, '#fff1c2', 0.8);
    });
  }

  generateCompositionNotes() {
    const drawComp = (key, type, color) => {
      this.createCanvasTexture(key, 26, 26, (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        if (type === 'rest') {
          ctx.beginPath();
          ctx.moveTo(8, 9);
          ctx.lineTo(17, 9);
          ctx.lineTo(11, 14);
          ctx.lineTo(17, 14);
          ctx.lineTo(9, 20);
          ctx.stroke();
          return;
        }
        if (type === 'whole') {
          ctx.beginPath();
          ctx.ellipse(12, 16, 5.2, 3.8, -0.2, 0, Math.PI * 2);
          ctx.stroke();
          return;
        }
        ctx.beginPath();
        ctx.ellipse(10, 18, 5, 3.6, -0.35, 0, Math.PI * 2);
        if (type !== 'half') ctx.fill();
        else ctx.stroke();
        ctx.fillRect(14, 5, 2, 14);
        if (type === 'eighth') {
          ctx.beginPath();
          ctx.moveTo(16, 5);
          ctx.quadraticCurveTo(22, 8, 17, 12);
          ctx.stroke();
        }
      });
    };

    drawComp('comp_whole', 'whole', '#f3e8c6');
    drawComp('comp_half', 'half', '#e4f5ff');
    drawComp('comp_quarter', 'quarter', '#ffd37b');
    drawComp('comp_eighth', 'eighth', '#9ce5ff');
    drawComp('comp_rest', 'rest', '#ff9cb5');

    const pitchColors = {
      C: '#ff7f7f', D: '#ffb066', E: '#f4dc68', F: '#8fe28f', G: '#78d3ff', A: '#93a0ff', B: '#dc93ff'
    };
    Object.entries(pitchColors).forEach(([pitch, color]) => drawComp(`compositionNote_${pitch}`, 'quarter', color));
  }

  generateWeaponSprites() {
    const weapons = {
      weapon_violin_bow: (ctx) => {
        ctx.strokeStyle = '#f5efe4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 24);
        ctx.quadraticCurveTo(16, 4, 24, 8);
        ctx.stroke();
        ctx.strokeStyle = '#d6b36a';
        ctx.beginPath();
        ctx.moveTo(10, 22);
        ctx.lineTo(22, 10);
        ctx.stroke();
      },
      weapon_piano_wave: (ctx) => {
        ctx.strokeStyle = '#8fa5ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, 16);
        ctx.quadraticCurveTo(10, 8, 16, 16);
        ctx.quadraticCurveTo(22, 24, 28, 16);
        ctx.stroke();
      },
      weapon_flute_wind: (ctx) => {
        ctx.strokeStyle = '#8be8d8';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(5, 11 + i * 5);
          ctx.bezierCurveTo(11, 4 + i * 2, 19, 22 - i * 2, 27, 13 + i * 4);
          ctx.stroke();
        }
      },
      weapon_trumpet_blast: (ctx) => {
        const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
        g.addColorStop(0, '#fff7d9');
        g.addColorStop(1, '#ffb84a');
        ctx.fillStyle = g;
        this.drawSparkle(ctx, 16, 16, 13, '#ffd370', 1);
      },
      weapon_harp_strings: (ctx) => {
        ctx.strokeStyle = '#de9cff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(7 + i * 4, 24);
          ctx.lineTo(22, 6 + i * 4);
          ctx.stroke();
        }
      },
      weapon_organ_pipes: (ctx) => {
        ['#d6b26a', '#f0d089', '#c6964c'].forEach((color, i) => this.fillRoundRect(ctx, 7 + i * 7, 7 + (i % 2) * 3, 5, 18 - (i % 2) * 3, 2, color));
      },
      weapon_baton_strike: (ctx) => {
        ctx.strokeStyle = '#f9fbff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(7, 25);
        ctx.lineTo(24, 8);
        ctx.stroke();
        this.drawSparkle(ctx, 24, 8, 6, '#b3f1ff', 0.95);
      }
    };

    Object.entries(weapons).forEach(([key, drawFn]) => {
      this.createCanvasTexture(key, 32, 32, (ctx) => {
        this.drawShadow(ctx, 16, 27, 7, 3, 0.08);
        drawFn(ctx);
      });
    });
  }
}
