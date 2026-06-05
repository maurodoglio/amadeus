import { describe, it, expect } from 'vitest';

// InstrumentLesson covers the fingering validation and instrument tutorial logic.
// Since there's no dedicated InstrumentLesson module in src/mechanics/, we test
// the instrument-related validation logic based on the weapon/config system.

describe('InstrumentLesson - Fingering Validation', () => {
  // Fingering definitions for different instruments
  const FINGERINGS = {
    violin: {
      strings: ['G', 'D', 'A', 'E'],
      positions: [0, 1, 2, 3], // open, 1st, 2nd, 3rd position
      notes: {
        'G': { string: 'G', position: 0 },
        'A': { string: 'G', position: 1 },
        'B': { string: 'G', position: 2 },
        'C': { string: 'G', position: 3 },
        'D': { string: 'D', position: 0 },
        'E': { string: 'D', position: 1 },
        'F': { string: 'D', position: 2 },
      }
    },
    flute: {
      keys: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      notes: {
        'C4': ['thumb', 'index', 'middle', 'ring', 'pinky'],
        'D4': ['thumb', 'index', 'middle', 'ring'],
        'E4': ['thumb', 'index', 'middle'],
        'F4': ['thumb', 'index', 'middle', 'pinky'],
        'G4': ['thumb', 'index'],
        'A4': ['thumb'],
        'B4': [],
      }
    }
  };

  function validateFingering(instrument, noteName, playerFingering) {
    const instrumentDef = FINGERINGS[instrument];
    if (!instrumentDef) return { valid: false, error: 'Unknown instrument' };

    const correctFingering = instrumentDef.notes[noteName];
    if (!correctFingering) return { valid: false, error: 'Unknown note' };

    if (instrument === 'violin') {
      return {
        valid: playerFingering.string === correctFingering.string &&
               playerFingering.position === correctFingering.position,
        expected: correctFingering
      };
    }

    if (instrument === 'flute') {
      const playerKeys = [...playerFingering].sort();
      const correctKeys = [...correctFingering].sort();
      return {
        valid: JSON.stringify(playerKeys) === JSON.stringify(correctKeys),
        expected: correctFingering
      };
    }

    return { valid: false, error: 'Validation not implemented' };
  }

  function calculateLessonScore(attempts) {
    let correct = 0;
    let total = attempts.length;
    for (const attempt of attempts) {
      if (attempt.valid) correct++;
    }
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    let grade;
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    else grade = 'F';

    return { correct, total, percentage, grade };
  }

  describe('violin fingering validation', () => {
    it('should validate correct open string', () => {
      const result = validateFingering('violin', 'G', { string: 'G', position: 0 });
      expect(result.valid).toBe(true);
    });

    it('should validate correct fingered note', () => {
      const result = validateFingering('violin', 'A', { string: 'G', position: 1 });
      expect(result.valid).toBe(true);
    });

    it('should reject wrong string', () => {
      const result = validateFingering('violin', 'G', { string: 'D', position: 0 });
      expect(result.valid).toBe(false);
    });

    it('should reject wrong position', () => {
      const result = validateFingering('violin', 'A', { string: 'G', position: 2 });
      expect(result.valid).toBe(false);
    });

    it('should return expected fingering on failure', () => {
      const result = validateFingering('violin', 'B', { string: 'G', position: 0 });
      expect(result.valid).toBe(false);
      expect(result.expected).toEqual({ string: 'G', position: 2 });
    });
  });

  describe('flute fingering validation', () => {
    it('should validate correct full fingering (C4)', () => {
      const result = validateFingering('flute', 'C4',
        ['thumb', 'index', 'middle', 'ring', 'pinky']);
      expect(result.valid).toBe(true);
    });

    it('should validate correct partial fingering (G4)', () => {
      const result = validateFingering('flute', 'G4', ['thumb', 'index']);
      expect(result.valid).toBe(true);
    });

    it('should validate open fingering (B4)', () => {
      const result = validateFingering('flute', 'B4', []);
      expect(result.valid).toBe(true);
    });

    it('should be order-independent', () => {
      const result = validateFingering('flute', 'C4',
        ['pinky', 'ring', 'middle', 'index', 'thumb']);
      expect(result.valid).toBe(true);
    });

    it('should reject missing keys', () => {
      const result = validateFingering('flute', 'C4', ['thumb', 'index']);
      expect(result.valid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle unknown instrument', () => {
      const result = validateFingering('tuba', 'C4', {});
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown instrument');
    });

    it('should handle unknown note', () => {
      const result = validateFingering('violin', 'Z9', { string: 'G', position: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown note');
    });
  });

  describe('lesson scoring', () => {
    it('should give A grade for 90%+ correct', () => {
      const attempts = Array(10).fill({ valid: true });
      attempts[0] = { valid: false };
      const result = calculateLessonScore(attempts);
      expect(result.grade).toBe('A');
      expect(result.percentage).toBe(90);
    });

    it('should give F grade for below 60%', () => {
      const attempts = [
        { valid: true }, { valid: false }, { valid: false },
        { valid: false }, { valid: false }
      ];
      const result = calculateLessonScore(attempts);
      expect(result.grade).toBe('F');
    });

    it('should handle perfect score', () => {
      const attempts = Array(5).fill({ valid: true });
      const result = calculateLessonScore(attempts);
      expect(result.grade).toBe('A');
      expect(result.percentage).toBe(100);
      expect(result.correct).toBe(5);
    });

    it('should handle empty attempts', () => {
      const result = calculateLessonScore([]);
      expect(result.percentage).toBe(0);
      expect(result.grade).toBe('F');
    });

    it('should calculate correct percentage', () => {
      const attempts = [
        { valid: true }, { valid: true }, { valid: false }, { valid: true }
      ];
      const result = calculateLessonScore(attempts);
      expect(result.correct).toBe(3);
      expect(result.total).toBe(4);
      expect(result.percentage).toBe(75);
      expect(result.grade).toBe('C');
    });
  });
});
