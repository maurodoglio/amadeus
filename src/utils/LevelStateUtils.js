import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { safeStorage } from './ErrorBoundary.js';

const COMPLETED_LEVELS_KEY = 'completedLevels';
const SHEET_MUSIC_KEY = 'sheetMusicCollected';

function parseStoredJson(key, fallback, validate) {
  const raw = safeStorage.get(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      throw new Error(`Invalid data for ${key}`);
    }
    return parsed;
  } catch (error) {
    console.warn(`[LevelStateUtils] Resetting corrupt ${key} save:`, error.message || error);
    safeStorage.remove(key);
    return fallback;
  }
}

export function loadCompletedLevels() {
  return parseStoredJson(
    COMPLETED_LEVELS_KEY,
    [],
    value => Array.isArray(value) && value.every(level => Number.isInteger(level))
  );
}

export function saveCompletedLevels(levels) {
  const normalized = [...new Set(levels.filter(level => Number.isInteger(level)))].sort((a, b) => a - b);
  safeStorage.set(COMPLETED_LEVELS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function markLevelCompleted(registry, levelNumber) {
  const completedLevels = registry.get('completedLevels') || loadCompletedLevels();
  const updatedLevels = saveCompletedLevels([...completedLevels, levelNumber]);
  registry.set('completedLevels', updatedLevels);
  return updatedLevels;
}

export function loadSheetMusic() {
  return parseStoredJson(
    SHEET_MUSIC_KEY,
    {},
    value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  );
}

export function saveSheetMusic(sheetMusic) {
  safeStorage.set(SHEET_MUSIC_KEY, JSON.stringify(sheetMusic));
}

export function clearPersistentProgress() {
  safeStorage.remove(COMPLETED_LEVELS_KEY);
  safeStorage.remove(SHEET_MUSIC_KEY);
}

export function getRespawnPoint(scene, fallbackPoint) {
  const checkpoint = scene.lastCheckpoint;
  if (checkpoint?.x !== undefined && checkpoint?.y !== undefined) {
    return { x: checkpoint.x, y: checkpoint.y - 40 };
  }

  return { ...fallbackPoint };
}

export function handleFallDeath(scene, player, fallbackPoint) {
  if (!player || player.isDead) return false;

  const remainingLives = Math.max(0, (scene.registry.get('lives') || 0) - 1);
  scene.registry.set('lives', remainingLives);

  if (remainingLives <= 0) {
    player.die();
    return false;
  }

  const respawnPoint = getRespawnPoint(scene, fallbackPoint);
  player.respawn(respawnPoint.x, respawnPoint.y);
  return true;
}

export function showGameOver(scene) {
  if (scene.gameOverShown) return;
  scene.gameOverShown = true;

  const resetLives = scene.coopMode
    ? Math.max(scene.difficulty?.startingLives || 3, 5)
    : (scene.difficulty?.startingLives || 3);

  scene.time.delayedCall(1000, () => {
    scene.physics.pause();

    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    ).setDepth(1000).setScrollFactor(0);

    scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'GAME OVER', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    const retry = () => {
      scene.sound.stopAll();
      scene.registry.set('lives', resetLives);
      scene.scene.stop('UIScene');
      scene.scene.restart();
    };

    const backToMenu = () => {
      scene.sound.stopAll();
      scene.scene.stop('UIScene');
      scene.scene.start('MenuScene');
    };

    const retryBtn = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '▶ Retry Level', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#C9A84C'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#FFD700'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#C9A84C'));
    retryBtn.on('pointerdown', retry);

    const menuBtn = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '← Back to Menu', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#C9A84C'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', backToMenu);

    scene.input.keyboard?.once('keydown-ENTER', retry);
    scene.input.keyboard?.once('keydown-ESC', backToMenu);
  });
}

export function maybeShowGameOver(scene, primaryPlayer, secondaryPlayer = null) {
  const noLives = (scene.registry.get('lives') || 0) <= 0;

  if (scene.coopMode && secondaryPlayer) {
    const bothDead = Boolean(primaryPlayer?.isDead && secondaryPlayer.isDead);
    if (bothDead || noLives) {
      showGameOver(scene);
    }
    return;
  }

  if (primaryPlayer?.isDead && noLives) {
    showGameOver(scene);
  }
}
