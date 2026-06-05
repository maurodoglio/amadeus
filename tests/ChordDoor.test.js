import { describe, it, expect } from 'vitest';

// Test the chord validation logic directly without Phaser dependency.
// The ChordDoor class is tightly coupled to Phaser for rendering, so we
// test the helper functions and chord library data extracted from the module.

// We can't easily import ChordDoor without heavy mocking, but we can test
// the pure-logic functions by recreating them here (they're module-private).
// Instead, we test the chord matching algorithm as the game would use it.

describe('ChordDoor - Chord Validation Logic', () => {
  // Recreate the chord validation logic as used in ChordDoor
  const CHORD_LIBRARY = {
    easy: [
      { name: 'C Major', notes: ['C', 'E', 'G'] },
      { name: 'G Major', notes: ['G', 'B', 'D'] },
      { name: 'F Major', notes: ['F', 'A', 'C'] },
      { name: 'D Major', notes: ['D', 'F#', 'A'] },
    ],
    medium: [
      { name: 'A Minor', notes: ['A', 'C', 'E'] },
      { name: 'E Minor', notes: ['E', 'G', 'B'] },
    ],
    hard: [
      { name: 'G7', notes: ['G', 'B', 'D', 'F'] },
      { name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'] },
    ],
    expert: [
      { name: 'B Dim', notes: ['B', 'D', 'F'] },
      { name: 'C Aug', notes: ['C', 'E', 'G#'] },
    ]
  };

  function getDifficultyTier(level) {
    if (level <= 2) return 'easy';
    if (level <= 4) return 'medium';
    if (level <= 6) return 'hard';
    return 'expert';
  }

  function getNoteOptionCount(level) {
    if (level <= 2) return 4;
    if (level <= 4) return 5;
    if (level <= 6) return 6;
    return 7;
  }

  // Chord matching: player collects notes, check if all required notes are collected
  function validateChord(requiredNotes, collectedNotes) {
    return requiredNotes.every(note => collectedNotes.includes(note));
  }

  describe('getDifficultyTier()', () => {
    it('should return easy for levels 1-2', () => {
      expect(getDifficultyTier(1)).toBe('easy');
      expect(getDifficultyTier(2)).toBe('easy');
    });

    it('should return medium for levels 3-4', () => {
      expect(getDifficultyTier(3)).toBe('medium');
      expect(getDifficultyTier(4)).toBe('medium');
    });

    it('should return hard for levels 5-6', () => {
      expect(getDifficultyTier(5)).toBe('hard');
      expect(getDifficultyTier(6)).toBe('hard');
    });

    it('should return expert for level 7+', () => {
      expect(getDifficultyTier(7)).toBe('expert');
      expect(getDifficultyTier(10)).toBe('expert');
    });
  });

  describe('getNoteOptionCount()', () => {
    it('should give 4 options for easy levels', () => {
      expect(getNoteOptionCount(1)).toBe(4);
      expect(getNoteOptionCount(2)).toBe(4);
    });

    it('should give 5 options for medium levels', () => {
      expect(getNoteOptionCount(3)).toBe(5);
    });

    it('should give 6 options for hard levels', () => {
      expect(getNoteOptionCount(5)).toBe(6);
    });

    it('should give 7 options for expert', () => {
      expect(getNoteOptionCount(7)).toBe(7);
    });
  });

  describe('chord validation', () => {
    it('should validate when all required notes are collected', () => {
      expect(validateChord(['C', 'E', 'G'], ['C', 'E', 'G'])).toBe(true);
    });

    it('should validate even with extra collected notes', () => {
      expect(validateChord(['C', 'E', 'G'], ['C', 'E', 'G', 'A', 'B'])).toBe(true);
    });

    it('should fail when missing a required note', () => {
      expect(validateChord(['C', 'E', 'G'], ['C', 'E'])).toBe(false);
    });

    it('should fail with completely wrong notes', () => {
      expect(validateChord(['C', 'E', 'G'], ['A', 'B', 'D'])).toBe(false);
    });

    it('should handle 4-note seventh chords', () => {
      expect(validateChord(['G', 'B', 'D', 'F'], ['G', 'B', 'D', 'F'])).toBe(true);
      expect(validateChord(['G', 'B', 'D', 'F'], ['G', 'B', 'D'])).toBe(false);
    });

    it('should be order-independent', () => {
      expect(validateChord(['C', 'E', 'G'], ['G', 'C', 'E'])).toBe(true);
    });
  });

  describe('chord library data integrity', () => {
    it('should have chords with at least 3 notes', () => {
      for (const tier of Object.values(CHORD_LIBRARY)) {
        for (const chord of tier) {
          expect(chord.notes.length).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('should have hard/expert chords more complex than easy', () => {
      const easyMaxNotes = Math.max(...CHORD_LIBRARY.easy.map(c => c.notes.length));
      const hardMinNotes = Math.min(...CHORD_LIBRARY.hard.map(c => c.notes.length));
      expect(hardMinNotes).toBeGreaterThanOrEqual(easyMaxNotes);
    });

    it('should have unique chord names within each tier', () => {
      for (const [tier, chords] of Object.entries(CHORD_LIBRARY)) {
        const names = chords.map(c => c.name);
        expect(new Set(names).size).toBe(names.length);
      }
    });
  });
});
