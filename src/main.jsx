import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EMPTY_STATE, STORAGE_KEY, loadState, parseScore, totalScore } from './game.js';
import { dictionaries, deviceLanguage } from './i18n.js';
import './styles.css';

function readSavedGame() {
  try {
    return { state: loadState(window.localStorage), error: '' };
  } catch {
    return {
      state: EMPTY_STATE,
      error: 'restoreError',
    };
  }
}

function Setup({ onStart, t }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(['', '', '', '']);

  function start(event) {
    event.preventDefault();
    onStart(names.slice(0, count).map((name, index) => ({
      name: name.trim() || t.player(index + 1),
      isDefaultName: !name.trim(),
      scores: [],
    })));
  }

  return (
    <section className="setup panel" aria-labelledby="setup-title">
      <h2 id="setup-title">{t.newGame}</h2>
      <p className="muted">{t.setupHint}</p>
      <form onSubmit={start}>
        <fieldset>
          <legend>{t.playerCount}</legend>
          <div className="player-count">
            {[2, 3, 4].map((number) => (
              <button key={number} type="button" aria-pressed={count === number}
                className={count === number ? 'selected' : ''} onClick={() => setCount(number)}>
                {number}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="names">
          {names.slice(0, count).map((name, index) => (
            <label key={index}>
              {t.player(index + 1)}
              <input value={name} maxLength={30} placeholder={t.player(index + 1)}
                autoComplete="off" onChange={(event) => {
                  setNames(names.map((previous, position) => position === index ? event.target.value : previous));
                }} />
            </label>
          ))}
        </div>
        <button className="primary start" type="submit">{t.start}</button>
      </form>
    </section>
  );
}

function PlayerCard({ player, index, onAdd, onUndo, t }) {
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');
  const total = totalScore(player.scores);
  const name = player.isDefaultName ? t.player(index + 1) : player.name;

  function add(event) {
    event.preventDefault();
    const score = parseScore(points);
    if (score === null || !Number.isSafeInteger(total + score)) {
      setError('invalidScore');
      return;
    }
    onAdd(score);
    setPoints('');
    setError('');
  }

  return (
    <section className="player panel" aria-labelledby={`player-${index}`}>
      <div className="player-heading">
        <h2 id={`player-${index}`}>{name}</h2>
        <div className="total" aria-live="polite" aria-atomic="true">
          <strong>{total}</strong><span>{t.points}</span>
        </div>
      </div>
      <form onSubmit={add} className="score-form">
        <label htmlFor={`points-${index}`}>{t.addPoints}</label>
        <div className="score-input">
          <input id={`points-${index}`} type="text" inputMode="numeric"
            value={points} autoComplete="off" aria-invalid={Boolean(error)}
            aria-describedby={error ? `error-${index}` : undefined}
            onChange={(event) => { setPoints(event.target.value); setError(''); }} />
          <button className="primary" type="submit">{t.add}</button>
        </div>
        {error && <p className="error" id={`error-${index}`} role="alert">{t[error]}</p>}
      </form>
      <details className="history">
        <summary>{t.history} <span className="muted">({player.scores.length})</span></summary>
        {player.scores.length === 0 ? (
          <p className="muted empty">{t.emptyHistory}</p>
        ) : (
          <>
            <ol className="score-list" aria-label={t.scoresFor(name)}>
              {player.scores.map((score, turn) => (
                <li key={turn}><span className="muted">{t.turn(turn + 1)}</span>
                  <strong>{score > 0 ? '+' : ''}{score}</strong></li>
              ))}
            </ol>
            <button type="button" className="undo" onClick={onUndo}
              aria-label={t.undoFor(name)}>{t.undo}</button>
          </>
        )}
      </details>
    </section>
  );
}

function SettingsMenu({ theme, language, onChange, t }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const container = useRef(null);

  useEffect(() => {
    if (!open) return;
    function outsideClick(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', outsideClick);
    return () => document.removeEventListener('pointerdown', outsideClick);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="settings-control" ref={container}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls="settings-panel"
        onClick={() => setOpen((previous) => !previous)}>
        <span aria-hidden="true">⚙</span> {t.menu}
      </button>
      {open && (
        <div id="settings-panel" className="settings-panel">
          <label>{t.theme}
            <select autoFocus value={theme}
              onChange={(event) => { onChange('theme', event.target.value); close(); }}>
              <option value="system">{t.system}</option>
              <option value="light">{t.light}</option>
              <option value="dark">{t.dark}</option>
            </select>
          </label>
          <label>{t.language}
            <select value={language}
              onChange={(event) => { onChange('language', event.target.value); close(); }}>
              <option value="system">{t.system}</option>
              <option value="es" lang="es">Castellano</option>
              <option value="en" lang="en">English</option>
              <option value="ca" lang="ca">Català</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

function App() {
  const [initial] = useState(readSavedGame);
  const [game, setGame] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [deviceLocale, setDeviceLocale] = useState(deviceLanguage);
  const preference = game.language ?? 'system';
  const language = preference === 'system' ? deviceLocale : preference;
  const t = dictionaries[language];

  useEffect(() => {
    const updateLanguage = () => setDeviceLocale(deviceLanguage());
    window.addEventListener('languagechange', updateLanguage);
    return () => window.removeEventListener('languagechange', updateLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `SCRABSCORE · ${t.title}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
  }, [language, t]);

  useEffect(() => {
    document.documentElement.dataset.theme = game.theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      setStorageError('saveError');
    }
  }, [game]);

  function updateScores(index, transform) {
    setGame((previous) => ({
      ...previous,
      players: previous.players.map((player, position) =>
        position === index ? { ...player, scores: transform(player.scores) } : player),
    }));
  }

  function reset() {
    if (window.confirm(t.resetConfirm)) {
      setGame((previous) => ({ ...previous, players: [] }));
    }
  }

  return (
    <main className={`app${game.players.length === 2 ? ' two-players' : ''}`}>
      <header className="header">
        <div className="brand">
          <img className="brand-logo" src="/scrabscore-logo.svg" alt="SCRABSCORE" width="600" height="68" />
          <h1>{game.players.length === 0 ? t.setupTitle : t.title}</h1>
        </div>
        <SettingsMenu theme={game.theme} language={preference} t={t}
          onChange={(key, value) => setGame((previous) => ({ ...previous, [key]: value }))} />
      </header>
      {storageError && <p className="notice" role="alert">{t[storageError]}</p>}
      {game.players.length === 0 ? <Setup t={t} onStart={(players) => setGame((previous) => ({ ...previous, players }))} /> : (
        <>
          <div className="game-toolbar">
            <p className="muted">{t.players(game.players.length)}</p>
            <button type="button" className="new-game" onClick={reset}>{t.newGame}</button>
          </div>
          <div className="players">
            {game.players.map((player, index) => (
              <PlayerCard key={index} player={player} index={index} t={t}
                onAdd={(score) => updateScores(index, (scores) => [...scores, score])}
                onUndo={() => updateScores(index, (scores) => scores.slice(0, -1))} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
