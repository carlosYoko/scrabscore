import test from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, dictionaries } from './i18n.js';

test('detecta castellano, inglés y catalán con variantes regionales', () => {
  for (const [locale, expected] of [
    ['es-ES', 'es'], ['es-MX', 'es'], ['en-US', 'en'], ['en-GB', 'en'],
    ['ca-ES', 'ca'], ['ca', 'ca'], ['CA_es', 'ca'],
  ]) {
    assert.equal(detectLanguage([locale]), expected);
  }
});

test('respeta el orden de preferencia del dispositivo y usa castellano como respaldo', () => {
  assert.equal(detectLanguage(['ca-ES', 'es-ES', 'en']), 'ca');
  assert.equal(detectLanguage(['en-US', 'es']), 'en');
  assert.equal(detectLanguage(['fr-FR', 'en-GB']), 'en');
  assert.equal(detectLanguage(['fr-FR']), 'es');
  assert.equal(detectLanguage([]), 'es');
});

test('todos los diccionarios tienen las mismas claves y tipos', () => {
  const keys = Object.keys(dictionaries.es).sort();
  for (const dictionary of Object.values(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof dictionary[key], typeof dictionaries.es[key]);
      const value = typeof dictionary[key] === 'function' ? dictionary[key]('Ana') : dictionary[key];
      assert.equal(typeof value, 'string');
      assert.ok(value.length > 0);
    }
  }
});

test('traduce etiquetas dinámicas sin modificar nombres personalizados', () => {
  assert.equal(dictionaries.en.player(2), 'Player 2');
  assert.equal(dictionaries.ca.players(4), '4 jugadors');
  assert.equal(dictionaries.ca.turn(3), 'Torn 3');
  assert.equal(dictionaries.en.scoresFor('Núria'), 'Scores for Núria');
});
