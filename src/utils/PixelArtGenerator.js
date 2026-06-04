import { TILE_SIZE } from '../config/constants.js';

/**
 * Generates pixel art sprites programmatically using canvas.
 * Each sprite is defined as a 2D array of color values.
 */
export class PixelArtGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  generateAll() {
    this.generateMozart();
    this.generateNannerl();
    this.generateEnemies();
    this.generateNPCs();
    this.generateTiles();
    this.generateItems();
    this.generateCheckpointAndUI();
    this.generateBackgrounds();
    this.generateParticles();
    this.generateParallaxLayers();
    this.generateRhythmSprites();
  }

  createTexture(key, pixelData, scale = 2) {
    const width = pixelData[0].length;
    const height = pixelData.length;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = pixelData[y][x];
        if (color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    this.scene.textures.addCanvas(key, canvas);
  }

  createSpriteSheet(key, frames, scale = 2) {
    const width = frames[0][0].length;
    const height = frames[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale * frames.length;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    frames.forEach((frame, frameIndex) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = frame[y][x];
          if (color !== null) {
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

  generateMozart() {
    const _ = null;
    const W = '#F5F5DC'; // wig
    const S = '#FFE4B5'; // skin
    const C = '#4169E1'; // coat
    const P = '#2E2E5C'; // pants
    const B = '#1a1a1a'; // black (shoes/eyes)
    const G = '#FFD700'; // gold trim

    // Mozart standing frame (16x24 pixels)
    const frame1 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,S,C,C,C,G,G,G,G,C,C,C,C,S,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];

    // Mozart walking frame
    const frame2 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,_,C,C,C,G,G,G,G,C,C,C,C,S,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,P,P,P,_,_,_,_,P,P,P,_,_,_,_],
      [_,_,P,P,P,_,_,_,_,_,P,P,P,_,_,_],
      [_,B,B,B,_,_,_,_,_,_,_,B,B,B,_,_],
      [_,B,B,B,_,_,_,_,_,_,_,B,B,B,_,_],
    ];

    // Mozart jumping frame
    const frame3 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,S,_,C,C,C,C,C,C,C,C,C,_,S,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,G,G,G,G,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,_,P,P,P,_,P,P,P,_,_,_,_,_],
      [_,_,_,_,P,P,_,_,_,P,P,_,_,_,_,_],
      [_,_,_,_,B,B,_,_,_,B,B,_,_,_,_,_],
      [_,_,_,_,B,B,_,_,_,B,B,_,_,_,_,_],
    ];

    this.createSpriteSheet('mozart', [frame1, frame2, frame1, frame3]);
  }

  generateNannerl() {
    const _ = null;
    const W = '#F5F5DC'; // wig (same style as Mozart)
    const S = '#FFE4B5'; // skin
    const D = '#FF69B4'; // pink dress
    const K = '#DB7093'; // darker pink (dress detail)
    const B = '#1a1a1a'; // black (shoes/eyes)
    const G = '#FFD700'; // gold trim
    const R = '#FF1493'; // ribbon in hair

    // Nannerl standing frame (16x24 pixels)
    const frame1 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,R,W,W,W,R,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,D,D,D,D,D,D,D,D,D,_,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,S,D,D,D,G,G,G,G,D,D,D,D,S,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,K,K,D,D,D,D,D,D,D,K,K,_,_,_],
      [_,_,K,K,K,D,D,D,D,D,K,K,K,_,_,_],
      [_,K,K,K,K,D,D,D,D,D,K,K,K,K,_,_],
      [_,K,K,K,K,K,_,_,K,K,K,K,K,K,_,_],
      [_,_,K,K,K,K,_,_,K,K,K,K,K,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];

    // Nannerl walking frame
    const frame2 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,R,W,W,W,R,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,D,D,D,D,D,D,D,D,D,_,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,_,D,D,D,G,G,G,G,D,D,D,D,S,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,K,K,D,D,D,D,D,D,D,K,K,_,_,_],
      [_,_,K,K,K,D,D,D,D,D,K,K,K,_,_,_],
      [_,K,K,K,K,D,D,D,D,D,K,K,K,K,_,_],
      [_,K,K,K,_,_,_,_,_,K,K,K,K,_,_,_],
      [_,_,K,K,K,_,_,_,_,_,K,K,K,_,_,_],
      [_,B,B,B,_,_,_,_,_,_,_,B,B,B,_,_],
      [_,B,B,B,_,_,_,_,_,_,_,B,B,B,_,_],
    ];

    // Nannerl jumping frame
    const frame3 = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,R,W,W,W,R,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,S,_,D,D,D,D,D,D,D,D,D,_,S,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,D,D,D,G,G,G,G,D,D,D,D,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,K,K,D,D,D,D,D,D,D,K,K,_,_,_],
      [_,_,K,K,K,D,D,D,D,D,K,K,K,_,_,_],
      [_,K,K,K,K,D,D,D,D,D,K,K,K,K,_,_],
      [_,_,_,_,K,K,K,_,K,K,K,_,_,_,_,_],
      [_,_,_,_,K,K,_,_,_,K,K,_,_,_,_,_],
      [_,_,_,_,B,B,_,_,_,B,B,_,_,_,_,_],
      [_,_,_,_,B,B,_,_,_,B,B,_,_,_,_,_],
    ];

    this.createSpriteSheet('nannerl', [frame1, frame2, frame1, frame3]);
  }

  generateEnemies() {
    const _ = null;

    // Off-key Singer (16x20)
    const R = '#FF0000'; // red dress
    const S = '#FFE4B5'; // skin
    const B = '#1a1a1a'; // black
    const H = '#8B0000'; // dark red hair

    const singer = [
      [_,_,_,_,_,H,H,H,H,H,H,_,_,_,_,_],
      [_,_,_,_,H,H,H,H,H,H,H,H,_,_,_,_],
      [_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,B,B,B,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,_,_,_,_,_],
      [_,_,_,R,R,R,R,R,R,R,R,R,_,_,_,_],
      [_,_,R,R,R,R,R,R,R,R,R,R,R,_,_,_],
      [_,_,R,R,R,R,R,R,R,R,R,R,R,_,_,_],
      [_,S,R,R,R,R,R,R,R,R,R,R,R,S,_,_],
      [_,S,R,R,R,R,R,R,R,R,R,R,R,S,_,_],
      [_,_,R,R,R,R,R,R,R,R,R,R,R,_,_,_],
      [_,_,R,R,R,R,R,R,R,R,R,R,R,_,_,_],
      [_,_,_,R,R,R,R,R,R,R,R,R,_,_,_,_],
      [_,_,_,R,R,R,R,R,R,R,R,R,_,_,_,_],
      [_,_,_,R,R,R,_,_,R,R,R,R,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];
    this.createTexture('singer', singer);

    // Drum Troll (16x18)
    const T = '#556B2F'; // troll green
    const D = '#8B4513'; // drum brown
    const O = '#FFA500'; // orange

    const drumTroll = [
      [_,_,_,_,_,T,T,T,T,T,T,_,_,_,_,_],
      [_,_,_,_,T,T,T,T,T,T,T,T,_,_,_,_],
      [_,_,_,T,T,T,T,T,T,T,T,T,T,_,_,_],
      [_,_,_,T,O,T,T,T,T,T,O,T,T,_,_,_],
      [_,_,_,T,T,T,T,T,T,T,T,T,T,_,_,_],
      [_,_,_,T,T,T,B,B,B,T,T,T,T,_,_,_],
      [_,_,_,_,T,T,T,T,T,T,T,_,_,_,_,_],
      [_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_],
      [_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_],
      [_,T,T,T,D,D,D,D,D,D,D,T,T,T,_,_],
      [_,T,T,T,D,D,D,D,D,D,D,T,T,T,_,_],
      [_,T,T,T,D,D,D,D,D,D,D,T,T,T,_,_],
      [_,_,_,T,T,T,T,T,T,T,T,T,_,_,_,_],
      [_,_,_,T,T,T,T,T,T,T,T,T,_,_,_,_],
      [_,_,_,_,T,T,T,T,T,T,T,_,_,_,_,_],
      [_,_,_,_,T,T,_,_,T,T,_,_,_,_,_,_],
      [_,_,_,_,T,T,_,_,T,T,_,_,_,_,_,_],
      [_,_,_,T,T,T,_,_,T,T,T,_,_,_,_,_],
    ];
    this.createTexture('drumTroll', drumTroll);

    // Dissonant Note (12x16) - floating music note
    const N = '#8B008B'; // purple note
    const X = '#FF00FF'; // magenta glow

    const dissonantNote = [
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,_,N,N,_,_,_],
      [_,_,_,_,_,_,N,N,N,_,_,_],
      [_,_,_,_,_,N,N,N,N,_,_,_],
      [_,_,_,_,N,N,N,N,N,_,_,_],
      [_,_,_,X,N,N,N,N,N,X,_,_],
      [_,_,X,N,N,N,N,N,N,N,X,_],
      [_,_,X,N,N,N,N,N,N,N,X,_],
      [_,_,X,N,N,N,N,N,N,N,X,_],
      [_,_,_,X,N,N,N,N,N,X,_,_],
      [_,_,_,_,X,X,X,X,X,_,_,_],
    ];
    this.createTexture('dissonantNote', dissonantNote);

    // Broken Instrument - walking cello (14x20)
    const L = '#D2691E'; // wood color
    const K = '#8B4513'; // dark wood
    const E = '#FF4500'; // angry eyes

    const brokenInstrument = [
      [_,_,_,_,_,L,L,L,L,_,_,_,_,_],
      [_,_,_,_,L,L,L,L,L,L,_,_,_,_],
      [_,_,_,L,L,L,L,L,L,L,L,_,_,_],
      [_,_,_,L,E,L,L,L,E,L,L,_,_,_],
      [_,_,_,L,L,L,L,L,L,L,L,_,_,_],
      [_,_,_,L,L,L,K,L,L,L,L,_,_,_],
      [_,_,_,_,L,L,L,L,L,L,_,_,_,_],
      [_,_,_,_,K,K,K,K,K,_,_,_,_,_],
      [_,_,_,L,L,L,L,L,L,L,_,_,_,_],
      [_,_,L,L,L,L,L,L,L,L,L,_,_,_],
      [_,L,L,L,L,L,L,L,L,L,L,L,_,_],
      [_,L,L,L,L,K,K,K,L,L,L,L,_,_],
      [_,L,L,L,L,L,L,L,L,L,L,L,_,_],
      [_,_,L,L,L,L,L,L,L,L,L,_,_,_],
      [_,_,_,L,L,L,L,L,L,L,_,_,_,_],
      [_,_,_,L,L,L,L,L,L,L,_,_,_,_],
      [_,_,_,_,L,L,_,L,L,_,_,_,_,_],
      [_,_,_,_,K,K,_,K,K,_,_,_,_,_],
      [_,_,_,K,K,K,_,K,K,K,_,_,_,_],
      [_,_,_,K,K,_,_,_,K,K,_,_,_,_],
    ];
    this.createTexture('brokenInstrument', brokenInstrument);
  }

  generateNPCs() {
    const _ = null;
    const S = '#FFE4B5'; // skin
    const B = '#1a1a1a'; // black (eyes/shoes)

    // Haydn - older mentor, grey wig, green coat (16x24)
    const W = '#C0C0C0'; // grey wig
    const C = '#2E8B57'; // green coat
    const P = '#2F4F4F'; // dark pants
    const G = '#FFD700'; // gold trim

    const haydn = [
      [_,_,_,_,_,W,W,W,W,W,W,_,_,_,_,_],
      [_,_,_,_,W,W,W,W,W,W,W,W,_,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,W,W,W,W,W,W,W,W,W,W,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,C,C,C,C,C,C,C,C,C,_,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,S,C,C,C,G,G,G,G,C,C,C,C,S,_,_],
      [_,S,C,C,C,C,C,C,C,C,C,C,C,S,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,C,C,C,C,C,C,C,C,C,C,C,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];
    this.createTexture('npc_haydn', haydn);

    // Salieri - dark, dramatic look, black coat with red trim (16x24)
    const Sc = '#1a1a1a'; // black coat
    const R = '#8B0000'; // dark red trim
    const Sw = '#4a4a4a'; // dark grey wig

    const salieri = [
      [_,_,_,_,_,Sw,Sw,Sw,Sw,Sw,Sw,_,_,_,_,_],
      [_,_,_,_,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,_,_,_,_],
      [_,_,_,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,_,_,_],
      [_,_,_,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,Sw,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,R,R,R,R,R,_,_,_,_,_,_],
      [_,_,_,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,_,_,_,_],
      [_,_,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,_,_,_],
      [_,_,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,_,_,_],
      [_,S,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,S,_,_],
      [_,S,Sc,Sc,Sc,R,R,R,R,Sc,Sc,Sc,Sc,S,_,_],
      [_,S,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,S,_,_],
      [_,_,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,_,_,_],
      [_,_,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,Sc,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];
    this.createTexture('npc_salieri', salieri);

    // Nannerl NPC - similar to playable Nannerl but with different pose/detail (16x24)
    const D = '#FF69B4'; // pink dress
    const K = '#DB7093'; // darker pink
    const Rn = '#FF1493'; // ribbon
    const Wn = '#F5F5DC'; // wig

    const nannerlNPC = [
      [_,_,_,_,_,Wn,Wn,Wn,Wn,Wn,Wn,_,_,_,_,_],
      [_,_,_,_,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,_,_,_,_],
      [_,_,_,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,Wn,_,_,_],
      [_,_,_,Wn,Wn,Rn,Wn,Wn,Wn,Rn,Wn,Wn,Wn,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,G,G,G,G,G,_,_,_,_,_,_],
      [_,_,_,D,D,D,D,D,D,D,D,D,_,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,S,D,D,D,G,G,G,G,D,D,D,D,S,_,_],
      [_,S,D,D,D,D,D,D,D,D,D,D,D,S,_,_],
      [_,_,D,D,D,D,D,D,D,D,D,D,D,_,_,_],
      [_,_,K,K,D,D,D,D,D,D,D,K,K,_,_,_],
      [_,_,K,K,K,D,D,D,D,D,K,K,K,_,_,_],
      [_,K,K,K,K,D,D,D,D,D,K,K,K,K,_,_],
      [_,K,K,K,K,K,_,_,K,K,K,K,K,K,_,_],
      [_,_,K,K,K,K,_,_,K,K,K,K,K,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];
    this.createTexture('npc_nannerl', nannerlNPC);

    // Young Beethoven - wild brown hair, brown coat, intense look (16x24)
    const H = '#8B4513'; // brown hair
    const Bc = '#654321'; // brown coat
    const Y = '#DAA520'; // goldenrod vest

    const beethoven = [
      [_,_,_,_,H,H,H,H,H,H,H,H,_,_,_,_],
      [_,_,_,H,H,H,H,H,H,H,H,H,H,_,_,_],
      [_,_,H,H,H,H,H,H,H,H,H,H,H,H,_,_],
      [_,_,H,H,H,H,H,H,H,H,H,H,H,H,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,B,S,S,S,S,S,B,S,S,_,_,_],
      [_,_,_,S,S,S,S,S,S,S,S,S,S,_,_,_],
      [_,_,_,S,S,S,S,B,S,S,S,S,S,_,_,_],
      [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
      [_,_,_,_,_,Y,Y,Y,Y,Y,_,_,_,_,_,_],
      [_,_,_,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,_,_,_,_],
      [_,_,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,_,_,_],
      [_,_,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,_,_,_],
      [_,S,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,S,_,_],
      [_,S,Bc,Bc,Bc,Y,Y,Y,Y,Bc,Bc,Bc,Bc,S,_,_],
      [_,S,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,S,_,_],
      [_,_,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,_,_,_],
      [_,_,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,Bc,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,_,_,P,P,P,P,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,_,_,B,B,B,B,_,_,_,_],
    ];
    this.createTexture('npc_beethoven', beethoven);
  }

  generateTiles() {
    const _ = null;

    // Ground tile (16x16)
    const G = '#8B4513';
    const D = '#654321';
    const L = '#A0522D';

    const ground = [
      [L,L,L,G,G,G,G,G,G,G,G,G,L,L,L,L],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [G,G,G,G,D,G,G,G,G,G,D,G,G,G,G,G],
      [G,G,D,G,G,G,G,D,G,G,G,G,G,D,G,G],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [D,G,G,G,G,G,D,G,G,G,G,G,G,G,D,G],
      [G,G,G,D,G,G,G,G,G,D,G,G,G,G,G,G],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [G,D,G,G,G,G,G,G,D,G,G,G,D,G,G,G],
      [G,G,G,G,D,G,G,G,G,G,G,G,G,G,D,G],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [D,G,G,G,G,D,G,G,G,G,D,G,G,G,G,G],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [G,G,D,G,G,G,G,G,D,G,G,G,G,D,G,G],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    ];
    this.createTexture('ground', ground);

    // Platform tile (16x8)
    const P = '#696969';
    const H = '#808080';

    const platform = [
      [H,H,H,H,H,H,H,H,H,H,H,H,H,H,H,H],
      [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P],
      [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P],
      [P,H,P,P,P,P,H,P,P,P,P,H,P,P,P,P],
      [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P],
      [P,P,P,H,P,P,P,P,P,H,P,P,P,P,H,P],
      [P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P],
      [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    ];
    this.createTexture('platform', platform);

    // Vienna building block (16x16)
    const V = '#DEB887';
    const W = '#FFFACD';
    const R = '#8B0000';

    const building = [
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,W,W,W,V,V,V,V,V,W,W,W,V,V,V],
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,V,V,V,V,V,V,V,V,V,V,V,V,V,V],
      [V,V,V,V,V,V,R,R,R,R,V,V,V,V,V,V],
      [V,V,V,V,V,V,R,R,R,R,V,V,V,V,V,V],
      [V,V,V,V,V,V,R,R,R,R,V,V,V,V,V,V],
      [V,V,V,V,V,V,R,R,R,R,V,V,V,V,V,V],
    ];
    this.createTexture('building', building);

    // Forest tile (16x16)
    const F = '#228B22';
    const T = '#006400';
    const B = '#4B3621';

    const forestTile = [
      [F,F,T,F,F,F,T,F,F,F,F,T,F,F,F,F],
      [F,F,F,F,F,F,F,F,F,T,F,F,F,F,T,F],
      [T,F,F,F,T,F,F,F,F,F,F,F,T,F,F,F],
      [F,F,F,F,F,F,F,T,F,F,F,F,F,F,F,F],
      [F,T,F,F,F,F,F,F,F,F,T,F,F,F,F,T],
      [F,F,F,F,F,T,F,F,F,F,F,F,F,T,F,F],
      [F,F,F,T,F,F,F,F,T,F,F,F,F,F,F,F],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
      [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B],
    ];
    this.createTexture('forestGround', forestTile);

    // Palace tile (16x16)
    const M = '#4a1942';
    const Y = '#FFD700';

    const palaceTile = [
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,Y,M,M,M,M,M,Y,M,M,M,M,M,Y,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,M,M,M,Y,M,M,M,M,M,Y,M,M,M,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,Y,M,M,M,M,M,Y,M,M,M,M,M,Y,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,M,M,M,Y,M,M,M,M,M,Y,M,M,M,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,Y,M,M,M,M,M,Y,M,M,M,M,M,Y,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,M,M,M,Y,M,M,M,M,M,Y,M,M,M,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [M,Y,M,M,M,M,M,Y,M,M,M,M,M,Y,M,M],
      [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
      [Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y],
    ];
    this.createTexture('palaceGround', palaceTile);

    // Opera House tile (16x16)
    const OT = '#3d0000';
    const OR = '#8B0000';
    const OG = '#FFD700';

    const operaTile = [
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT,OT,OT,OG,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT,OR,OT,OT,OT,OT],
      [OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT,OT],
      [OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG,OG],
    ];
    this.createTexture('operaGround', operaTile);

    // Mountain tile (16x16)
    const MG = '#696969';
    const ML = '#808080';
    const MD = '#4a4a4a';
    const MW = '#FFFFFF';

    const mountainTile = [
      [ML,ML,MW,ML,MG,MG,MG,MG,MG,MG,MG,ML,MW,ML,MG,MG],
      [MG,MG,MG,MG,MG,MG,MG,MD,MG,MG,MG,MG,MG,MG,MG,MG],
      [MG,MD,MG,MG,MG,MG,MG,MG,MG,MG,MD,MG,MG,MG,MG,MG],
      [MG,MG,MG,MG,MD,MG,MG,MG,MG,MG,MG,MG,MG,MD,MG,MG],
      [MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG],
      [MD,MG,MG,MG,MG,MG,MD,MG,MG,MG,MG,MG,MG,MG,MD,MG],
      [MG,MG,MG,MD,MG,MG,MG,MG,MG,MD,MG,MG,MG,MG,MG,MG],
      [MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG],
      [MG,MD,MG,MG,MG,MG,MG,MG,MD,MG,MG,MG,MD,MG,MG,MG],
      [MG,MG,MG,MG,MD,MG,MG,MG,MG,MG,MG,MG,MG,MG,MD,MG],
      [MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG],
      [MD,MG,MG,MG,MG,MD,MG,MG,MG,MG,MD,MG,MG,MG,MG,MG],
      [MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG],
      [MG,MG,MD,MG,MG,MG,MG,MG,MD,MG,MG,MG,MG,MD,MG,MG],
      [MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG,MG],
      [MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD,MD],
    ];
    this.createTexture('mountainGround', mountainTile);

    // Cave tile (16x16)
    const CG = '#2a2a2a';
    const CD = '#1a1a1a';
    const CP = '#4a3080';

    const caveTile = [
      [CG,CG,CD,CG,CG,CG,CD,CG,CG,CG,CG,CD,CG,CG,CG,CG],
      [CG,CG,CG,CG,CG,CG,CG,CG,CG,CD,CG,CG,CG,CG,CD,CG],
      [CD,CG,CG,CG,CD,CG,CG,CG,CG,CG,CG,CG,CD,CG,CG,CG],
      [CG,CG,CG,CG,CG,CG,CG,CD,CG,CG,CG,CG,CG,CG,CG,CG],
      [CG,CP,CG,CG,CG,CG,CG,CG,CG,CG,CP,CG,CG,CG,CG,CP],
      [CG,CG,CG,CG,CG,CP,CG,CG,CG,CG,CG,CG,CG,CP,CG,CG],
      [CG,CG,CG,CD,CG,CG,CG,CG,CD,CG,CG,CG,CG,CG,CG,CG],
      [CD,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CD,CG],
      [CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG],
      [CG,CG,CP,CG,CG,CG,CG,CP,CG,CG,CG,CG,CP,CG,CG,CG],
      [CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG],
      [CD,CG,CG,CG,CD,CG,CG,CG,CG,CD,CG,CG,CG,CG,CD,CG],
      [CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG],
      [CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG,CG],
      [CG,CP,CG,CG,CP,CG,CG,CP,CG,CG,CP,CG,CG,CP,CG,CG],
      [CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD],
    ];
    this.createTexture('caveGround', caveTile);
  }

  generateItems() {
    const _ = null;

    // Music note collectible (10x12)
    const N = '#FFD700';

    const musicNote = [
      [_,_,_,_,_,_,N,N,_,_],
      [_,_,_,_,_,_,N,N,_,_],
      [_,_,_,_,_,_,N,N,_,_],
      [_,_,_,_,_,_,N,N,_,_],
      [_,_,_,_,_,_,N,N,_,_],
      [_,_,_,_,_,N,N,N,_,_],
      [_,_,_,_,N,N,N,N,_,_],
      [_,_,_,N,N,N,N,N,_,_],
      [_,_,N,N,N,N,N,N,_,_],
      [_,_,N,N,N,N,N,N,_,_],
      [_,_,N,N,N,N,N,_,_,_],
      [_,_,_,N,N,N,_,_,_,_],
    ];
    this.createTexture('musicNote', musicNote);

    // Violin (16x24)
    const V = '#D2691E';
    const S = '#DEB887';
    const B = '#1a1a1a';
    const G = '#FFD700';

    const violin = [
      [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,B,B,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,B,B,_,_,_],
      [_,_,_,_,_,_,_,_,_,_,B,B,_,_,_,_],
      [_,_,_,_,_,_,_,_,_,B,B,_,_,_,_,_],
      [_,_,_,_,_,_,_,_,B,B,_,_,_,_,_,_],
      [_,_,_,_,_,_,_,B,B,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,B,B,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,G,B,G,_,_,_,_,_,_,_,_],
      [_,_,_,_,V,V,V,V,V,_,_,_,_,_,_,_],
      [_,_,_,V,V,V,V,V,V,V,_,_,_,_,_,_],
      [_,_,V,V,V,V,V,V,V,V,V,_,_,_,_,_],
      [_,_,V,V,V,V,V,V,V,V,V,_,_,_,_,_],
      [_,_,_,V,V,V,V,V,V,V,_,_,_,_,_,_],
      [_,_,_,_,V,V,V,V,V,_,_,_,_,_,_,_],
      [_,_,_,V,V,V,V,V,V,V,_,_,_,_,_,_],
      [_,_,V,V,V,S,S,S,V,V,V,_,_,_,_,_],
      [_,_,V,V,V,S,S,S,V,V,V,_,_,_,_,_],
      [_,_,V,V,V,V,V,V,V,V,V,_,_,_,_,_],
      [_,_,_,V,V,V,V,V,V,V,_,_,_,_,_,_],
      [_,_,_,_,V,V,V,V,V,_,_,_,_,_,_,_],
      [_,_,_,_,_,V,V,V,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,G,G,G,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,G,_,_,_,_,_,_,_,_,_],
    ];
    this.createTexture('violin', violin);

    // Flute (24x8)
    const F = '#C0C0C0';
    const H = '#A9A9A9';

    const flute = [
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
      [_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_],
      [_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_],
      [F,F,H,F,F,H,F,F,H,F,F,H,F,F,F,F,F,F,F,F,F,F,F,G],
      [F,F,H,F,F,H,F,F,H,F,F,H,F,F,F,F,F,F,F,F,F,F,F,G],
      [_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_],
      [_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];
    this.createTexture('flute', flute);

    // Piano (24x16)
    const W = '#FFFFFF';
    const K = '#1a1a1a';

    const piano = [
      [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,W,K,W,W,W,K,W,K],
      [K,W,W,K,K,W,K,K,W,W,K,K,W,K,K,W,W,K,K,W,K,K,W,K],
      [K,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,K],
      [K,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,K],
      [K,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,K],
      [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K],
      [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K],
      [K,G,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,G,K],
      [K,G,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,G,K],
      [K,G,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,G,K],
    ];
    this.createTexture('piano', piano);

    // Harpsichord (24x16)
    const HC = '#8B4513';
    const HW = '#FFFACD';
    const HG = '#FFD700';
    const HK2 = '#1a1a1a';

    const harpsichord = [
      [HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2],
      [HK2,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HK2],
      [HK2,HC,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HC,HK2],
      [HK2,HC,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HC,HK2],
      [HK2,HC,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HW,HW,HK2,HC,HK2],
      [HK2,HC,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HC,HK2],
      [HK2,HC,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HW,HC,HK2],
      [HK2,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HC,HK2],
      [HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2,HK2],
      [_,_,HC,HC,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HC,HC],
      [_,_,HC,HC,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HC,HC],
      [_,_,HC,HC,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HC,HC],
      [_,_,HC,HC,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HC,HC],
      [_,_,HC,HC,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HC,HC],
      [_,HG,HC,HC,HG,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HG,HC,HC,HG],
      [_,HG,HG,HG,HG,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HG,HG,HG,HG],
    ];
    this.createTexture('harpsichord', harpsichord);

    // Trumpet (20x12)
    const TG = '#FFD700';
    const TS = '#C0C0C0';
    const TB = '#B8860B';

    const trumpet = [
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TG,TG,TG,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,TG,TG,TG,TG,TG,_],
      [_,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG],
      [TG,TG,TB,TG,TG,TB,TG,TG,TB,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG],
      [TG,TG,TB,TG,TG,TB,TG,TG,TB,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG],
      [TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG],
      [_,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG,TG],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,TG,TG,TG,TG,TG,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,TG,TG,TG,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    ];
    this.createTexture('trumpet', trumpet);

    // Drums (20x18)
    const DR = '#8B0000';
    const DW = '#F5F5DC';
    const DB = '#654321';
    const DG2 = '#FFD700';

    const drums = [
      [_,_,_,_,_,_,_,DB,DB,_,_,DB,DB,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,DB,_,_,DB,DB,_,_,DB,_,_,_,_,_,_],
      [_,_,_,_,_,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,_,_,_,_,_],
      [_,_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_,_],
      [_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DW,DR,DR,DW,DR,DR,DW,DR,DR,DW,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DR,DW,DR,DR,DW,DR,DR,DW,DR,DR,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DW,DR,DR,DW,DR,DR,DW,DR,DR,DW,DR,DG2,_,_,_],
      [_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_],
      [_,_,_,_,DG2,DR,DR,DR,DR,DR,DR,DR,DR,DR,DR,DG2,_,_,_,_],
      [_,_,_,_,_,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,DG2,_,_,_,_,_],
      [_,_,_,_,_,_,DB,DB,DB,DB,DB,DB,DB,DB,DB,_,_,_,_,_],
      [_,_,_,_,_,_,_,DB,_,_,_,_,_,DB,_,_,_,_,_,_],
      [_,_,_,_,_,_,_,DB,_,_,_,_,_,DB,_,_,_,_,_,_],
      [_,_,_,_,_,_,DB,DB,DB,_,_,DB,DB,DB,_,_,_,_,_,_],
      [_,_,_,_,_,_,DB,DB,DB,_,_,DB,DB,DB,_,_,_,_,_,_],
    ];
    this.createTexture('drums', drums);

    // Harp (16x24)
    const HP = '#DAA520';
    const HS = '#FFD700';
    const HB2 = '#8B6914';

    const harp = [
      [_,_,_,_,_,_,HP,HP,HP,HP,_,_,_,_,_,_],
      [_,_,_,_,_,HP,HP,HP,HP,HP,HP,_,_,_,_,_],
      [_,_,_,_,HP,HP,_,_,_,_,HP,HP,_,_,_,_],
      [_,_,_,HP,HP,_,_,_,_,_,_,HP,HP,_,_,_],
      [_,_,HP,HP,_,HS,_,HS,_,HS,_,_,HP,_,_,_],
      [_,_,HP,_,_,HS,_,HS,_,HS,_,_,HP,_,_,_],
      [_,HP,HP,_,_,HS,_,HS,_,HS,_,_,HP,_,_,_],
      [_,HP,_,_,_,HS,_,HS,_,HS,_,_,_,HP,_,_],
      [_,HP,_,_,_,HS,_,HS,_,HS,_,_,_,HP,_,_],
      [HP,HP,_,_,_,HS,_,HS,_,HS,_,_,_,HP,_,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,_,HP,_],
      [HP,_,_,_,_,HS,_,HS,_,HS,_,_,_,HP,_,_],
      [HP,HP,_,_,_,HS,_,HS,_,HS,_,_,HP,HP,_,_],
      [_,HP,HP,_,_,HS,_,HS,_,HS,_,HP,HP,_,_,_],
      [_,_,HP,HP,HP,HP,HP,HP,HP,HP,HP,HP,_,_,_,_],
      [_,_,_,HP,HP,HP,HP,HP,HP,HP,HP,_,_,_,_,_],
      [_,_,_,_,HB2,HB2,HB2,HB2,HB2,HB2,_,_,_,_,_,_],
      [_,_,_,_,_,HB2,HB2,HB2,HB2,_,_,_,_,_,_,_],
    ];
    this.createTexture('harp', harp);

    // Sheet Music Page (parchment with notes) (12x16)
    const P = '#F5DEB3'; // parchment
    const E = '#D2B48C'; // parchment edge
    const L = '#2F1B0E'; // ink lines (staff)
    const O = '#2F1B0E'; // ink notes

    const sheetMusic = [
      [_,E,E,E,E,E,E,E,E,E,E,_],
      [E,P,P,P,P,P,P,P,P,P,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,P,P,P,P,P,P,P,P,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,P,O,P,P,O,P,O,P,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,P,P,P,P,P,P,P,P,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,O,P,P,O,P,P,P,O,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,P,P,P,P,P,P,P,P,P,E],
      [E,P,L,L,L,L,L,L,L,L,P,E],
      [E,P,P,O,P,O,P,P,O,P,P,E],
      [E,P,P,P,P,P,P,P,P,P,P,E],
      [_,E,E,E,E,E,E,E,E,E,E,_],
    ];
    this.createTexture('sheetMusic', sheetMusic);
  }

  generateCheckpointAndUI() {
    const _ = null;

    // Checkpoint flag (12x20)
    const P = '#8B4513'; // pole
    const R = '#FF4444'; // flag red
    const W = '#FFFFFF'; // flag white

    const checkpointFlag = [
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,R,R,R,R,R,R,_,_,_],
      [_,_,P,R,W,W,R,R,R,_,_,_],
      [_,_,P,R,W,W,R,R,R,_,_,_],
      [_,_,P,R,R,R,R,R,R,_,_,_],
      [_,_,P,R,R,R,R,R,_,_,_,_],
      [_,_,P,R,R,R,R,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,_,P,_,_,_,_,_,_,_,_,_],
      [_,P,P,P,_,_,_,_,_,_,_,_],
      [_,P,P,P,_,_,_,_,_,_,_,_],
    ];
    this.createTexture('checkpointFlag', checkpointFlag);

    // Mozart head icon for lives HUD (11x11)
    const H = '#F5F5DC'; // wig
    const S = '#FFDAB9'; // skin
    const E = '#1a1a1a'; // eyes
    const B = '#4169E1'; // coat collar

    const mozartHead = [
      [_,_,_,H,H,H,H,H,_,_,_],
      [_,_,H,H,H,H,H,H,H,_,_],
      [_,H,H,H,H,H,H,H,H,H,_],
      [_,H,H,H,H,H,H,H,H,H,_],
      [_,_,S,S,S,S,S,S,S,_,_],
      [_,_,S,E,S,S,S,E,S,_,_],
      [_,_,S,S,S,S,S,S,S,_,_],
      [_,_,S,S,S,S,S,S,S,_,_],
      [_,_,_,S,S,S,S,S,_,_,_],
      [_,_,_,_,B,B,B,_,_,_,_],
      [_,_,_,B,B,B,B,B,_,_,_],
    ];
    this.createTexture('mozartHead', mozartHead);
  }

  generateBackgrounds() {
    // Generate simple gradient backgrounds as larger canvases
    this.generateGradientBackground('bgVienna', '#87CEEB', '#B0C4DE', '#DEB887');
    this.generateGradientBackground('bgForest', '#1a472a', '#2d5a27', '#3d6b3d');
    this.generateGradientBackground('bgPalace', '#1a1a2e', '#4a1942', '#16213e');
    this.generateGradientBackground('bgOpera', '#2a0a0a', '#4a1010', '#1a0505');
    this.generateGradientBackground('bgMountain', '#4a6fa5', '#6a8fbb', '#8ab0d4');
    this.generateGradientBackground('bgCaves', '#0a0a0a', '#151515', '#0a0a0a');
    this.generateGradientBackground('bgSky', '#1a1a4e', '#2a2a7e', '#4a4aae');
  }

  generateGradientBackground(key, topColor, midColor, bottomColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 480);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.5, midColor);
    gradient.addColorStop(1, bottomColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 480);

    this.scene.textures.addCanvas(key, canvas);
  }

  generateParticles() {
    // Dust particle (small brown circle)
    this.generateCircleTexture('particleDust', 4, '#8B6914', 0.7);

    // Musical note particle (small golden note shape)
    this.generateNoteParticle('particleNote');

    // Poof particle (white/grey cloud puff)
    this.generateCircleTexture('particlePoof', 6, '#FFFFFF', 0.8);

    // Sparkle particle (small star/diamond)
    this.generateSparkleParticle('particleSparkle');
  }

  generateCircleTexture(key, radius, color, alpha = 1) {
    const canvas = document.createElement('canvas');
    const size = radius * 2 + 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(radius + 1, radius + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    this.scene.textures.addCanvas(key, canvas);
  }

  generateNoteParticle(key) {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFD700';
    // Note head
    ctx.beginPath();
    ctx.ellipse(4, 9, 3, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.fillRect(6, 1, 1.5, 8);
    // Flag
    ctx.beginPath();
    ctx.moveTo(7.5, 1);
    ctx.quadraticCurveTo(10, 3, 7.5, 5);
    ctx.fill();

    this.scene.textures.addCanvas(key, canvas);
  }

  generateSparkleParticle(key) {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    // Diamond/star shape
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(5, 3);
    ctx.lineTo(8, 4);
    ctx.lineTo(5, 5);
    ctx.lineTo(4, 8);
    ctx.lineTo(3, 5);
    ctx.lineTo(0, 4);
    ctx.lineTo(3, 3);
    ctx.closePath();
    ctx.fill();

    this.scene.textures.addCanvas(key, canvas);
  }

  generateParallaxLayers() {
    this.generateViennaParallax();
    this.generateForestParallax();
    this.generatePalaceParallax();
  }

  generateViennaParallax() {
    // Far layer: sky with clouds
    const canvas1 = document.createElement('canvas');
    canvas1.width = 800;
    canvas1.height = 480;
    const ctx1 = canvas1.getContext('2d');
    const gradient1 = ctx1.createLinearGradient(0, 0, 0, 480);
    gradient1.addColorStop(0, '#87CEEB');
    gradient1.addColorStop(1, '#B0C4DE');
    ctx1.fillStyle = gradient1;
    ctx1.fillRect(0, 0, 800, 480);
    // Clouds
    ctx1.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.drawCloud(ctx1, 100, 60, 50);
    this.drawCloud(ctx1, 350, 90, 40);
    this.drawCloud(ctx1, 600, 50, 55);
    this.drawCloud(ctx1, 750, 100, 35);
    this.scene.textures.addCanvas('parallaxVienna_far', canvas1);

    // Mid layer: distant buildings silhouette
    const canvas2 = document.createElement('canvas');
    canvas2.width = 800;
    canvas2.height = 480;
    const ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = 'rgba(180, 160, 140, 0.5)';
    for (let i = 0; i < 12; i++) {
      const bx = i * 70;
      const bh = 80 + Math.sin(i * 1.3) * 40;
      ctx2.fillRect(bx, 480 - bh - 50, 55, bh);
      // Roof
      ctx2.beginPath();
      ctx2.moveTo(bx, 480 - bh - 50);
      ctx2.lineTo(bx + 27, 480 - bh - 70);
      ctx2.lineTo(bx + 55, 480 - bh - 50);
      ctx2.fill();
    }
    this.scene.textures.addCanvas('parallaxVienna_mid', canvas2);

    // Near layer: closer buildings with detail
    const canvas3 = document.createElement('canvas');
    canvas3.width = 800;
    canvas3.height = 480;
    const ctx3 = canvas3.getContext('2d');
    ctx3.fillStyle = 'rgba(139, 119, 101, 0.4)';
    for (let i = 0; i < 6; i++) {
      const bx = i * 140 + 20;
      const bh = 120 + Math.sin(i * 2.1) * 50;
      ctx3.fillRect(bx, 480 - bh - 32, 100, bh);
      // Windows
      ctx3.fillStyle = 'rgba(255, 250, 205, 0.3)';
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < 3; wx++) {
          ctx3.fillRect(bx + 15 + wx * 30, 480 - bh - 20 + wy * 35, 12, 15);
        }
      }
      ctx3.fillStyle = 'rgba(139, 119, 101, 0.4)';
    }
    this.scene.textures.addCanvas('parallaxVienna_near', canvas3);
  }

  generateForestParallax() {
    // Far layer: misty mountains
    const canvas1 = document.createElement('canvas');
    canvas1.width = 800;
    canvas1.height = 480;
    const ctx1 = canvas1.getContext('2d');
    const gradient1 = ctx1.createLinearGradient(0, 0, 0, 480);
    gradient1.addColorStop(0, '#0d3320');
    gradient1.addColorStop(1, '#1a472a');
    ctx1.fillStyle = gradient1;
    ctx1.fillRect(0, 0, 800, 480);
    // Mountains
    ctx1.fillStyle = 'rgba(20, 60, 40, 0.6)';
    ctx1.beginPath();
    ctx1.moveTo(0, 400);
    ctx1.lineTo(100, 200);
    ctx1.lineTo(200, 320);
    ctx1.lineTo(350, 180);
    ctx1.lineTo(500, 300);
    ctx1.lineTo(600, 220);
    ctx1.lineTo(750, 280);
    ctx1.lineTo(800, 250);
    ctx1.lineTo(800, 480);
    ctx1.lineTo(0, 480);
    ctx1.fill();
    this.scene.textures.addCanvas('parallaxForest_far', canvas1);

    // Mid layer: distant trees
    const canvas2 = document.createElement('canvas');
    canvas2.width = 800;
    canvas2.height = 480;
    const ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = 'rgba(34, 90, 34, 0.5)';
    for (let i = 0; i < 16; i++) {
      const tx = i * 55 + Math.sin(i) * 10;
      const th = 60 + Math.sin(i * 1.7) * 20;
      // Tree trunk
      ctx2.fillStyle = 'rgba(60, 40, 20, 0.4)';
      ctx2.fillRect(tx + 8, 480 - th - 40, 6, 40);
      // Tree canopy
      ctx2.fillStyle = 'rgba(34, 90, 34, 0.5)';
      ctx2.beginPath();
      ctx2.moveTo(tx, 480 - th);
      ctx2.lineTo(tx + 11, 480 - th - 50);
      ctx2.lineTo(tx + 22, 480 - th);
      ctx2.fill();
    }
    this.scene.textures.addCanvas('parallaxForest_mid', canvas2);

    // Near layer: closer foliage
    const canvas3 = document.createElement('canvas');
    canvas3.width = 800;
    canvas3.height = 480;
    const ctx3 = canvas3.getContext('2d');
    for (let i = 0; i < 8; i++) {
      const tx = i * 110 + 20;
      const th = 100 + Math.sin(i * 2.3) * 40;
      // Large tree
      ctx3.fillStyle = 'rgba(50, 30, 15, 0.35)';
      ctx3.fillRect(tx + 15, 480 - th - 32, 12, 80);
      ctx3.fillStyle = 'rgba(40, 100, 40, 0.35)';
      ctx3.beginPath();
      ctx3.arc(tx + 21, 480 - th - 20, 30, 0, Math.PI * 2);
      ctx3.fill();
    }
    this.scene.textures.addCanvas('parallaxForest_near', canvas3);
  }

  generatePalaceParallax() {
    // Far layer: starry night sky
    const canvas1 = document.createElement('canvas');
    canvas1.width = 800;
    canvas1.height = 480;
    const ctx1 = canvas1.getContext('2d');
    const gradient1 = ctx1.createLinearGradient(0, 0, 0, 480);
    gradient1.addColorStop(0, '#0a0a1a');
    gradient1.addColorStop(1, '#1a1a2e');
    ctx1.fillStyle = gradient1;
    ctx1.fillRect(0, 0, 800, 480);
    // Stars
    ctx1.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + 23) % 800;
      const sy = (i * 89 + 47) % 300;
      const size = (i % 3) + 1;
      ctx1.fillRect(sx, sy, size, size);
    }
    this.scene.textures.addCanvas('parallaxPalace_far', canvas1);

    // Mid layer: palace towers silhouette
    const canvas2 = document.createElement('canvas');
    canvas2.width = 800;
    canvas2.height = 480;
    const ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = 'rgba(60, 20, 60, 0.5)';
    // Palace outline
    const towers = [50, 200, 400, 550, 700];
    towers.forEach((tx, i) => {
      const th = 150 + (i % 2) * 60;
      ctx2.fillRect(tx, 480 - th - 50, 40, th);
      // Dome top
      ctx2.beginPath();
      ctx2.arc(tx + 20, 480 - th - 50, 20, Math.PI, 0);
      ctx2.fill();
    });
    // Connecting walls
    ctx2.fillRect(50, 480 - 120, 690, 70);
    this.scene.textures.addCanvas('parallaxPalace_mid', canvas2);

    // Near layer: columns and drapes
    const canvas3 = document.createElement('canvas');
    canvas3.width = 800;
    canvas3.height = 480;
    const ctx3 = canvas3.getContext('2d');
    for (let i = 0; i < 6; i++) {
      const cx = i * 150 + 30;
      // Column
      ctx3.fillStyle = 'rgba(80, 40, 80, 0.3)';
      ctx3.fillRect(cx, 200, 20, 250);
      // Column top
      ctx3.fillRect(cx - 5, 195, 30, 10);
      // Drape between columns
      if (i < 5) {
        ctx3.fillStyle = 'rgba(100, 20, 80, 0.2)';
        ctx3.beginPath();
        ctx3.moveTo(cx + 20, 200);
        ctx3.quadraticCurveTo(cx + 85, 240, cx + 150, 200);
        ctx3.lineTo(cx + 150, 210);
        ctx3.quadraticCurveTo(cx + 85, 250, cx + 20, 210);
        ctx3.fill();
      }
    }
    this.scene.textures.addCanvas('parallaxPalace_near', canvas3);
  }

  drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  generateRhythmSprites() {
    // Rhythm note (12x12 diamond/circle shape for scrolling notes)
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');

    // Outer glow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(12, 12, 11, 0, Math.PI * 2);
    ctx.fill();

    // Main note body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(12, 12, 8, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(10, 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Music symbol inside
    ctx.fillStyle = '#1a0a2e';
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', 12, 13);

    this.scene.textures.addCanvas('rhythmNote', canvas);

    // Practice Stage object (32x48 - a small stage/podium with musical decoration)
    const _ = null;
    const W = '#8B4513'; // wood
    const G = '#FFD700'; // gold
    const P = '#4a1942'; // purple curtain
    const D = '#2d1b4e'; // dark purple
    const L = '#DEB887'; // light wood

    const practiceStage = [
      [_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_],
      [_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_],
      [_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,P,G,G,G,G,G,G,G,G,P,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,G,G,G,G,G,G,G,G,G,G,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,G,_,_,_,G,G,_,_,_,G,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,G,_,_,_,G,G,_,_,_,G,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,G,G,G,G,G,G,G,G,G,G,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,P,P,P,P,P,G,G,G,G,G,G,G,G,P,P,P,P,P,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,P,P,_,_,_],
      [_,_,_,P,P,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,P,P,_,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
      [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
      [_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_],
      [_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_],
      [W,W,W,L,L,W,W,W,L,L,W,W,W,L,L,W,W,L,L,W,W,W,L,L,W,W,W,L,L,W,W,W],
      [W,W,W,L,L,W,W,W,L,L,W,W,W,L,L,W,W,L,L,W,W,W,L,L,W,W,W,L,L,W,W,W],
      [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
      [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
      [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
      [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
      [W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W],
      [W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W,L,L,W,W,W,W],
      [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    ];
    this.createTexture('practiceStage', practiceStage, 2);
  }
}
