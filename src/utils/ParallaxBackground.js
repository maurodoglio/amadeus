import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Reusable parallax scrolling background system.
 * Creates multi-layer scrolling backgrounds with atmospheric effects.
 */
export class ParallaxBackground {
  constructor(scene, config) {
    this.scene = scene;
    this.layers = [];
    this.effects = [];
    this.config = config;

    this.createLayers(config);
    if (config.effects) {
      this.createEffects(config.effects);
    }
  }

  createLayers(config) {
    const layerConfigs = config.layers || [];
    layerConfigs.forEach((layerCfg, index) => {
      const depth = -10 + index;
      const textureKey = layerCfg.texture;

      if (!this.scene.textures.exists(textureKey)) return;

      const layer = this.scene.add.tileSprite(
        0, 0, GAME_WIDTH, GAME_HEIGHT, textureKey
      ).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);

      if (layerCfg.alpha !== undefined) {
        layer.setAlpha(layerCfg.alpha);
      }

      this.layers.push({
        sprite: layer,
        scrollFactor: layerCfg.scrollFactor || 0.1,
        autoScrollX: layerCfg.autoScrollX || 0,
        autoScrollY: layerCfg.autoScrollY || 0
      });
    });
  }

  createEffects(effectsConfig) {
    effectsConfig.forEach(effect => {
      switch (effect.type) {
        case 'dustMotes':
          this.createDustMotes(effect);
          break;
        case 'birds':
          this.createBirds(effect);
          break;
        case 'rain':
          this.createRain(effect);
          break;
        case 'leaves':
          this.createLeaves(effect);
          break;
        case 'glow':
          this.createGlow(effect);
          break;
        case 'fog':
          this.createFog(effect);
          break;
      }
    });
  }

  createDustMotes(config) {
    const count = config.count || 20;
    const motes = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 1 + Math.random() * 2;
      const color = config.color || 0xFFFFCC;
      const mote = this.scene.add.circle(x, y, size, color, 0.3 + Math.random() * 0.3)
        .setScrollFactor(0).setDepth(-5);
      motes.push({ sprite: mote, speedX: (Math.random() - 0.5) * 0.3, speedY: -0.1 - Math.random() * 0.2, phase: Math.random() * Math.PI * 2 });
    }
    this.effects.push({ type: 'dustMotes', items: motes });
  }

  createBirds(config) {
    const count = config.count || 3;
    const birds = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = 30 + Math.random() * 100;
      const bird = this.scene.add.text(x, y, 'v', {
        font: '10px monospace',
        fill: config.color || '#333333'
      }).setScrollFactor(0).setDepth(-5).setAlpha(0.6);
      birds.push({ sprite: bird, speedX: 0.3 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2 });
    }
    this.effects.push({ type: 'birds', items: birds });
  }

  createRain(config) {
    const count = config.count || 60;
    const drops = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const drop = this.scene.add.rectangle(x, y, 1, 6 + Math.random() * 4, 0x8899AA, 0.4)
        .setScrollFactor(0).setDepth(-4);
      drops.push({ sprite: drop, speed: 4 + Math.random() * 3, windOffset: config.wind || 1 });
    }
    this.effects.push({ type: 'rain', items: drops });
  }

  createLeaves(config) {
    const count = config.count || 10;
    const leaves = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const leaf = this.scene.add.ellipse(x, y, 4, 2, config.color || 0x8B4513, 0.5)
        .setScrollFactor(0).setDepth(-5);
      leaves.push({ sprite: leaf, speedX: 0.2 + Math.random() * 0.4, speedY: 0.3 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
    }
    this.effects.push({ type: 'leaves', items: leaves });
  }

  createGlow(config) {
    const count = config.count || 5;
    const glows = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = GAME_HEIGHT * 0.4 + Math.random() * GAME_HEIGHT * 0.4;
      const glow = this.scene.add.circle(x, y, 3 + Math.random() * 3, config.color || 0xFFDD44, 0.2)
        .setScrollFactor(0).setDepth(-5);
      glows.push({ sprite: glow, phase: Math.random() * Math.PI * 2 });
    }
    this.effects.push({ type: 'glow', items: glows });
  }

  createFog(config) {
    const count = config.count || 4;
    const fogs = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = GAME_HEIGHT * 0.6 + Math.random() * GAME_HEIGHT * 0.3;
      const fog = this.scene.add.ellipse(x, y, 120 + Math.random() * 80, 20 + Math.random() * 15, config.color || 0xCCCCCC, 0.1 + Math.random() * 0.1)
        .setScrollFactor(0).setDepth(-4);
      fogs.push({ sprite: fog, speedX: 0.1 + Math.random() * 0.15 });
    }
    this.effects.push({ type: 'fog', items: fogs });
  }

  update(time, delta) {
    const camX = this.scene.cameras.main.scrollX;

    // Update parallax layers
    this.layers.forEach(layer => {
      layer.sprite.tilePositionX = camX * layer.scrollFactor + (layer.autoScrollX * time * 0.001);
      layer.sprite.tilePositionY += layer.autoScrollY * (delta / 1000);
    });

    // Update effects
    this.effects.forEach(effect => {
      switch (effect.type) {
        case 'dustMotes':
          this.updateDustMotes(effect.items, time);
          break;
        case 'birds':
          this.updateBirds(effect.items, time);
          break;
        case 'rain':
          this.updateRain(effect.items);
          break;
        case 'leaves':
          this.updateLeaves(effect.items, time);
          break;
        case 'glow':
          this.updateGlow(effect.items, time);
          break;
        case 'fog':
          this.updateFog(effect.items);
          break;
      }
    });
  }

  updateDustMotes(items, time) {
    items.forEach(mote => {
      mote.sprite.x += mote.speedX + Math.sin(time * 0.001 + mote.phase) * 0.2;
      mote.sprite.y += mote.speedY;
      mote.sprite.alpha = 0.2 + Math.sin(time * 0.002 + mote.phase) * 0.2;
      if (mote.sprite.y < -10) mote.sprite.y = GAME_HEIGHT + 10;
      if (mote.sprite.x < -10) mote.sprite.x = GAME_WIDTH + 10;
      if (mote.sprite.x > GAME_WIDTH + 10) mote.sprite.x = -10;
    });
  }

  updateBirds(items, time) {
    items.forEach(bird => {
      bird.sprite.x += bird.speedX;
      bird.sprite.y += Math.sin(time * 0.003 + bird.phase) * 0.3;
      if (bird.sprite.x > GAME_WIDTH + 20) {
        bird.sprite.x = -20;
        bird.sprite.y = 30 + Math.random() * 100;
      }
    });
  }

  updateRain(items) {
    items.forEach(drop => {
      drop.sprite.y += drop.speed;
      drop.sprite.x += drop.windOffset;
      if (drop.sprite.y > GAME_HEIGHT + 10) {
        drop.sprite.y = -10;
        drop.sprite.x = Math.random() * GAME_WIDTH;
      }
    });
  }

  updateLeaves(items, time) {
    items.forEach(leaf => {
      leaf.sprite.x += leaf.speedX + Math.sin(time * 0.001 + leaf.phase) * 0.3;
      leaf.sprite.y += leaf.speedY;
      leaf.sprite.rotation += 0.02;
      if (leaf.sprite.y > GAME_HEIGHT + 10) {
        leaf.sprite.y = -10;
        leaf.sprite.x = Math.random() * GAME_WIDTH;
      }
      if (leaf.sprite.x > GAME_WIDTH + 10) leaf.sprite.x = -10;
    });
  }

  updateGlow(items, time) {
    items.forEach(glow => {
      glow.sprite.alpha = 0.1 + Math.sin(time * 0.001 + glow.phase) * 0.15;
      glow.sprite.scaleX = 1 + Math.sin(time * 0.002 + glow.phase) * 0.2;
      glow.sprite.scaleY = 1 + Math.cos(time * 0.002 + glow.phase) * 0.2;
    });
  }

  updateFog(items) {
    items.forEach(fog => {
      fog.sprite.x += fog.speedX;
      if (fog.sprite.x > GAME_WIDTH + 100) fog.sprite.x = -150;
    });
  }

  destroy() {
    this.layers.forEach(layer => layer.sprite.destroy());
    this.effects.forEach(effect => {
      effect.items.forEach(item => item.sprite.destroy());
    });
    this.layers = [];
    this.effects = [];
  }
}

