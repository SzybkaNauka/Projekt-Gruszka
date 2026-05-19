import { MAX_LEVEL } from './constants.js';

const SAVE_KEY = 'gruszka-katapulta-save-v1';

export const defaultSave = {
  bestScore: 0,
  bestScoreByLevel: {},
  unlockedLevel: 1,
  starsByLevel: {},
  soundEnabled: true,
};

function clampLevel(level) {
  return Math.min(MAX_LEVEL, Math.max(1, Number(level || 1)));
}

function clampStars(stars) {
  return Math.min(3, Math.max(0, Number(stars || 0)));
}

function sanitizeStarsByLevel(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([level, stars]) => [String(clampLevel(level)), clampStars(stars)])
    .filter(([, stars]) => stars > 0));
}

function sanitizeBestScoreByLevel(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([level, score]) => [String(clampLevel(level)), Math.max(0, Number(score || 0))])
    .filter(([, score]) => score > 0));
}

export function migrateStorageIfNeeded() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
      return { ...defaultSave };
    }
    const parsed = JSON.parse(raw);
    const migrated = {
      ...defaultSave,
      ...parsed,
      starsByLevel: sanitizeStarsByLevel(parsed.starsByLevel),
      bestScoreByLevel: sanitizeBestScoreByLevel(parsed.bestScoreByLevel),
      unlockedLevel: clampLevel(parsed.unlockedLevel),
      bestScore: Math.max(0, Number(parsed.bestScore || 0)),
      soundEnabled: parsed.soundEnabled !== false,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
    return { ...defaultSave };
  }
}

export function getSave() {
  try {
    return migrateStorageIfNeeded();
  } catch {
    return { ...defaultSave };
  }
}

export function saveProgress(progress) {
  const current = getSave();
  const next = {
    ...current,
    ...progress,
    unlockedLevel: progress.unlockedLevel == null ? current.unlockedLevel : clampLevel(progress.unlockedLevel),
    bestScore: Math.max(0, Number(progress.bestScore ?? current.bestScore ?? 0)),
    starsByLevel: sanitizeStarsByLevel({ ...current.starsByLevel, ...(progress.starsByLevel || {}) }),
    bestScoreByLevel: sanitizeBestScoreByLevel({ ...current.bestScoreByLevel, ...(progress.bestScoreByLevel || {}) }),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  return next;
}

export function saveLevelResult(levelId, score, stars) {
  const current = getSave();
  const previousStars = Number(current.starsByLevel[levelId] || 0);
  return saveProgress({
    bestScore: Math.max(current.bestScore, score),
    bestScoreByLevel: {
      [levelId]: Math.max(Number(current.bestScoreByLevel[levelId] || 0), score),
    },
    unlockedLevel: Math.min(MAX_LEVEL, Math.max(current.unlockedLevel, levelId + 1)),
    starsByLevel: {
      [levelId]: Math.max(previousStars, stars),
    },
  });
}

export function resetProgress() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(defaultSave));
  return { ...defaultSave };
}

export function setSoundEnabled(soundEnabled) {
  return saveProgress({ soundEnabled });
}

export function getUnlockedLevel() {
  return getSave().unlockedLevel;
}

export function setUnlockedLevel(level) {
  return saveProgress({ unlockedLevel: clampLevel(level) });
}

export function getStarsByLevel() {
  return getSave().starsByLevel;
}

export function setStarsForLevel(level, stars) {
  return saveProgress({ starsByLevel: { [clampLevel(level)]: clampStars(stars) } });
}

export function getBestScoreByLevel() {
  return getSave().bestScoreByLevel;
}

export function setBestScoreForLevel(level, score) {
  const safeScore = Math.max(0, Number(score || 0));
  return saveProgress({
    bestScore: Math.max(getSave().bestScore, safeScore),
    bestScoreByLevel: { [clampLevel(level)]: safeScore },
  });
}
