import { describe, it, expect } from 'vitest';
import { DIFFICULTY, getLevelDifficulty } from '../src/config/difficultyConfig.js';

describe('DifficultyConfig', () => {
  describe('DIFFICULTY constant', () => {
    it('should define configurations for all 7 levels', () => {
      for (let level = 1; level <= 7; level++) {
        expect(DIFFICULTY.startingLives[level]).toBeDefined();
        expect(DIFFICULTY.enemyDamageMultiplier[level]).toBeDefined();
        expect(DIFFICULTY.boss[level]).toBeDefined();
        expect(DIFFICULTY.maxPlatformGap[level]).toBeDefined();
        expect(DIFFICULTY.enemyCount[level]).toBeDefined();
        expect(DIFFICULTY.bossProjectileSpeed[level]).toBeDefined();
      }
    });

    it('should scale enemy count upward with level', () => {
      for (let level = 2; level <= 7; level++) {
        expect(DIFFICULTY.enemyCount[level]).toBeGreaterThanOrEqual(DIFFICULTY.enemyCount[level - 1]);
      }
    });

    it('should scale boss health upward with level', () => {
      for (let level = 2; level <= 7; level++) {
        expect(DIFFICULTY.boss[level].health).toBeGreaterThanOrEqual(DIFFICULTY.boss[level - 1].health);
      }
    });

    it('should have early levels more forgiving with damage multiplier', () => {
      expect(DIFFICULTY.enemyDamageMultiplier[1]).toBeLessThan(1.0);
      expect(DIFFICULTY.enemyDamageMultiplier[2]).toBeLessThan(1.0);
      expect(DIFFICULTY.enemyDamageMultiplier[3]).toBe(1.0);
    });

    it('should keep platform gaps achievable (under 300px)', () => {
      for (let level = 1; level <= 7; level++) {
        expect(DIFFICULTY.maxPlatformGap[level]).toBeLessThanOrEqual(300);
      }
    });
  });

  describe('getLevelDifficulty()', () => {
    it('should return all expected fields for a valid level', () => {
      const config = getLevelDifficulty(3);
      expect(config.startingLives).toBe(3);
      expect(config.enemyDamageMultiplier).toBe(1.0);
      expect(config.boss.health).toBe(5);
      expect(config.boss.speed).toBe(95);
      expect(config.maxPlatformGap).toBe(220);
      expect(config.enemyCount).toBe(6);
      expect(config.checkpointInterval).toBe(1200);
      expect(config.bossProjectileSpeed).toBe(160);
    });

    it('should use defaults for unknown level numbers', () => {
      const config = getLevelDifficulty(99);
      expect(config.startingLives).toBe(3);
      expect(config.enemyDamageMultiplier).toBe(1.0);
      expect(config.boss).toEqual(DIFFICULTY.boss[7]);
      expect(config.maxPlatformGap).toBe(280);
      expect(config.enemyCount).toBe(10);
      expect(config.bossProjectileSpeed).toBe(200);
    });

    it('should return level 1 tutorial settings', () => {
      const config = getLevelDifficulty(1);
      expect(config.startingLives).toBe(4);
      expect(config.enemyDamageMultiplier).toBe(0.5);
      expect(config.enemyCount).toBe(3);
    });
  });
});
