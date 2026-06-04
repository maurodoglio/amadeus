/**
 * Manages high scores in localStorage and grade calculations.
 */

const STORAGE_KEY = 'amadeus_highscores';

// Score thresholds for grades per level
const GRADE_THRESHOLDS = {
  1: { S: 2000, A: 1500, B: 1000, C: 600, D: 0 },
  2: { S: 3000, A: 2200, B: 1500, C: 900, D: 0 },
  3: { S: 4000, A: 3000, B: 2000, C: 1200, D: 0 },
};

// Time bonus: bonus points for faster completion
const TIME_BONUS = {
  1: { parTime: 60, bonusPerSecond: 10, maxBonus: 500 },
  2: { parTime: 90, bonusPerSecond: 10, maxBonus: 600 },
  3: { parTime: 120, bonusPerSecond: 10, maxBonus: 800 },
};

export class ScoreManager {
  static getHighScores(level) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return data[`level${level}`] || [];
    } catch {
      return [];
    }
  }

  static saveScore(level, score) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const key = `level${level}`;
      if (!data[key]) data[key] = [];
      data[key].push({ score, date: Date.now() });
      // Keep top 5
      data[key].sort((a, b) => b.score - a.score);
      data[key] = data[key].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable
    }
  }

  static getGrade(level, score) {
    const thresholds = GRADE_THRESHOLDS[level] || GRADE_THRESHOLDS[1];
    if (score >= thresholds.S) return 'S';
    if (score >= thresholds.A) return 'A';
    if (score >= thresholds.B) return 'B';
    if (score >= thresholds.C) return 'C';
    return 'D';
  }

  static getGradeColor(grade) {
    const colors = {
      S: '#FFD700',
      A: '#00FF00',
      B: '#87CEEB',
      C: '#FFA500',
      D: '#FF4444',
    };
    return colors[grade] || '#FFFFFF';
  }

  static calculateTimeBonus(level, elapsedSeconds) {
    const config = TIME_BONUS[level] || TIME_BONUS[1];
    const secondsUnderPar = Math.max(0, config.parTime - elapsedSeconds);
    return Math.min(Math.floor(secondsUnderPar * config.bonusPerSecond), config.maxBonus);
  }
}
