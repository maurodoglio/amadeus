const SAVE_KEY = 'amadeus_save';

export class SaveManager {
  static save(data) {
    const saveData = {
      currentLevel: data.currentLevel,
      instruments: data.instruments || [],
      highScore: Math.max(data.score || 0, SaveManager.getHighScore()),
      score: data.score || 0
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }

  static load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static getHighScore() {
    const data = SaveManager.load();
    return data ? data.highScore || 0 : 0;
  }

  static updateHighScore(score) {
    const data = SaveManager.load() || {};
    data.highScore = Math.max(score, data.highScore || 0);
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static reset() {
    localStorage.removeItem(SAVE_KEY);
  }
}
