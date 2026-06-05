import { describe, it, expect } from 'vitest';

// CompositionCollector manages melody memory — we test its pure logic:
// MIDI-to-frequency conversion, sequence comparison, and scoring.

describe('MelodyMemory - Sequence Comparison and Scoring', () => {
  // Recreate the pure functions from CompositionCollector
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getPitchClass(label) {
    return label.replace(/[0-9]/g, '');
  }

  const MELODY_DEFINITIONS = {
    1: {
      name: 'Eine kleine Nachtmusik',
      notes: [
        { midi: 67, label: 'G4' },
        { midi: 62, label: 'D4' },
        { midi: 67, label: 'G4' },
        { midi: 62, label: 'D4' }
      ]
    },
    7: {
      name: 'Jupiter Fugue',
      notes: [
        { midi: 60, label: 'C4' },
        { midi: 62, label: 'D4' },
        { midi: 65, label: 'F4' },
        { midi: 64, label: 'E4' }
      ]
    }
  };

  // Scoring: correct note in order = 100pts, wrong note = -50pts
  function scoreMelodyAttempt(melody, collected) {
    let score = 0;
    let correctInOrder = 0;

    for (let i = 0; i < collected.length; i++) {
      if (i < melody.notes.length && collected[i].midi === melody.notes[i].midi) {
        score += 100;
        correctInOrder++;
      } else {
        score -= 50;
      }
    }
    return { score, correctInOrder, total: melody.notes.length };
  }

  describe('midiToFreq()', () => {
    it('should convert MIDI 69 to 440 Hz (A4)', () => {
      expect(midiToFreq(69)).toBeCloseTo(440, 1);
    });

    it('should convert MIDI 60 to ~261.63 Hz (C4)', () => {
      expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
    });

    it('should convert MIDI 72 to ~523.25 Hz (C5)', () => {
      expect(midiToFreq(72)).toBeCloseTo(523.25, 1);
    });

    it('should double frequency per octave (12 semitones)', () => {
      const freq60 = midiToFreq(60);
      const freq72 = midiToFreq(72);
      expect(freq72).toBeCloseTo(freq60 * 2, 1);
    });

    it('should handle edge MIDI values', () => {
      expect(midiToFreq(0)).toBeGreaterThan(0);
      expect(midiToFreq(127)).toBeGreaterThan(0);
      expect(midiToFreq(127)).toBeGreaterThan(midiToFreq(0));
    });
  });

  describe('getPitchClass()', () => {
    it('should extract pitch class from note label', () => {
      expect(getPitchClass('G4')).toBe('G');
      expect(getPitchClass('D4')).toBe('D');
    });

    it('should handle accidentals', () => {
      expect(getPitchClass('Eb4')).toBe('Eb');
      expect(getPitchClass('C#4')).toBe('C#');
      expect(getPitchClass('Bb3')).toBe('Bb');
    });

    it('should handle different octaves', () => {
      expect(getPitchClass('C5')).toBe('C');
      expect(getPitchClass('A3')).toBe('A');
    });
  });

  describe('melody scoring', () => {
    it('should award full score for perfect collection', () => {
      const melody = MELODY_DEFINITIONS[1];
      const collected = melody.notes.map(n => ({ midi: n.midi }));
      const result = scoreMelodyAttempt(melody, collected);
      expect(result.score).toBe(400); // 4 notes × 100
      expect(result.correctInOrder).toBe(4);
    });

    it('should penalize wrong notes', () => {
      const melody = MELODY_DEFINITIONS[1];
      const collected = [
        { midi: 67 }, // correct
        { midi: 60 }, // wrong (should be 62)
        { midi: 67 }, // correct
        { midi: 62 }  // correct
      ];
      const result = scoreMelodyAttempt(melody, collected);
      expect(result.score).toBe(250); // 3×100 - 1×50
    });

    it('should handle empty collection', () => {
      const melody = MELODY_DEFINITIONS[1];
      const result = scoreMelodyAttempt(melody, []);
      expect(result.score).toBe(0);
      expect(result.correctInOrder).toBe(0);
    });

    it('should handle all wrong notes', () => {
      const melody = MELODY_DEFINITIONS[7];
      const collected = [
        { midi: 99 }, { midi: 99 }, { midi: 99 }, { midi: 99 }
      ];
      const result = scoreMelodyAttempt(melody, collected);
      expect(result.score).toBe(-200); // 4 × -50
    });

    it('should handle partial collection', () => {
      const melody = MELODY_DEFINITIONS[7]; // 4 notes
      const collected = [{ midi: 60 }, { midi: 62 }]; // first 2 correct
      const result = scoreMelodyAttempt(melody, collected);
      expect(result.score).toBe(200);
      expect(result.correctInOrder).toBe(2);
    });
  });

  describe('melody definitions integrity', () => {
    it('should have named melodies', () => {
      expect(MELODY_DEFINITIONS[1].name).toBe('Eine kleine Nachtmusik');
      expect(MELODY_DEFINITIONS[7].name).toBe('Jupiter Fugue');
    });

    it('should have valid MIDI values (21-108 piano range)', () => {
      for (const def of Object.values(MELODY_DEFINITIONS)) {
        for (const note of def.notes) {
          expect(note.midi).toBeGreaterThanOrEqual(21);
          expect(note.midi).toBeLessThanOrEqual(108);
        }
      }
    });

    it('should have labels for all notes', () => {
      for (const def of Object.values(MELODY_DEFINITIONS)) {
        for (const note of def.notes) {
          expect(note.label).toBeDefined();
          expect(note.label.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });
});
