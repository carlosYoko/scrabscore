import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_STATE, STORAGE_KEY, isValidState, loadState, parseScore, totalScore } from './game.js';

const game = {
  theme: 'system',
  players: [{ name: 'Ana', scores: [24, 0, -3] }, { name: 'Luis', scores: [12, 18] }],
};

test('suma las puntuaciones, incluido cero y ajustes negativos', () => {
  assert.equal(totalScore([]), 0);
  assert.equal(totalScore(game.players[0].scores), 21);
  assert.equal(totalScore(game.players[1].scores), 30);
});

test('solo acepta puntos enteros seguros', () => {
  for (const [input, expected] of [['24', 24], ['0', 0], ['-3', -3], [' 12 ', 12]]) {
    assert.equal(parseScore(input), expected);
  }
  for (const input of ['', ' ', '1.5', 'hola', '1e3', '9007199254740992']) {
    assert.equal(parseScore(input), null);
  }
});

test('recupera la partida completa del almacenamiento', () => {
  const storage = { getItem(key) { assert.equal(key, STORAGE_KEY); return JSON.stringify(game); } };
  assert.deepEqual(loadState(storage), game);
  assert.deepEqual(loadState({ getItem: () => null }), EMPTY_STATE);
});

test('admite entre dos y cuatro jugadores y los tres temas', () => {
  assert.ok(isValidState(EMPTY_STATE));
  for (const count of [2, 3, 4]) {
    for (const theme of ['system', 'light', 'dark']) {
      assert.ok(isValidState({ theme, players: Array.from({ length: count }, () => game.players[0]) }));
    }
  }
  assert.equal(isValidState({ ...game, players: [game.players[0]] }), false);
  assert.equal(isValidState({ ...game, players: Array(5).fill(game.players[0]) }), false);
});

test('guarda la preferencia de idioma sin invalidar partidas antiguas', () => {
  assert.ok(isValidState(game));
  for (const language of ['system', 'es', 'en', 'ca']) {
    const saved = { ...game, language };
    assert.ok(isValidState(saved));
    assert.deepEqual(loadState({ getItem: () => JSON.stringify(saved) }), saved);
  }
  assert.equal(isValidState({ ...game, language: 'fr' }), false);
  assert.equal(isValidState({ ...game, language: null }), false);
});

test('rechaza partidas corruptas', () => {
  for (const value of [null, {}, { ...game, theme: 'invalid' },
    { ...game, players: [{ name: '', scores: [] }, game.players[1]] },
    { ...game, players: [{ name: 'Ana', scores: [1.5] }, game.players[1]] },
    { ...game, players: [{ name: 'Ana', scores: [Number.MAX_SAFE_INTEGER, 1] }, game.players[1]] }]) {
    assert.equal(isValidState(value), false);
    assert.throws(() => loadState({ getItem: () => JSON.stringify(value) }));
  }
  assert.throws(() => loadState({ getItem: () => '{broken' }));
});
