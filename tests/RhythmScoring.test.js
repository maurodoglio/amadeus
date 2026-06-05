import { describe, it, expect } from 'vitest';

// The game uses combo/timing mechanics in boss fights and platforming.
// We test the rhythm scoring logic: timing windows, combo multipliers, and grades.

describe('RhythmScoring - Timing Windows, Combos, and Grades', () => {
  // Timing window definitions (ms tolerance from beat)
  const TIMING_WINDOWS = {
    perfect: 30,   // ±30ms
    great: 80,     // ±80ms
    good: 150,     // ±150ms
    miss: Infinity // anything beyond good
  };

  function getTimingGrade(offsetMs) {
    const abs = Math.abs(offsetMs);
    if (abs <= TIMING_WINDOWS.perfect) return 'perfect';
    if (abs <= TIMING_WINDOWS.great) return 'great';
    if (abs <= TIMING_WINDOWS.good) return 'good';
    return 'miss';
  }

  function getGradeMultiplier(grade) {
    switch (grade) {
      case 'perfect': return 3.0;
      case 'great': return 2.0;
      case 'good': return 1.0;
      case 'miss': return 0;
      default: return 0;
    }
  }

  // Combo system: consecutive hits increase multiplier
  class ComboTracker {
    constructor() {
      this.count = 0;
      this.maxCombo = 0;
    }

    registerHit(grade) {
      if (grade === 'miss') {
        this.count = 0;
        return 0;
      }
      this.count++;
      this.maxCombo = Math.max(this.maxCombo, this.count);
      return this.getMultiplier();
    }

    getMultiplier() {
      if (this.count >= 20) return 4.0;
      if (this.count >= 10) return 3.0;
      if (this.count >= 5) return 2.0;
      if (this.count >= 2) return 1.5;
      return 1.0;
    }

    reset() {
      this.count = 0;
    }
  }

  function calculateScore(basePoints, gradeMultiplier, comboMultiplier) {
    return Math.round(basePoints * gradeMultiplier * comboMultiplier);
  }

  describe('getTimingGrade()', () => {
    it('should return perfect for exact hits', () => {
      expect(getTimingGrade(0)).toBe('perfect');
    });

    it('should return perfect within 30ms', () => {
      expect(getTimingGrade(25)).toBe('perfect');
      expect(getTimingGrade(-30)).toBe('perfect');
    });

    it('should return great between 31-80ms', () => {
      expect(getTimingGrade(50)).toBe('great');
      expect(getTimingGrade(-75)).toBe('great');
    });

    it('should return good between 81-150ms', () => {
      expect(getTimingGrade(100)).toBe('good');
      expect(getTimingGrade(-150)).toBe('good');
    });

    it('should return miss beyond 150ms', () => {
      expect(getTimingGrade(200)).toBe('miss');
      expect(getTimingGrade(-500)).toBe('miss');
    });
  });

  describe('getGradeMultiplier()', () => {
    it('should return 3x for perfect', () => {
      expect(getGradeMultiplier('perfect')).toBe(3.0);
    });

    it('should return 2x for great', () => {
      expect(getGradeMultiplier('great')).toBe(2.0);
    });

    it('should return 1x for good', () => {
      expect(getGradeMultiplier('good')).toBe(1.0);
    });

    it('should return 0 for miss', () => {
      expect(getGradeMultiplier('miss')).toBe(0);
    });
  });

  describe('ComboTracker', () => {
    it('should start at 0 combo', () => {
      const combo = new ComboTracker();
      expect(combo.count).toBe(0);
      expect(combo.getMultiplier()).toBe(1.0);
    });

    it('should increment on successful hits', () => {
      const combo = new ComboTracker();
      combo.registerHit('perfect');
      expect(combo.count).toBe(1);
      combo.registerHit('great');
      expect(combo.count).toBe(2);
    });

    it('should reset on miss', () => {
      const combo = new ComboTracker();
      combo.registerHit('perfect');
      combo.registerHit('perfect');
      combo.registerHit('miss');
      expect(combo.count).toBe(0);
    });

    it('should track max combo', () => {
      const combo = new ComboTracker();
      combo.registerHit('perfect');
      combo.registerHit('perfect');
      combo.registerHit('perfect');
      combo.registerHit('miss');
      combo.registerHit('good');
      expect(combo.maxCombo).toBe(3);
    });

    it('should scale multiplier with combo length', () => {
      const combo = new ComboTracker();
      expect(combo.getMultiplier()).toBe(1.0);
      combo.count = 2;
      expect(combo.getMultiplier()).toBe(1.5);
      combo.count = 5;
      expect(combo.getMultiplier()).toBe(2.0);
      combo.count = 10;
      expect(combo.getMultiplier()).toBe(3.0);
      combo.count = 20;
      expect(combo.getMultiplier()).toBe(4.0);
    });
  });

  describe('score calculation', () => {
    it('should calculate base score correctly', () => {
      expect(calculateScore(100, 1.0, 1.0)).toBe(100);
    });

    it('should apply grade multiplier', () => {
      expect(calculateScore(100, 3.0, 1.0)).toBe(300);
    });

    it('should apply combo multiplier', () => {
      expect(calculateScore(100, 1.0, 2.0)).toBe(200);
    });

    it('should combine both multipliers', () => {
      expect(calculateScore(100, 3.0, 4.0)).toBe(1200);
    });

    it('should return 0 for miss', () => {
      expect(calculateScore(100, 0, 1.0)).toBe(0);
    });
  });
});
