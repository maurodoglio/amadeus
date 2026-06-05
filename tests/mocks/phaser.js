/**
 * Minimal Phaser mock for unit testing game mechanics.
 * Only stubs the APIs actually used by mechanics modules.
 */

const Phaser = {
  Math: {
    Angle: {
      Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
    },
    Distance: {
      Between: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    },
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  },
  Utils: {
    Array: {
      Shuffle: (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }
    }
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54,
        Q: 81, SPACE: 32
      },
      JustDown: () => false
    }
  }
};

export default Phaser;
