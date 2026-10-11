export const STORAGE_KEY = 'scrabble-score-v1';
export const EMPTY_STATE = { players: [], theme: 'system' };

export function isValidState(state) {
  return Boolean(
    state &&
    ['system', 'light', 'dark'].includes(state.theme) &&
    Array.isArray(state.players) &&
    (state.players.length === 0 || (state.players.length >= 2 && state.players.length <= 4)) &&
    state.players.every((player) =>
      player && typeof player.name === 'string' && player.name.trim().length > 0 &&
      Array.isArray(player.scores) && player.scores.every(Number.isSafeInteger) &&
      Number.isSafeInteger(totalScore(player.scores)),
    ),
  );
}

export function totalScore(scores) {
  return scores.reduce((total, score) => total + score, 0);
}

export function parseScore(value) {
  if (!/^-?\d+$/.test(value.trim())) return null;
  const score = Number(value);
  return Number.isSafeInteger(score) ? score : null;
}

export function loadState(storage) {
  const saved = storage.getItem(STORAGE_KEY);
  if (!saved) return EMPTY_STATE;
  const state = JSON.parse(saved);
  if (!isValidState(state)) throw new Error('Invalid saved game');
  return state;
}
