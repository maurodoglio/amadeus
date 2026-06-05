/**
 * Error boundary utilities for graceful degradation.
 * Provides safe wrappers for audio, storage, and general function calls.
 */

let audioDisabled = false;

/**
 * Wraps a function in try/catch, returning a fallback value on error.
 * @param {Function} fn - Function to execute
 * @param {*} fallback - Value to return on error
 * @returns {*} Result of fn() or fallback
 */
export function safeCall(fn, fallback = undefined) {
  try {
    return fn();
  } catch (e) {
    console.warn('[ErrorBoundary] safeCall caught:', e.message || e);
    return fallback;
  }
}

/**
 * Wraps audio-related calls. On failure, disables audio globally to prevent
 * repeated errors from crashing the game.
 * @param {Function} fn - Audio function to execute
 * @returns {*} Result of fn() or undefined
 */
export function safeAudio(fn) {
  if (audioDisabled) return undefined;
  try {
    return fn();
  } catch (e) {
    console.warn('[ErrorBoundary] Audio error, disabling audio:', e.message || e);
    audioDisabled = true;
    return undefined;
  }
}

/**
 * Returns whether audio has been disabled due to errors.
 */
export function isAudioDisabled() {
  return audioDisabled;
}

// In-memory fallback for localStorage
const memoryStore = {};

/**
 * Safe localStorage wrapper with in-memory fallback.
 */
export const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('[ErrorBoundary] localStorage.get failed, using memory:', e.message || e);
      return memoryStore[key] || null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[ErrorBoundary] localStorage.set failed, using memory:', e.message || e);
      memoryStore[key] = value;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[ErrorBoundary] localStorage.remove failed:', e.message || e);
      delete memoryStore[key];
    }
  }
};

/**
 * Installs global error handlers that show a restart dialog on unrecoverable errors.
 * @param {Phaser.Game} game - The Phaser game instance
 */
export function installGlobalErrorHandlers(game) {
  const handleFatalError = (message) => {
    // Avoid showing multiple dialogs
    if (document.getElementById('error-recovery-dialog')) return;

    const dialog = document.createElement('div');
    dialog.id = 'error-recovery-dialog';
    dialog.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; align-items: center;
      justify-content: center; z-index: 99999; font-family: Georgia, serif;
    `;
    dialog.innerHTML = `
      <div style="background: #F5E6D3; padding: 40px; border-radius: 8px;
                  max-width: 400px; text-align: center; border: 2px solid #8B4513;">
        <h2 style="color: #2B1810; margin: 0 0 16px;">Something went wrong</h2>
        <p style="color: #5C3A1E; margin: 0 0 24px; font-size: 14px;">${message || 'An unexpected error occurred.'}</p>
        <button id="error-restart-btn" style="
          background: #8B4513; color: #F5E6D3; border: none; padding: 12px 32px;
          font-size: 16px; border-radius: 4px; cursor: pointer; font-family: Georgia, serif;
        ">Restart Game</button>
      </div>
    `;
    document.body.appendChild(dialog);

    document.getElementById('error-restart-btn').addEventListener('click', () => {
      dialog.remove();
      // Try to start RecoveryScene if available, otherwise reload page
      try {
        game.scene.start('RecoveryScene');
      } catch {
        window.location.reload();
      }
    });
  };

  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GlobalError]', message, source, lineno, colno, error);
    handleFatalError(String(message));
    return true; // Prevent default browser error handling
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledRejection]', event.reason);
    handleFatalError(event.reason?.message || 'An async operation failed.');
  });
}
