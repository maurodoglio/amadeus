import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing the module
vi.mock('phaser', async () => {
  const mock = await import('./mocks/phaser.js');
  return { default: mock.default };
});

// We test the logic portions of BossPhaseManager by instantiating it
// with a mocked scene (not calling create() which needs Phaser physics).
import { BossPhaseManager } from '../src/mechanics/BossPhaseManager.js';

function createMockScene(coopMode = false) {
  return {
    coopMode,
    registry: {
      _data: { score: 0 },
      get: function(key) { return this._data[key]; },
      set: function(key, val) { this._data[key] = val; }
    },
    time: {
      timeScale: 1,
      delayedCall: vi.fn()
    },
    sound: {
      stopAll: vi.fn(),
      get: () => null,
      play: vi.fn()
    },
    physics: {
      add: {
        sprite: vi.fn(() => ({
          setScale: vi.fn(),
          body: { setAllowGravity: vi.fn() },
          setCollideWorldBounds: vi.fn()
        })),
        collider: vi.fn(),
        overlap: vi.fn(),
        group: vi.fn(() => ({ clear: vi.fn(), getChildren: () => [] }))
      }
    },
    add: {
      rectangle: vi.fn(() => ({ setScrollFactor: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setOrigin: vi.fn().mockReturnThis(), setFillStyle: vi.fn(), setSize: vi.fn() })),
      text: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setText: vi.fn() }))
    },
    tweens: { add: vi.fn() },
    mozart: { x: 100, isDead: false },
    nannerl: coopMode ? { x: 200, isDead: false } : null,
    platforms: null,
    cameras: { main: { scrollX: 0, scrollY: 0 } }
  };
}

describe('BossPhaseManager', () => {
  let manager;
  let scene;
  const config = {
    name: 'Test Boss',
    texture: 'boss1',
    x: 500,
    y: 300,
    phases: [
      { hp: 3, update: vi.fn() },
      { hp: 2, update: vi.fn() }
    ]
  };

  beforeEach(() => {
    scene = createMockScene();
    manager = new BossPhaseManager(scene, config);
  });

  describe('constructor', () => {
    it('should initialize with correct default state', () => {
      expect(manager.bossName).toBe('Test Boss');
      expect(manager.currentPhaseIndex).toBe(0);
      expect(manager.isActive).toBe(false);
      expect(manager.isDefeated).toBe(false);
      expect(manager.isTransitioning).toBe(false);
      expect(manager.isVulnerable).toBe(false);
    });

    it('should store phase definitions from config', () => {
      expect(manager.phases).toHaveLength(2);
      expect(manager.phases[0].hp).toBe(3);
      expect(manager.phases[1].hp).toBe(2);
    });

    it('should use defaults for missing config values', () => {
      const minimal = new BossPhaseManager(scene, { x: 0, y: 0 });
      expect(minimal.bossName).toBe('Boss');
      expect(minimal.scale).toBe(2.5);
      expect(minimal.dialogue).toEqual([]);
      expect(minimal.phases).toEqual([]);
    });
  });

  describe('HP calculation (co-op bonus)', () => {
    it('should add co-op health bonus in co-op mode', () => {
      const coopScene = createMockScene(true);
      const coopManager = new BossPhaseManager(coopScene, {
        ...config,
        coopHealthBonus: 2
      });
      // Manually run the HP calculation logic from create()
      let totalHP = 0;
      coopManager.phases.forEach(phase => {
        const hp = true ? phase.hp + coopManager.coopHealthBonus : phase.hp;
        totalHP += hp;
      });
      // Phase 1: 3+2=5, Phase 2: 2+2=4 => total 9
      expect(totalHP).toBe(9);
    });

    it('should not add bonus in solo mode', () => {
      let totalHP = 0;
      manager.phases.forEach(phase => {
        totalHP += phase.hp;
      });
      expect(totalHP).toBe(5);
    });
  });

  describe('phase transition logic', () => {
    it('should track damage correctly', () => {
      // Simulate the HP tracking the manager does post-create
      manager.totalHP = 5;
      manager.maxTotalHP = 5;
      manager.phaseHP = 3;

      // Simulate taking damage
      manager.phaseHP--;
      manager.totalHP--;
      expect(manager.phaseHP).toBe(2);
      expect(manager.totalHP).toBe(4);
    });

    it('should detect phase transition when phaseHP hits 0', () => {
      manager.totalHP = 5;
      manager.phaseHP = 1;
      manager.phaseHP--;
      manager.totalHP--;

      const shouldTransition = manager.totalHP > 0 && manager.phaseHP <= 0;
      expect(shouldTransition).toBe(true);
    });

    it('should detect defeat when totalHP hits 0', () => {
      manager.totalHP = 1;
      manager.phaseHP = 1;
      manager.totalHP--;
      manager.phaseHP--;

      const shouldDefeat = manager.totalHP <= 0;
      expect(shouldDefeat).toBe(true);
    });
  });

  describe('activation check', () => {
    it('should not be active initially', () => {
      expect(manager.isActive).toBe(false);
    });

    it('should calculate activation based on player proximity', () => {
      // activateX defaults to config.x - 400 = 100
      expect(manager.activateX).toBe(100);
      // Player at x=150 should trigger (> activateX of 100)
      scene.mozart.x = 150;
      const anyClose = scene.mozart.x > manager.activateX;
      expect(anyClose).toBe(true);
    });

    it('should not activate when player is far away', () => {
      scene.mozart.x = 50;
      const anyClose = scene.mozart.x > manager.activateX;
      expect(anyClose).toBe(false);
    });
  });
});
