import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../src/utils/SaveManager.js';

describe('SaveManager', () => {
  let storage;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value; }),
      removeItem: vi.fn((key) => { delete storage[key]; })
    });
  });

  function createMockRegistry(data = {}) {
    const store = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      instruments: [],
      completedLevels: [],
      coopMode: false,
      comboMultiplier: 1,
      comboCount: 0,
      ...data
    };
    return {
      registry: {
        get: vi.fn((key) => store[key]),
        set: vi.fn((key, value) => { store[key] = value; })
      }
    };
  }

  describe('save', () => {
    it('saves game progress to localStorage', () => {
      const scene = createMockRegistry({
        currentLevel: 3,
        score: 1500,
        lives: 2,
        instruments: ['violin', 'flute'],
        completedLevels: [1, 2],
        coopMode: false
      });

      const result = SaveManager.save(scene);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'amadeus_save',
        expect.any(String)
      );

      const saved = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(saved.currentLevel).toBe(3);
      expect(saved.score).toBe(1500);
      expect(saved.lives).toBe(2);
      expect(saved.instruments).toEqual(['violin', 'flute']);
      expect(saved.completedLevels).toEqual([1, 2]);
      expect(saved.timestamp).toBeGreaterThan(0);
    });

    it('returns false when localStorage throws', () => {
      localStorage.setItem.mockImplementation(() => { throw new Error('QuotaExceeded'); });
      const scene = createMockRegistry();
      expect(SaveManager.save(scene)).toBe(false);
    });
  });

  describe('load', () => {
    it('returns null when no save exists', () => {
      expect(SaveManager.load()).toBeNull();
    });

    it('returns parsed save data', () => {
      const data = {
        currentLevel: 4,
        score: 3000,
        lives: 1,
        instruments: ['violin', 'flute', 'piano'],
        completedLevels: [1, 2, 3],
        coopMode: true,
        timestamp: Date.now()
      };
      storage['amadeus_save'] = JSON.stringify(data);

      const loaded = SaveManager.load();
      expect(loaded.currentLevel).toBe(4);
      expect(loaded.score).toBe(3000);
      expect(loaded.completedLevels).toEqual([1, 2, 3]);
    });

    it('returns null for corrupted data', () => {
      storage['amadeus_save'] = 'not json';
      expect(SaveManager.load()).toBeNull();
    });

    it('returns null for invalid structure', () => {
      storage['amadeus_save'] = JSON.stringify({ foo: 'bar' });
      expect(SaveManager.load()).toBeNull();
    });
  });

  describe('hasSave', () => {
    it('returns false when no save exists', () => {
      expect(SaveManager.hasSave()).toBe(false);
    });

    it('returns true when valid save exists', () => {
      storage['amadeus_save'] = JSON.stringify({
        currentLevel: 1,
        score: 0,
        lives: 3,
        instruments: [],
        completedLevels: [],
        coopMode: false,
        timestamp: Date.now()
      });
      expect(SaveManager.hasSave()).toBe(true);
    });
  });

  describe('deleteSave', () => {
    it('removes the save from localStorage', () => {
      storage['amadeus_save'] = JSON.stringify({ currentLevel: 1, completedLevels: [] });
      SaveManager.deleteSave();
      expect(localStorage.removeItem).toHaveBeenCalledWith('amadeus_save');
    });
  });

  describe('restoreToRegistry', () => {
    it('restores saved data into the registry', () => {
      const scene = createMockRegistry();
      const data = {
        currentLevel: 5,
        score: 4200,
        lives: 2,
        instruments: ['violin', 'flute', 'piano', 'harpsichord'],
        completedLevels: [1, 2, 3, 4],
        coopMode: true
      };

      SaveManager.restoreToRegistry(scene, data);

      expect(scene.registry.set).toHaveBeenCalledWith('currentLevel', 5);
      expect(scene.registry.set).toHaveBeenCalledWith('score', 4200);
      expect(scene.registry.set).toHaveBeenCalledWith('lives', 2);
      expect(scene.registry.set).toHaveBeenCalledWith('instruments', ['violin', 'flute', 'piano', 'harpsichord']);
      expect(scene.registry.set).toHaveBeenCalledWith('completedLevels', [1, 2, 3, 4]);
      expect(scene.registry.set).toHaveBeenCalledWith('coopMode', true);
      expect(scene.registry.set).toHaveBeenCalledWith('comboMultiplier', 1);
      expect(scene.registry.set).toHaveBeenCalledWith('comboCount', 0);
    });
  });

  describe('getSavedScore', () => {
    it('returns 0 when no save exists', () => {
      expect(SaveManager.getSavedScore()).toBe(0);
    });

    it('returns the saved score', () => {
      storage['amadeus_save'] = JSON.stringify({
        currentLevel: 2,
        score: 2500,
        lives: 3,
        instruments: ['violin'],
        completedLevels: [1],
        coopMode: false,
        timestamp: Date.now()
      });
      expect(SaveManager.getSavedScore()).toBe(2500);
    });
  });
});
