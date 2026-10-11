import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EMPTY_STATE, STORAGE_KEY, loadState, parseScore, totalScore } from './game.js';
import './styles.css';

function readSavedGame() {
  try {
    return { state: loadState(window.localStorage), error: '' };
  } catch {
    return {
      state: EMPTY_STATE,
      error: 'No se pudo recuperar la partida guardada. Puedes empezar una nueva.',
    };
  }
}

function Setup({ onStart }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(['', '', '', '']);

  function start(event) {
    event.preventDefault();
    onStart(names.slice(0, count).map((name, index) => ({
      name: name.trim() || `Jugador ${index + 1}`,
      scores: [],
    })));
  }

  return (
    <section className="setup panel" aria-labelledby="setup-title">
      <h2 id="setup-title">Nueva partida</h2>
      <p className="muted">Añade jugadores y empieza a sumar!</p>
      <form onSubmit={start}>
        <fieldset>
          <legend>Número de jugadores</legend>
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
              Jugador {index + 1}
              <input value={name} maxLength={30} placeholder={`Jugador ${index + 1}`}
                autoComplete="off" onChange={(event) => {
                  setNames(names.map((previous, position) => position === index ? event.target.value : previous));
                }} />
            </label>
          ))}
        </div>
        <button className="primary start" type="submit">Empezar partida</button>
      </form>
    </section>
  );
}

function PlayerCard({ player, index, onAdd, onUndo }) {
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');
  const total = totalScore(player.scores);

  function add(event) {
    event.preventDefault();
    const score = parseScore(points);
    if (score === null || !Number.isSafeInteger(total + score)) {
      setError('Introduce un número entero válido.');
      return;
    }
    onAdd(score);
    setPoints('');
    setError('');
  }

  return (
    <section className="player panel" aria-labelledby={`player-${index}`}>
      <div className="player-heading">
        <h2 id={`player-${index}`}>{player.name}</h2>
        <div className="total" aria-live="polite" aria-atomic="true">
          <strong>{total}</strong><span>puntos</span>
        </div>
      </div>
      <form onSubmit={add} className="score-form">
        <label htmlFor={`points-${index}`}>Añadir puntos</label>
        <div className="score-input">
          <input id={`points-${index}`} type="text" inputMode="numeric"
            value={points} autoComplete="off" aria-invalid={Boolean(error)}
            aria-describedby={error ? `error-${index}` : undefined}
            onChange={(event) => { setPoints(event.target.value); setError(''); }} />
          <button className="primary" type="submit">Sumar</button>
        </div>
        {error && <p className="error" id={`error-${index}`} role="alert">{error}</p>}
      </form>
      <details className="history">
        <summary>Historial <span className="muted">({player.scores.length})</span></summary>
        {player.scores.length === 0 ? (
          <p className="muted empty">Todavía no hay puntos.</p>
        ) : (
          <>
            <ol className="score-list" aria-label={`Puntuaciones de ${player.name}`}>
              {player.scores.map((score, turn) => (
                <li key={turn}><span className="muted">Turno {turn + 1}</span>
                  <strong>{score > 0 ? '+' : ''}{score}</strong></li>
              ))}
            </ol>
            <button type="button" className="undo" onClick={onUndo}
              aria-label={`Deshacer la última puntuación de ${player.name}`}>Deshacer último</button>
          </>
        )}
      </details>
    </section>
  );
}

function ThemeControl({ theme, onChange }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="theme-control">
      <button ref={trigger} type="button" aria-expanded={open} aria-controls="theme-select"
        onClick={() => setOpen((previous) => !previous)}>
        <span aria-hidden="true">⚙</span> Tema
      </button>
      {open && (
        <select id="theme-select" aria-label="Elegir tema" autoFocus value={theme}
          onBlur={(event) => { if (event.relatedTarget !== trigger.current) setOpen(false); }}
          onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
          onChange={(event) => { onChange(event.target.value); close(); }}>
          <option value="system">Dispositivo</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      )}
    </div>
  );
}

function App() {
  const [initial] = useState(readSavedGame);
  const [game, setGame] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);

  useEffect(() => {
    document.documentElement.dataset.theme = game.theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      setStorageError('No se puede guardar en este navegador. Si recargas, podrías perder los puntos.');
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
    if (window.confirm('¿Empezar una nueva partida? Se borrarán las puntuaciones actuales.')) {
      setGame((previous) => ({ ...previous, players: [] }));
    }
  }

  return (
    <main className={`app${game.players.length === 2 ? ' two-players' : ''}`}>
      <header className="header">
        <div><p className="eyebrow">SCRABSCORE</p><h1>Puntuaciones</h1></div>
        <ThemeControl theme={game.theme}
          onChange={(theme) => setGame((previous) => ({ ...previous, theme }))} />
      </header>
      {storageError && <p className="notice" role="alert">{storageError}</p>}
      {game.players.length === 0 ? <Setup onStart={(players) => setGame((previous) => ({ ...previous, players }))} /> : (
        <>
          <div className="game-toolbar">
            <p className="muted">{game.players.length} jugadores</p>
            <button type="button" className="new-game" onClick={reset}>Nueva partida</button>
          </div>
          <div className="players">
            {game.players.map((player, index) => (
              <PlayerCard key={index} player={player} index={index}
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