/**
 * Level-specific parallax configurations
 */
export const PARALLAX_CONFIGS = {
  // Level 1: Salzburg - Alps, fortress silhouette, church domes
  level1: {
    layers: [
      { texture: 'parallax_l1_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l1_far', scrollFactor: 0.3 },
      { texture: 'parallax_l1_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l1_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'dustMotes', count: 15, color: 0xFFFFDD },
      { type: 'birds', count: 3, color: '#222222' }
    ]
  },

  // Level 2: European Tour - Countryside, castles, coaching inns
  level2: {
    layers: [
      { texture: 'parallax_l2_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l2_far', scrollFactor: 0.3 },
      { texture: 'parallax_l2_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l2_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'dustMotes', count: 12, color: 0xCCDD99 },
      { type: 'birds', count: 4, color: '#444444' }
    ]
  },

  // Level 3: Court - Palace columns, chandeliers, formal gardens
  level3: {
    layers: [
      { texture: 'parallax_l3_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l3_far', scrollFactor: 0.3 },
      { texture: 'parallax_l3_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l3_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'dustMotes', count: 20, color: 0xFFDD88 },
      { type: 'glow', count: 8, color: 0xFFCC00 }
    ]
  },

  // Level 4: Vienna - Rooftops, St. Stephen's Cathedral, opera house
  level4: {
    layers: [
      { texture: 'parallax_l4_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l4_far', scrollFactor: 0.3 },
      { texture: 'parallax_l4_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l4_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'dustMotes', count: 10, color: 0xFFEECC },
      { type: 'birds', count: 2, color: '#111111' }
    ]
  },

  // Level 5: Struggle - Dark streets, rain, dim lamplights
  level5: {
    layers: [
      { texture: 'parallax_l5_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l5_far', scrollFactor: 0.3 },
      { texture: 'parallax_l5_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l5_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'rain', count: 80, wind: 1.5 },
      { type: 'glow', count: 4, color: 0xFFAA33 },
      { type: 'fog', count: 3, color: 0x444466 }
    ]
  },

  // Level 6: Requiem - Graveyard, bare trees, moonlit gothic church
  level6: {
    layers: [
      { texture: 'parallax_l6_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l6_far', scrollFactor: 0.3 },
      { texture: 'parallax_l6_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l6_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'fog', count: 5, color: 0x222244 },
      { type: 'leaves', count: 8, color: 0x443322 },
      { type: 'dustMotes', count: 8, color: 0x9999CC }
    ]
  },

  // Level 7: Legacy - Concert hall, golden light, audience silhouettes
  level7: {
    layers: [
      { texture: 'parallax_l7_sky', scrollFactor: 0.1 },
      { texture: 'parallax_l7_far', scrollFactor: 0.3 },
      { texture: 'parallax_l7_mid', scrollFactor: 0.6 },
      { texture: 'parallax_l7_near', scrollFactor: 0.8 }
    ],
    effects: [
      { type: 'dustMotes', count: 25, color: 0xFFDD66 },
      { type: 'glow', count: 10, color: 0xFFCC33 }
    ]
  }
};

/**
 * Generates all parallax layer textures procedurally.
 * Call this once during the boot/preload phase.
 */
export function generateAllParallaxTextures(scene) {
  generateLevel1Textures(scene);
  generateLevel2Textures(scene);
  generateLevel3Textures(scene);
  generateLevel4Textures(scene);
  generateLevel5Textures(scene);
  generateLevel6Textures(scene);
  generateLevel7Textures(scene);
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 480;
  return canvas;
}

function drawMountain(ctx, x, peakY, width, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, 480);
  ctx.lineTo(x + width / 2, peakY);
  ctx.lineTo(x + width, 480);
  ctx.fill();
}

function drawTree(ctx, x, groundY, height, trunkColor, canopyColor) {
  ctx.fillStyle = trunkColor;
  ctx.fillRect(x - 3, groundY - height * 0.4, 6, height * 0.4);
  ctx.fillStyle = canopyColor;
  ctx.beginPath();
  ctx.moveTo(x - height * 0.3, groundY - height * 0.4);
  ctx.lineTo(x, groundY - height);
  ctx.lineTo(x + height * 0.3, groundY - height * 0.4);
  ctx.fill();
}

function drawBuilding(ctx, x, groundY, width, height, color, roofColor) {
  ctx.fillStyle = color;
  ctx.fillRect(x, groundY - height, width, height);
  if (roofColor) {
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 2, groundY - height);
    ctx.lineTo(x + width / 2, groundY - height - 15);
    ctx.lineTo(x + width + 2, groundY - height);
    ctx.fill();
  }
}

function drawDome(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, Math.PI, 0);
  ctx.fill();
}

function drawCloud(ctx, x, y, size, color) {
  ctx.fillStyle = color || 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

// Level 1: Salzburg - Alps, fortress, church domes
function generateLevel1Textures(scene) {
  // Sky layer
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#5BA3D9');
  grad1.addColorStop(0.6, '#87CEEB');
  grad1.addColorStop(1, '#B8D8E8');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  drawCloud(ctx1, 80, 50, 50);
  drawCloud(ctx1, 300, 80, 40);
  drawCloud(ctx1, 550, 45, 55);
  drawCloud(ctx1, 720, 90, 35);
  scene.textures.addCanvas('parallax_l1_sky', c1);

  // Far layer: Alps
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  drawMountain(ctx2, -50, 180, 300, 'rgba(100,130,160,0.6)');
  drawMountain(ctx2, 150, 150, 350, 'rgba(80,110,140,0.5)');
  drawMountain(ctx2, 400, 190, 280, 'rgba(90,120,150,0.55)');
  drawMountain(ctx2, 580, 160, 320, 'rgba(85,115,145,0.5)');
  // Snow caps
  ctx2.fillStyle = 'rgba(255,255,255,0.4)';
  ctx2.beginPath();
  ctx2.moveTo(100, 180); ctx2.lineTo(125, 165); ctx2.lineTo(150, 180); ctx2.fill();
  ctx2.beginPath();
  ctx2.moveTo(300, 150); ctx2.lineTo(325, 130); ctx2.lineTo(350, 150); ctx2.fill();
  ctx2.beginPath();
  ctx2.moveTo(720, 160); ctx2.lineTo(740, 143); ctx2.lineTo(760, 160); ctx2.fill();
  scene.textures.addCanvas('parallax_l1_far', c2);

  // Mid layer: Fortress silhouette
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  // Hohensalzburg fortress silhouette
  ctx3.fillStyle = 'rgba(60,50,40,0.5)';
  ctx3.fillRect(200, 280, 200, 100);
  ctx3.fillRect(180, 300, 30, 80);
  ctx3.fillRect(410, 290, 30, 90);
  // Towers
  ctx3.fillRect(220, 250, 25, 30);
  ctx3.fillRect(340, 240, 30, 40);
  // Church domes
  drawDome(ctx3, 550, 330, 25, 'rgba(70,60,50,0.5)');
  drawDome(ctx3, 650, 340, 20, 'rgba(70,60,50,0.4)');
  // Cross on dome
  ctx3.fillStyle = 'rgba(200,170,50,0.5)';
  ctx3.fillRect(548, 300, 3, 15);
  ctx3.fillRect(544, 305, 11, 3);
  scene.textures.addCanvas('parallax_l1_mid', c3);

  // Near layer: Church domes and rooftops close
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  for (let i = 0; i < 5; i++) {
    const bx = i * 170 + 20;
    const bh = 100 + Math.sin(i * 1.8) * 40;
    drawBuilding(ctx4, bx, 448, 80, bh, 'rgba(140,110,80,0.35)', 'rgba(120,90,60,0.35)');
    // Windows
    ctx4.fillStyle = 'rgba(255,240,180,0.25)';
    for (let wy = 0; wy < 3; wy++) {
      for (let wx = 0; wx < 2; wx++) {
        ctx4.fillRect(bx + 15 + wx * 35, 448 - bh + 20 + wy * 30, 10, 14);
      }
    }
  }
  // Onion dome in foreground
  drawDome(ctx4, 130, 330, 18, 'rgba(80,120,80,0.35)');
  scene.textures.addCanvas('parallax_l1_near', c4);
}

// Level 2: European Tour - Countryside, castles, coaching inns
function generateLevel2Textures(scene) {
  // Sky
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#6BA85E');
  grad1.addColorStop(0.3, '#88C878');
  grad1.addColorStop(1, '#A8D890');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  drawCloud(ctx1, 120, 60, 45, 'rgba(255,255,255,0.4)');
  drawCloud(ctx1, 450, 40, 55, 'rgba(255,255,255,0.35)');
  drawCloud(ctx1, 680, 70, 40, 'rgba(255,255,255,0.4)');
  scene.textures.addCanvas('parallax_l2_sky', c1);

  // Far: Rolling hills
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = 'rgba(60,120,40,0.4)';
  ctx2.beginPath();
  ctx2.moveTo(0, 380);
  for (let x = 0; x <= 800; x += 20) {
    ctx2.lineTo(x, 320 + Math.sin(x * 0.01) * 40 + Math.sin(x * 0.005) * 20);
  }
  ctx2.lineTo(800, 480); ctx2.lineTo(0, 480);
  ctx2.fill();
  // Distant castle
  ctx2.fillStyle = 'rgba(80,70,60,0.4)';
  ctx2.fillRect(600, 260, 50, 80);
  ctx2.fillRect(590, 240, 15, 40);
  ctx2.fillRect(640, 245, 15, 35);
  // Flags
  ctx2.fillStyle = 'rgba(180,40,40,0.4)';
  ctx2.fillRect(594, 230, 10, 8);
  scene.textures.addCanvas('parallax_l2_far', c2);

  // Mid: Trees and coaching inn
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  for (let i = 0; i < 10; i++) {
    const tx = i * 85 + Math.sin(i * 2) * 15;
    drawTree(ctx3, tx, 430, 50 + Math.sin(i) * 15, 'rgba(60,40,20,0.4)', 'rgba(40,100,30,0.4)');
  }
  // Coaching inn
  drawBuilding(ctx3, 350, 430, 90, 60, 'rgba(130,100,70,0.4)', 'rgba(100,70,40,0.4)');
  ctx3.fillStyle = 'rgba(200,150,50,0.3)';
  ctx3.fillRect(380, 390, 12, 18); // door
  ctx3.fillStyle = 'rgba(255,220,100,0.2)';
  ctx3.fillRect(360, 385, 8, 8); // window
  ctx3.fillRect(405, 385, 8, 8);
  scene.textures.addCanvas('parallax_l2_mid', c3);

  // Near: Fence posts and hedges
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  for (let i = 0; i < 20; i++) {
    const fx = i * 42;
    ctx4.fillStyle = 'rgba(80,50,30,0.3)';
    ctx4.fillRect(fx, 410, 4, 38);
    if (i < 19) {
      ctx4.fillRect(fx, 420, 42, 3);
      ctx4.fillRect(fx, 435, 42, 3);
    }
  }
  // Hedge bushes
  ctx4.fillStyle = 'rgba(30,80,20,0.3)';
  for (let i = 0; i < 6; i++) {
    const hx = i * 140 + 30;
    ctx4.beginPath();
    ctx4.arc(hx, 440, 18, 0, Math.PI * 2);
    ctx4.arc(hx + 20, 438, 15, 0, Math.PI * 2);
    ctx4.fill();
  }
  scene.textures.addCanvas('parallax_l2_near', c4);
}

// Level 3: Court - Palace columns, chandeliers, formal gardens
function generateLevel3Textures(scene) {
  // Sky: Night sky with stars
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#0a0a2a');
  grad1.addColorStop(1, '#1a1040');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  ctx1.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 137 + 23) % 800;
    const sy = (i * 89 + 47) % 350;
    ctx1.fillRect(sx, sy, (i % 3) + 1, (i % 3) + 1);
  }
  scene.textures.addCanvas('parallax_l3_sky', c1);

  // Far: Palace exterior
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = 'rgba(60,30,70,0.5)';
  // Main palace body
  ctx2.fillRect(50, 250, 700, 180);
  // Towers with domes
  const towers = [80, 250, 420, 600, 720];
  towers.forEach((tx, i) => {
    const th = 130 + (i % 2) * 40;
    ctx2.fillRect(tx, 250 - th + 130, 35, th);
    drawDome(ctx2, tx + 17, 250 - th + 130, 18, 'rgba(80,40,90,0.5)');
  });
  // Palace windows
  ctx2.fillStyle = 'rgba(255,200,50,0.2)';
  for (let i = 0; i < 15; i++) {
    ctx2.fillRect(80 + i * 45, 290, 12, 20);
    ctx2.fillRect(80 + i * 45, 340, 12, 20);
  }
  scene.textures.addCanvas('parallax_l3_far', c2);

  // Mid: Columns and chandeliers
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  for (let i = 0; i < 7; i++) {
    const cx = i * 120 + 40;
    // Column
    ctx3.fillStyle = 'rgba(180,160,140,0.3)';
    ctx3.fillRect(cx, 150, 18, 300);
    ctx3.fillRect(cx - 5, 145, 28, 10);
    ctx3.fillRect(cx - 5, 445, 28, 10);
    // Chandelier between columns
    if (i < 6 && i % 2 === 0) {
      const chx = cx + 60;
      ctx3.fillStyle = 'rgba(200,180,50,0.3)';
      ctx3.fillRect(chx - 1, 100, 2, 30);
      // Arms
      ctx3.beginPath();
      ctx3.moveTo(chx - 15, 135);
      ctx3.lineTo(chx, 130);
      ctx3.lineTo(chx + 15, 135);
      ctx3.fill();
      // Candle flames
      ctx3.fillStyle = 'rgba(255,200,50,0.4)';
      ctx3.fillRect(chx - 16, 130, 3, 5);
      ctx3.fillRect(chx + 14, 130, 3, 5);
      ctx3.fillRect(chx - 1, 127, 3, 5);
    }
  }
  scene.textures.addCanvas('parallax_l3_mid', c3);

  // Near: Formal garden hedges
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  // Topiary and hedges
  for (let i = 0; i < 5; i++) {
    const gx = i * 170 + 30;
    // Trimmed hedge
    ctx4.fillStyle = 'rgba(20,60,20,0.3)';
    ctx4.fillRect(gx, 420, 80, 28);
    // Topiary ball
    ctx4.beginPath();
    ctx4.arc(gx + 40, 405, 18, 0, Math.PI * 2);
    ctx4.fill();
    // Flower pots
    ctx4.fillStyle = 'rgba(150,80,50,0.25)';
    ctx4.fillRect(gx + 90, 430, 15, 18);
    ctx4.fillStyle = 'rgba(200,50,80,0.2)';
    ctx4.beginPath();
    ctx4.arc(gx + 97, 425, 8, 0, Math.PI * 2);
    ctx4.fill();
  }
  scene.textures.addCanvas('parallax_l3_near', c4);
}

// Level 4: Vienna - Rooftops, St. Stephen's Cathedral, opera house
function generateLevel4Textures(scene) {
  // Sky: Sunset
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#1a0a2e');
  grad1.addColorStop(0.4, '#4a1a3e');
  grad1.addColorStop(0.7, '#8a3a2a');
  grad1.addColorStop(1, '#cc7733');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  // Sunset clouds
  drawCloud(ctx1, 150, 200, 60, 'rgba(200,100,50,0.3)');
  drawCloud(ctx1, 500, 180, 70, 'rgba(180,80,40,0.25)');
  scene.textures.addCanvas('parallax_l4_sky', c1);

  // Far: St. Stephen's Cathedral silhouette
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  // Cathedral spire
  ctx2.fillStyle = 'rgba(30,20,40,0.6)';
  ctx2.beginPath();
  ctx2.moveTo(380, 100);
  ctx2.lineTo(370, 320);
  ctx2.lineTo(430, 320);
  ctx2.lineTo(420, 100);
  ctx2.fill();
  // Cathedral body
  ctx2.fillRect(320, 320, 160, 100);
  // Spire top
  ctx2.beginPath();
  ctx2.moveTo(395, 50);
  ctx2.lineTo(380, 100);
  ctx2.lineTo(420, 100);
  ctx2.fill();
  // Other distant buildings
  for (let i = 0; i < 5; i++) {
    const bx = i * 160 + (i >= 2 ? 80 : 0);
    if (bx > 300 && bx < 500) continue;
    drawBuilding(ctx2, bx, 420, 60, 80 + i * 10, 'rgba(30,20,40,0.4)');
  }
  scene.textures.addCanvas('parallax_l4_far', c2);

  // Mid: Opera house and rooftops
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  // Opera house
  ctx3.fillStyle = 'rgba(50,35,25,0.45)';
  ctx3.fillRect(100, 300, 200, 130);
  // Grand entrance columns
  for (let i = 0; i < 5; i++) {
    ctx3.fillStyle = 'rgba(70,50,40,0.4)';
    ctx3.fillRect(110 + i * 40, 300, 10, 100);
  }
  // Pediment
  ctx3.fillStyle = 'rgba(60,40,30,0.45)';
  ctx3.beginPath();
  ctx3.moveTo(100, 300);
  ctx3.lineTo(200, 270);
  ctx3.lineTo(300, 300);
  ctx3.fill();
  // More rooftops
  for (let i = 0; i < 4; i++) {
    const rx = 400 + i * 110;
    drawBuilding(ctx3, rx, 430, 70, 70 + Math.sin(i) * 20, 'rgba(50,35,25,0.4)', 'rgba(60,40,30,0.4)');
  }
  scene.textures.addCanvas('parallax_l4_mid', c3);

  // Near: Street-level details
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  // Lamp posts
  for (let i = 0; i < 4; i++) {
    const lx = i * 210 + 50;
    ctx4.fillStyle = 'rgba(40,30,20,0.35)';
    ctx4.fillRect(lx, 350, 4, 98);
    // Lamp
    ctx4.fillStyle = 'rgba(255,200,80,0.25)';
    ctx4.beginPath();
    ctx4.arc(lx + 2, 345, 8, 0, Math.PI * 2);
    ctx4.fill();
  }
  // Carriages silhouette
  ctx4.fillStyle = 'rgba(30,20,15,0.25)';
  ctx4.fillRect(300, 420, 50, 25);
  ctx4.beginPath();
  ctx4.arc(310, 448, 8, 0, Math.PI * 2);
  ctx4.arc(340, 448, 8, 0, Math.PI * 2);
  ctx4.fill();
  scene.textures.addCanvas('parallax_l4_near', c4);
}

// Level 5: Struggle - Dark streets, rain, dim lamplights
function generateLevel5Textures(scene) {
  // Sky: Stormy dark sky
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#1a1a2e');
  grad1.addColorStop(0.5, '#2a2a3e');
  grad1.addColorStop(1, '#3a3a4e');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  // Storm clouds
  drawCloud(ctx1, 100, 80, 80, 'rgba(30,30,50,0.6)');
  drawCloud(ctx1, 350, 50, 100, 'rgba(25,25,45,0.7)');
  drawCloud(ctx1, 600, 70, 90, 'rgba(30,30,50,0.6)');
  scene.textures.addCanvas('parallax_l5_sky', c1);

  // Far: Dark distant buildings
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  for (let i = 0; i < 12; i++) {
    const bx = i * 70;
    const bh = 60 + Math.sin(i * 1.5) * 30;
    ctx2.fillStyle = 'rgba(20,20,35,0.5)';
    ctx2.fillRect(bx, 420 - bh, 55, bh + 60);
  }
  scene.textures.addCanvas('parallax_l5_far', c2);

  // Mid: Street buildings with dim windows
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  for (let i = 0; i < 6; i++) {
    const bx = i * 140 + 10;
    const bh = 120 + Math.sin(i * 2) * 40;
    ctx3.fillStyle = 'rgba(25,25,40,0.45)';
    ctx3.fillRect(bx, 448 - bh, 100, bh);
    // Dim windows (only some lit)
    for (let wy = 0; wy < 3; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        const lit = Math.sin(i * 3 + wy * 5 + wx * 7) > 0.3;
        ctx3.fillStyle = lit ? 'rgba(200,150,50,0.15)' : 'rgba(10,10,20,0.2)';
        ctx3.fillRect(bx + 12 + wx * 28, 448 - bh + 15 + wy * 35, 10, 14);
      }
    }
  }
  scene.textures.addCanvas('parallax_l5_mid', c3);

  // Near: Lamplights and puddles
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  // Lamp posts with glow
  for (let i = 0; i < 3; i++) {
    const lx = i * 280 + 80;
    ctx4.fillStyle = 'rgba(30,30,20,0.35)';
    ctx4.fillRect(lx, 340, 4, 108);
    // Lamp glow
    const lampGrad = ctx4.createRadialGradient(lx + 2, 335, 2, lx + 2, 335, 30);
    lampGrad.addColorStop(0, 'rgba(255,180,60,0.3)');
    lampGrad.addColorStop(1, 'rgba(255,180,60,0)');
    ctx4.fillStyle = lampGrad;
    ctx4.fillRect(lx - 28, 307, 60, 60);
  }
  // Puddle reflections
  ctx4.fillStyle = 'rgba(80,80,120,0.15)';
  ctx4.beginPath();
  ctx4.ellipse(200, 450, 40, 5, 0, 0, Math.PI * 2);
  ctx4.fill();
  ctx4.beginPath();
  ctx4.ellipse(550, 445, 30, 4, 0, 0, Math.PI * 2);
  ctx4.fill();
  scene.textures.addCanvas('parallax_l5_near', c4);
}

// Level 6: Requiem - Graveyard, bare trees, moonlit gothic church
function generateLevel6Textures(scene) {
  // Sky: Moonlit night
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#050510');
  grad1.addColorStop(0.5, '#0a0a20');
  grad1.addColorStop(1, '#151530');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  // Moon
  ctx1.fillStyle = 'rgba(220,220,240,0.8)';
  ctx1.beginPath();
  ctx1.arc(650, 80, 30, 0, Math.PI * 2);
  ctx1.fill();
  // Moon glow
  const moonGrad = ctx1.createRadialGradient(650, 80, 30, 650, 80, 80);
  moonGrad.addColorStop(0, 'rgba(180,180,220,0.2)');
  moonGrad.addColorStop(1, 'rgba(180,180,220,0)');
  ctx1.fillStyle = moonGrad;
  ctx1.beginPath();
  ctx1.arc(650, 80, 80, 0, Math.PI * 2);
  ctx1.fill();
  // Stars
  ctx1.fillStyle = 'rgba(200,200,255,0.5)';
  for (let i = 0; i < 40; i++) {
    ctx1.fillRect((i * 97 + 31) % 800, (i * 61 + 13) % 300, 1, 1);
  }
  scene.textures.addCanvas('parallax_l6_sky', c1);

  // Far: Gothic church silhouette
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = 'rgba(10,10,20,0.6)';
  // Church body
  ctx2.fillRect(300, 250, 150, 200);
  // Steeple
  ctx2.beginPath();
  ctx2.moveTo(370, 120);
  ctx2.lineTo(340, 250);
  ctx2.lineTo(400, 250);
  ctx2.fill();
  // Cross
  ctx2.fillStyle = 'rgba(150,150,180,0.4)';
  ctx2.fillRect(372, 100, 3, 25);
  ctx2.fillRect(366, 108, 15, 3);
  // Rose window
  ctx2.strokeStyle = 'rgba(100,50,120,0.3)';
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.arc(375, 300, 20, 0, Math.PI * 2);
  ctx2.stroke();
  scene.textures.addCanvas('parallax_l6_far', c2);

  // Mid: Bare trees and gravestones
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  // Bare trees
  for (let i = 0; i < 5; i++) {
    const tx = i * 170 + 40;
    ctx3.fillStyle = 'rgba(20,15,10,0.4)';
    ctx3.fillRect(tx, 300, 6, 148);
    // Branches
    ctx3.strokeStyle = 'rgba(20,15,10,0.35)';
    ctx3.lineWidth = 2;
    const branches = [[-25, -50], [20, -70], [-15, -90], [25, -40]];
    branches.forEach(([dx, dy]) => {
      ctx3.beginPath();
      ctx3.moveTo(tx + 3, 350 + dy * 0.5);
      ctx3.lineTo(tx + 3 + dx, 350 + dy);
      ctx3.stroke();
    });
  }
  // Gravestones
  ctx3.fillStyle = 'rgba(50,50,60,0.35)';
  for (let i = 0; i < 8; i++) {
    const gx = i * 105 + 20;
    const gh = 20 + (i % 3) * 8;
    ctx3.fillRect(gx, 430 - gh, 15, gh);
    // Rounded top
    ctx3.beginPath();
    ctx3.arc(gx + 7, 430 - gh, 7, Math.PI, 0);
    ctx3.fill();
  }
  scene.textures.addCanvas('parallax_l6_mid', c3);

  // Near: Iron fence and fog ground
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  // Iron fence
  ctx4.fillStyle = 'rgba(20,20,30,0.3)';
  for (let i = 0; i < 16; i++) {
    ctx4.fillRect(i * 52, 380, 3, 68);
    // Spear tip
    ctx4.beginPath();
    ctx4.moveTo(i * 52 - 2, 380);
    ctx4.lineTo(i * 52 + 1.5, 372);
    ctx4.lineTo(i * 52 + 5, 380);
    ctx4.fill();
  }
  // Connecting rail
  ctx4.fillRect(0, 410, 800, 3);
  // Ground fog
  ctx4.fillStyle = 'rgba(100,100,130,0.12)';
  for (let i = 0; i < 6; i++) {
    ctx4.beginPath();
    ctx4.ellipse(i * 150 + 50, 455, 70, 12, 0, 0, Math.PI * 2);
    ctx4.fill();
  }
  scene.textures.addCanvas('parallax_l6_near', c4);
}

// Level 7: Legacy - Concert hall, golden light, audience silhouettes
function generateLevel7Textures(scene) {
  // Sky: Warm golden backdrop
  const c1 = createCanvas();
  const ctx1 = c1.getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 480);
  grad1.addColorStop(0, '#2a1a0a');
  grad1.addColorStop(0.3, '#4a2a10');
  grad1.addColorStop(0.7, '#6a3a15');
  grad1.addColorStop(1, '#3a2008');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 800, 480);
  // Warm light rays
  ctx1.fillStyle = 'rgba(255,200,80,0.05)';
  for (let i = 0; i < 8; i++) {
    ctx1.beginPath();
    ctx1.moveTo(400, 0);
    ctx1.lineTo(i * 120 - 50, 480);
    ctx1.lineTo(i * 120 + 50, 480);
    ctx1.fill();
  }
  scene.textures.addCanvas('parallax_l7_sky', c1);

  // Far: Concert hall architecture
  const c2 = createCanvas();
  const ctx2 = c2.getContext('2d');
  // Ornate ceiling/arches
  ctx2.fillStyle = 'rgba(120,80,30,0.4)';
  // Arched ceiling
  for (let i = 0; i < 5; i++) {
    const ax = i * 180 + 20;
    ctx2.beginPath();
    ctx2.moveTo(ax, 200);
    ctx2.quadraticCurveTo(ax + 80, 100, ax + 160, 200);
    ctx2.lineTo(ax + 160, 210);
    ctx2.quadraticCurveTo(ax + 80, 115, ax, 210);
    ctx2.fill();
  }
  // Balcony rail
  ctx2.fillStyle = 'rgba(180,140,60,0.3)';
  ctx2.fillRect(0, 280, 800, 8);
  ctx2.fillRect(0, 300, 800, 4);
  // Decorative elements
  for (let i = 0; i < 20; i++) {
    ctx2.fillRect(i * 42 + 10, 285, 3, 15);
  }
  scene.textures.addCanvas('parallax_l7_far', c2);

  // Mid: Chandeliers and box seats
  const c3 = createCanvas();
  const ctx3 = c3.getContext('2d');
  // Grand chandeliers
  for (let i = 0; i < 3; i++) {
    const chx = i * 300 + 120;
    ctx3.fillStyle = 'rgba(200,160,50,0.3)';
    ctx3.fillRect(chx - 1, 60, 2, 40);
    // Crystal drops
    for (let j = 0; j < 5; j++) {
      const cx = chx - 12 + j * 6;
      ctx3.fillRect(cx, 100, 2, 8 + j * 2);
      ctx3.fillStyle = 'rgba(255,220,100,0.25)';
      ctx3.fillRect(cx - 1, 95, 4, 5);
      ctx3.fillStyle = 'rgba(200,160,50,0.3)';
    }
  }
  // Box seats
  ctx3.fillStyle = 'rgba(100,30,30,0.3)';
  ctx3.fillRect(0, 320, 120, 130);
  ctx3.fillRect(680, 320, 120, 130);
  // Velvet drapes
  ctx3.fillStyle = 'rgba(130,20,20,0.25)';
  ctx3.beginPath();
  ctx3.moveTo(0, 310); ctx3.quadraticCurveTo(60, 330, 120, 310); ctx3.lineTo(120, 320); ctx3.lineTo(0, 320);
  ctx3.fill();
  ctx3.beginPath();
  ctx3.moveTo(680, 310); ctx3.quadraticCurveTo(740, 330, 800, 310); ctx3.lineTo(800, 320); ctx3.lineTo(680, 320);
  ctx3.fill();
  scene.textures.addCanvas('parallax_l7_mid', c3);

  // Near: Audience silhouettes
  const c4 = createCanvas();
  const ctx4 = c4.getContext('2d');
  // Audience heads
  ctx4.fillStyle = 'rgba(15,10,5,0.35)';
  for (let i = 0; i < 20; i++) {
    const ax = i * 42 + 10 + Math.sin(i * 2) * 5;
    const ay = 430 + Math.sin(i * 1.3) * 8;
    // Head
    ctx4.beginPath();
    ctx4.arc(ax, ay, 8 + (i % 3), 0, Math.PI * 2);
    ctx4.fill();
    // Shoulders
    ctx4.beginPath();
    ctx4.ellipse(ax, ay + 14, 12, 6, 0, 0, Math.PI * 2);
    ctx4.fill();
  }
  // Some with wigs (period appropriate!)
  ctx4.fillStyle = 'rgba(200,200,190,0.15)';
  for (let i = 0; i < 20; i += 3) {
    const ax = i * 42 + 10 + Math.sin(i * 2) * 5;
    const ay = 430 + Math.sin(i * 1.3) * 8;
    ctx4.beginPath();
    ctx4.arc(ax, ay - 3, 10, Math.PI, 0);
    ctx4.fill();
  }
  scene.textures.addCanvas('parallax_l7_near', c4);
}
