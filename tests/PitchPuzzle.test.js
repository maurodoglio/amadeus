import { describe, it, expect } from 'vitest';

// PitchPuzzle is tightly coupled to Phaser, so we test the pure logic
// functions: note-to-MIDI conversion, frequency tolerance, and sequence matching.

describe('PitchPuzzle - Note Matching Logic', () => {
  // Recreate pure logic from PitchPuzzle module
  const NOTE_FREQUENCIES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25
  };

  const PUZZLE_MELODIES = {
    1: ['C4', 'D4', 'E4', 'G4'],
    2: ['D4', 'E4', 'G4', 'A4'],
    3: ['C4', 'E4', 'G4', 'C5', 'G4'],
    4: ['E4', 'D4', 'C4', 'D4', 'E4'],
    5: ['G4', 'A4', 'B4', 'D5', 'B4', 'G4'],
    6: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4'],
    7: ['C5', 'B4', 'A4', 'G4', 'A4', 'B4']
  };

  function noteToMidi(noteName) {
    const noteMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    const match = noteName.match(/^([A-G])(\d)$/);
    if (!match) return 60;
    const [, letter, octave] = match;
    return 12 + parseInt(octave) * 12 + noteMap[letter];
  }

  function isFrequencyMatch(freq1, freq2, toleranceCents = 50) {
    const cents = 1200 * Math.log2(freq1 / freq2);
    return Math.abs(cents) <= toleranceCents;
  }

  // Sequence matching logic used by the puzzle
  function checkSequence(melody, playerSequence) {
    for (let i = 0; i < playerSequence.length; i++) {
      if (playerSequence[i] !== melody[i]) return { valid: false, failIndex: i };
    }
    return { valid: true, complete: playerSequence.length === melody.length };
  }

  describe('noteToMidi()', () => {
    it('should convert C4 to MIDI 60', () => {
      expect(noteToMidi('C4')).toBe(60);
    });

    it('should convert A4 to MIDI 69', () => {
      expect(noteToMidi('A4')).toBe(69);
    });

    it('should convert C5 to MIDI 72', () => {
      expect(noteToMidi('C5')).toBe(72);
    });

    it('should return 60 for invalid note names', () => {
      expect(noteToMidi('invalid')).toBe(60);
      expect(noteToMidi('')).toBe(60);
    });

    it('should handle all standard notes in octave 4', () => {
      expect(noteToMidi('D4')).toBe(62);
      expect(noteToMidi('E4')).toBe(64);
      expect(noteToMidi('F4')).toBe(65);
      expect(noteToMidi('G4')).toBe(67);
      expect(noteToMidi('B4')).toBe(71);
    });
  });

  describe('frequency tolerance matching', () => {
    it('should match exact frequencies', () => {
      expect(isFrequencyMatch(440, 440)).toBe(true);
    });

    it('should match within 50 cents tolerance', () => {
      // 50 cents above A4 ≈ 452.89 Hz
      expect(isFrequencyMatch(440, 450)).toBe(true);
    });

    it('should reject frequencies outside tolerance', () => {
      // 100 cents = one semitone (466.16 Hz for Bb4)
      expect(isFrequencyMatch(440, 466.16)).toBe(false);
    });

    it('should work bidirectionally', () => {
      expect(isFrequencyMatch(450, 440)).toBe(true);
      expect(isFrequencyMatch(430, 440)).toBe(true);
    });

    it('should reject completely different frequencies', () => {
      expect(isFrequencyMatch(261.63, 440)).toBe(false);
    });
  });

  describe('sequence checking', () => {
    const melody = ['C4', 'D4', 'E4', 'G4'];

    it('should validate correct partial sequence', () => {
      const result = checkSequence(melody, ['C4', 'D4']);
      expect(result.valid).toBe(true);
      expect(result.complete).toBe(false);
    });

    it('should validate complete correct sequence', () => {
      const result = checkSequence(melody, ['C4', 'D4', 'E4', 'G4']);
      expect(result.valid).toBe(true);
      expect(result.complete).toBe(true);
    });

    it('should detect wrong note at start', () => {
      const result = checkSequence(melody, ['D4']);
      expect(result.valid).toBe(false);
      expect(result.failIndex).toBe(0);
    });

    it('should detect wrong note in middle', () => {
      const result = checkSequence(melody, ['C4', 'D4', 'F4']);
      expect(result.valid).toBe(false);
      expect(result.failIndex).toBe(2);
    });

    it('should handle empty player sequence as valid', () => {
      const result = checkSequence(melody, []);
      expect(result.valid).toBe(true);
      expect(result.complete).toBe(false);
    });
  });

  describe('puzzle melodies', () => {
    it('should define melodies for all 7 levels', () => {
      for (let level = 1; level <= 7; level++) {
        expect(PUZZLE_MELODIES[level]).toBeDefined();
        expect(PUZZLE_MELODIES[level].length).toBeGreaterThanOrEqual(4);
      }
    });

    it('should increase melody length with difficulty', () => {
      expect(PUZZLE_MELODIES[1].length).toBeLessThanOrEqual(PUZZLE_MELODIES[5].length);
    });

    it('should only use valid note names', () => {
      const validNotes = Object.keys(NOTE_FREQUENCIES);
      for (const melody of Object.values(PUZZLE_MELODIES)) {
        for (const note of melody) {
          expect(validNotes).toContain(note);
        }
      }
    });
  });
});
