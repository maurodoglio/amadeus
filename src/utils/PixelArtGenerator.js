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
    this.generateEnemies();
    this.generateTiles();
    this.generateItems();
    this.generateBackgrounds();
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
  }

  generateBackgrounds() {
    // Generate simple gradient backgrounds as larger canvases
    this.generateGradientBackground('bgVienna', '#87CEEB', '#B0C4DE', '#DEB887');
    this.generateGradientBackground('bgForest', '#1a472a', '#2d5a27', '#3d6b3d');
    this.generateGradientBackground('bgPalace', '#1a1a2e', '#4a1942', '#16213e');
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
}
