// Game constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const TILE_SIZE = 32;

export const PLAYER = {
  SPEED: 200,
  JUMP_VELOCITY: -420,
  GRAVITY: 800,
  MAX_LIVES: 3,
  INVINCIBLE_TIME: 1500
};

export const ENEMIES = {
  SINGER: { SPEED: 60, SCORE: 100 },
  DRUM_TROLL: { SPEED: 80, JUMP_FORCE: -300, SCORE: 150 },
  DISSONANT_NOTE: { SPEED: 50, FLOAT_AMPLITUDE: 30, SCORE: 75 },
  BROKEN_INSTRUMENT: { SPEED: 100, CHARGE_SPEED: 200, SCORE: 125 }
};

export const COLORS = {
  SKY_BLUE: 0x87CEEB,
  FOREST_GREEN: 0x2d5a27,
  PALACE_PURPLE: 0x4a1942,
  GROUND_BROWN: 0x8B4513,
  GOLD: 0xFFD700,
  MOZART_WIG: 0xF5F5DC,
  MOZART_COAT: 0x4169E1
};

export const LEVELS = {
  VIENNA: 'Level1Scene',
  FOREST: 'Level2Scene',
  PALACE: 'Level3Scene'
};

export const INSTRUMENTS = ['violin', 'flute', 'piano'];
