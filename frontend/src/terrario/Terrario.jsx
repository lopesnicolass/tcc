import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useGamification } from '../context/GamificationShared.js';
import './Terrario.css';

import salaImg from './assets/sala-ninho.webp';
import mesaImg from './assets/mesa.webp';
import bancoImg from './assets/banquinho.webp';
import camaImg from './assets/cama.webp';
import luminariaImg from './assets/luminaria.webp';
import vasinhoImg from './assets/vasinho.webp';

/** Primeira experiência jogável: recompensas locais, sem modificar o XP oficial. */
const ITEMS = [
  { id: 'vasinho', name: 'Vasinho de broto', price: 0, img: vasinhoImg, width: 10, x: 30, y: 78, subtitle: 'Seu primeiro presente', category: 'Chão' },
  { id: 'mesa', name: 'Mesa de estudos', price: 10, img: mesaImg, width: 29, x: 67, y: 74, subtitle: 'Para organizar as ideias', category: 'Chão' },
  { id: 'banquinho', name: 'Banquinho de terra', price: 6, img: bancoImg, width: 13, x: 59, y: 82, subtitle: 'Um lugar para sentar', category: 'Chão' },
  { id: 'luminaria', name: 'Luminária de raiz', price: 12, img: luminariaImg, width: 12, x: 84, y: 68, subtitle: 'Uma luz aconchegante', category: 'Chão' },
  { id: 'cama', name: 'Ninho de folhas', price: 16, img: camaImg, width: 27, x: 33, y: 81, subtitle: 'Cantinho de descanso', category: 'Chão' },
];

const DURATIONS = [1, 15, 25, 45];
const BASE_STATE = {
  seeds: 0,
  sessions: 0,
  focusMinutes: 0,
  owned: ['vasinho'],
  visible: [],
  positions: Object.fromEntries(ITEMS.map(({ id, x, y }) => [id, { x, y }])),
  duration: 25,
  status: 'idle',
  remaining: 25 * 60,
  endsAt: null,
  lastReward: null,
};

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function safeNumber(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

function storageKey() {
  // Evita misturar protótipos de alunos que usam o mesmo navegador.
  try {
    const token = localStorage.getItem('token');
    if (token?.split('.').length === 3) {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(part));
      const id = payload.id ?? payload.usuarioId ?? payload.userId ?? payload.sub;
      if (id !== undefined && id !== null) return `tenna_terrario_mvp_v1_${String(id)}`;
    }
  } catch { /* fallback apenas para o protótipo */ }
  return 'tenna_terrario_mvp_v1_local';
}

function rewardsFor(minutes) {
  return minutes === 1 ? 2 : Math.round(minutes * 0.64);
}

function applyTime(state, now) {
  if (state.status !== 'running' || !state.endsAt) return state;
  const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
  if (remaining > 0) return remaining === state.remaining ? state : { ...state, remaining };

  // A conclusão e as sementes entram na mesma atualização, uma única vez.
  const seedsEarned = rewardsFor(state.duration);
  return {
    ...state,
    status: 'completed',
    remaining: 0,
    endsAt: null,
    seeds: state.seeds + seedsEarned,
    sessions: state.sessions + 1,
    focusMinutes: state.focusMinutes + state.duration,
    lastReward: seedsEarned,
  };
}

function initialState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || 'null');
    if (!saved || typeof saved !== 'object') return { ...BASE_STATE };
    const known = ITEMS.map((item) => item.id);
    const owned = [...new Set(['vasinho', ...(Array.isArray(saved.owned) ? saved.owned : [])])].filter((id) => known.includes(id));
    const positions = Object.fromEntries(ITEMS.map((item) => {
      const position = saved.positions?.[item.id];
      return [item.id, {
        x: safeNumber(position?.x, item.x, 12, 88),
        y: safeNumber(position?.y, item.y, 56, 86),
      }];
    }));
    const duration = DURATIONS.includes(saved.duration) ? saved.duration : 25;
    const status = ['idle', 'running', 'paused', 'completed'].includes(saved.status) ? saved.status : 'idle';
    const hydrated = {
      ...BASE_STATE,
      seeds: safeNumber(saved.seeds, 0, 0, 1000000),
      sessions: safeNumber(saved.sessions, 0, 0, 100000),
      focusMinutes: safeNumber(saved.focusMinutes, 0, 0, 10000000),
      owned,
      visible: (Array.isArray(saved.visible) ? saved.visible : []).filter((id) => owned.includes(id)),
      positions,
      duration,
      status,
      remaining: safeNumber(saved.remaining, duration * 60, 0, duration * 60),
      endsAt: status === 'running' && Number.isFinite(saved.endsAt) ? saved.endsAt : null,
      lastReward: saved.lastReward ?? null,
    };
    if (status === 'running' && !hydrated.endsAt) return { ...hydrated, status: 'paused' };
    return applyTime(hydrated, Date.now());
  } catch {
    return { ...BASE_STATE };
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'TICK': return applyTime(state, action.now);
    case 'DURATION':
      if (state.status === 'running' || state.status === 'paused') return state;
      return { ...state, duration: action.duration, remaining: action.duration * 60, status: 'idle', lastReward: null };
    case 'START':
      if (state.status === 'running') return state;
      return {
        ...state,
        status: 'running',
        remaining: state.status === 'paused' ? state.remaining : state.duration * 60,
        endsAt: action.now + (state.status === 'paused' ? state.remaining : state.duration * 60) * 1000,
        lastReward: null,
      };
    case 'PAUSE':
      if (state.status !== 'running') return state;
      return { ...applyTime(state, action.now), status: action.now < state.endsAt ? 'paused' : 'completed', endsAt: null };
    case 'CANCEL':
      return { ...state, status: 'idle', remaining: state.duration * 60, endsAt: null, lastReward: null };
    case 'BUY': {
      const item = ITEMS.find((candidate) => candidate.id === action.id);
      if (!item || state.owned.includes(item.id) || state.seeds < item.price) return state;
      return { ...state, seeds: state.seeds - item.price, owned: [...state.owned, item.id], visible: [...state.visible, item.id] };
    }
    case 'TOGGLE': {
      if (!state.owned.includes(action.id)) return state;
      return { ...state, visible: state.visible.includes(action.id) ? state.visible.filter((id) => id !== action.id) : [...state.visible, action.id] };
    }
    case 'MOVE': {
      if (!state.owned.includes(action.id)) return state;
      return { ...state, positions: { ...state.positions, [action.id]: { x: clamp(action.x, 12, 88), y: clamp(action.y, 56, 86) } } };
    }
    default: return state;
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function TennaAnt({ working, cheering }) {
  return (
    <svg className={`terr-tenna-svg ${working ? 'is-studying' : ''} ${cheering ? 'is-cheering' : ''}`} viewBox="0 0 190 230" role="img" aria-label={working ? 'Tenna estudando' : cheering ? 'Tenna comemorando' : 'Tenna, a formiguinha azul'}>
      <defs>
        <linearGradient id="terrAntFace" x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#62c7ff"/><stop offset=".55" stopColor="#248cf0"/><stop offset="1" stopColor="#075ac4"/></linearGradient>
        <linearGradient id="terrAntBody" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#48b6ff"/><stop offset="1" stopColor="#0f59c5"/></linearGradient>
      </defs>
      <ellipse cx="96" cy="216" rx="55" ry="10" fill="#43321f" opacity=".17" />
      <path d="M65 49 Q34 18 50 14 Q64 8 77 43" fill="none" stroke="#125bbd" strokeWidth="12" strokeLinecap="round"/>
      <path d="M117 43 Q142 10 155 19 Q166 28 128 55" fill="none" stroke="#125bbd" strokeWidth="12" strokeLinecap="round"/>
      <ellipse cx="49" cy="15" rx="14" ry="9" fill="#238cff" transform="rotate(-24 49 15)"/>
      <ellipse cx="156" cy="19" rx="14" ry="9" fill="#238cff" transform="rotate(28 156 19)"/>
      <ellipse cx="95" cy="172" rx="42" ry="45" fill="url(#terrAntBody)" stroke="#134ca8" strokeWidth="4"/>
      <path d="M73 196 L64 213 M120 196 L130 213" stroke="#175dbb" strokeWidth="15" strokeLinecap="round"/>
      <ellipse cx="59" cy="215" rx="18" ry="8" fill="#0a4fa8"/><ellipse cx="136" cy="215" rx="18" ry="8" fill="#0a4fa8"/>
      <path d="M60 150 Q32 158 33 178 M132 147 Q156 159 153 179" fill="none" stroke="#1a72dd" strokeWidth="13" strokeLinecap="round"/>
      <circle cx="32" cy="179" r="11" fill="#268eea"/><circle cx="154" cy="178" r="11" fill="#268eea"/>
      <ellipse cx="95" cy="96" rx="74" ry="64" fill="url(#terrAntFace)" stroke="#1358b9" strokeWidth="4"/>
      <ellipse cx="69" cy="90" rx="19" ry="25" fill="white"/><ellipse cx="119" cy="90" rx="19" ry="25" fill="white"/>
      <ellipse cx="73" cy="91" rx="11" ry="18" fill="#13345e"/><ellipse cx="117" cy="91" rx="11" ry="18" fill="#13345e"/>
      <ellipse cx="76" cy="83" rx="4" ry="7" fill="white"/><ellipse cx="120" cy="83" rx="4" ry="7" fill="white"/>
      <ellipse cx="40" cy="113" rx="15" ry="8" fill="#ff91ab" opacity=".44"/><ellipse cx="151" cy="113" rx="15" ry="8" fill="#ff91ab" opacity=".44"/>
      <path d="M80 119 Q95 137 111 119" stroke="#083f8d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {working && <g className="terr-tenna-book"><rect x="53" y="154" width="82" height="49" rx="7" fill="#e9f5ff" stroke="#0b56b1" strokeWidth="4"/><path d="M94 157 V199 M63 167 H83 M106 167 H124 M64 180 H84 M105 180 H122" stroke="#8dbbea" strokeWidth="3" strokeLinecap="round"/><path d="M133 143 L145 178" stroke="#db9a49" strokeWidth="7" strokeLinecap="round"/></g>}
      {cheering && <g fill="#ffd16b"><path d="M24 35 l3 -12 4 12 12 4 -12 4 -4 12 -3 -12 -12 -4z"/><path d="M156 49 l2 -9 3 9 9 3 -9 2 -3 9 -2 -9 -9 -2z"/></g>}
    </svg>
  );
}

export default function Terrario() {
  const { level, title } = useGamification();
  const [game, dispatch] = useReducer(reducer, undefined, initialState);
  const [decorate, setDecorate] = useState(false);
  const [selected, setSelected] = useState('vasinho');
  const [drag, setDrag] = useState(null);
  const [notice, setNotice] = useState('');
  const stageRef = useRef(null);
  const draggingRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey(), JSON.stringify(game)); } catch { /* armazenamento desabilitado */ }
  }, [game]);

  useEffect(() => {
    if (game.status !== 'running') return undefined;
    const tick = () => dispatch({ type: 'TICK', now: Date.now() });
    const interval = window.setInterval(tick, 250);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [game.status]);

  const progress = game.status === 'completed' ? 100 : Math.round((1 - game.remaining / (game.duration * 60)) * 100);
  const selectedItem = ITEMS.find((item) => item.id === selected);
  const selectedOwned = selectedItem && game.owned.includes(selectedItem.id);
  const selectedVisible = selectedItem && game.visible.includes(selectedItem.id);
  const roomItems = ITEMS.filter((item) => game.visible.includes(item.id));
  const sortedItems = useMemo(() => [...roomItems].sort((a, b) => game.positions[a.id].y - game.positions[b.id].y), [roomItems, game.positions]);
  const sessionsUntilNextRoom = Math.max(0, 5 - game.sessions);

  function coordinates(evt) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: clamp(((evt.clientX - bounds.left) / bounds.width) * 100, 12, 88),
      y: clamp(((evt.clientY - bounds.top) / bounds.height) * 100, 56, 86),
    };
  }

  function startDragging(evt, itemId) {
    if (!decorate || evt.button !== 0) return;
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    draggingRef.current = itemId;
    setSelected(itemId);
    const point = coordinates(evt);
    if (point) setDrag({ id: itemId, ...point });
  }

  function moveDragging(evt) {
    if (!draggingRef.current) return;
    const point = coordinates(evt);
    if (point) setDrag({ id: draggingRef.current, ...point });
  }

  function finishDragging(evt) {
    if (!draggingRef.current) return;
    const point = coordinates(evt) || drag;
    if (point) dispatch({ type: 'MOVE', id: draggingRef.current, ...point });
    draggingRef.current = null;
    setDrag(null);
  }

  function updateWithKeyboard(evt, item) {
    if (!decorate) return;
    const directions = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
    const movement = directions[evt.key];
    if (!movement) return;
    evt.preventDefault();
    const pos = game.positions[item.id];
    dispatch({ type: 'MOVE', id: item.id, x: pos.x + movement[0], y: pos.y + movement[1] });
  }

  function purchase(item) {
    setSelected(item.id);
    if (game.owned.includes(item.id)) {
      dispatch({ type: 'TOGGLE', id: item.id });
      setNotice(game.visible.includes(item.id) ? `${item.name} guardado no inventário.` : `${item.name} voltou à sala.`);
      return;
    }
    if (game.seeds < item.price) {
      setNotice(`Faltam ${item.price - game.seeds} sementes para desbloquear ${item.name.toLowerCase()}.`);
      return;
    }
    dispatch({ type: 'BUY', id: item.id });
    setNotice(`${item.name} desbloqueado! Ative "Decorar" para mudar de lugar.`);
  }

  return (
    <main className="terr-page">
      <header className="terr-header">
        <div className="terr-header-copy">
          <span className="terr-eyebrow">UM CANTINHO SÓ SEU · TERRÁRIO DA TENNA</span>
          <h1>Um pequeno ninho. Grandes conquistas.</h1>
          <p>Estude com a Tenna, ganhe sementes de teste e transforme a primeira sala do formigueiro.</p>
        </div>
        <div className="terr-header-stats">
          <div className="terr-wallet"><span aria-hidden="true">🌱</span><div><strong>{game.seeds}</strong><small>Sementes</small></div></div>
          <div className="terr-level"><span>NÍVEL DO ALUNO</span><strong>{level} · {title}</strong></div>
        </div>
      </header>

      <div className="terr-layout">
        <section className="terr-scene-card" aria-labelledby="terr-scene-title">
          <div className="terr-scene-topbar">
            <div className="terr-scene-heading"><span className="terr-kicker">SALA 01 · SEU PONTO DE PARTIDA</span><h2 id="terr-scene-title">Ninho Inicial</h2><p>O primeiro espaço da sua jornada com a Tenna.</p></div>
            <div className="terr-scene-actions">
              <span className={`terr-status ${game.status === 'running' ? 'is-working' : ''}`}><span />{game.status === 'running' ? 'Tenna focada' : 'Tenna em casa'}</span>
              <button type="button" className={`terr-decorate-button ${decorate ? 'active' : ''}`} onClick={() => setDecorate((value) => !value)} aria-pressed={decorate}>
                {decorate ? '✓ Terminar decoração' : '✦ Decorar sala'}
              </button>
            </div>
          </div>
          <div className="terr-scene-shell">
            <div className={`terr-scene ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef}>
              <img className="terr-scene-background" src={salaImg} alt="Sala subterrânea vazia de terra com paredes arredondadas, raízes e chão livre para decoração" draggable="false" />
              <div className="terr-scene-story" aria-hidden="true">{game.status === 'running' ? 'Shhh... a Tenna está estudando!' : game.status === 'completed' ? 'Boa! Mais uma sessão concluída!' : 'Nosso primeiro cantinho 🌱'}</div>
              {sortedItems.map((item) => {
                const pos = drag?.id === item.id ? drag : game.positions[item.id];
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`terr-scene-item ${decorate ? 'movable' : ''} ${selected === item.id && decorate ? 'selected' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${item.width}%`, zIndex: Math.round(pos.y) }}
                    onPointerDown={(evt) => startDragging(evt, item.id)}
                    onPointerMove={moveDragging}
                    onPointerUp={finishDragging}
                    onPointerCancel={finishDragging}
                    onKeyDown={(evt) => updateWithKeyboard(evt, item)}
                    onClick={() => setSelected(item.id)}
                    aria-label={`${item.name}${decorate ? ', arraste ou use as setas para reposicionar' : ''}`}
                    title={decorate ? `Mover ${item.name}` : item.name}
                  >
                    <img src={item.img} alt="" draggable="false" />
                  </button>
                );
              })}
              <div className="terr-character" style={{ zIndex: 78 }}>
                <TennaAnt working={game.status === 'running'} cheering={game.status === 'completed'} />
              </div>
              {game.status === 'running' && <div className="terr-inroom-timer" role="timer">Foco · {formatTime(game.remaining)}</div>}
              {decorate && <div className="terr-decor-hint">Arraste os objetos ou selecione e use as setas do teclado</div>}
            </div>
          </div>
          <div className="terr-scene-bottom">
            <div className="terr-room-journey"><span className="terr-chapter-mark" aria-hidden="true">✦</span><div className="terr-journey-copy"><span>PRÓXIMO CAPÍTULO</span><strong>O Cantinho de Estudos</strong><small>{sessionsUntilNextRoom === 0 ? 'Meta alcançada! Próxima sala em desenvolvimento.' : `Faltam ${sessionsUntilNextRoom} sessões para a meta de 5`}</small></div></div>
            <div className="terr-room-progress"><div><span>{Math.min(game.sessions, 5)} de 5 sessões</span><strong>{Math.min(100, game.sessions * 20)}%</strong></div><div className="terr-progress-track"><span style={{ width: `${Math.min(100, game.sessions * 20)}%` }}/></div></div>
          </div>
        </section>

        <aside className="terr-sidebar">
          <section className="terr-sidecard terr-timer-card" aria-labelledby="terr-timer-heading">
            <span className="terr-kicker">ESTUDE COM A TENNA</span>
            <h2 id="terr-timer-heading">Hora do foco</h2>
            <p>Escolha um tempo e comece. A Tenna estuda com você.</p>
            <div className="terr-timer-clock" style={{ '--progress': `${progress}%` }} role="timer" aria-label={`Restam ${formatTime(game.remaining)}`}>
              <div className="terr-timer-inner"><strong>{formatTime(game.remaining)}</strong><span>{game.status === 'running' ? 'FOCANDO' : game.status === 'paused' ? 'EM PAUSA' : game.status === 'completed' ? 'CONCLUÍDO!' : 'PRONTO PARA COMEÇAR'}</span></div>
            </div>
            <div className="terr-duration-label">Duração da sessão</div>
            <div className="terr-duration-options">
              {DURATIONS.map((minutes) => <button key={minutes} type="button" disabled={game.status === 'running' || game.status === 'paused'} className={minutes === game.duration ? 'active' : ''} onClick={() => dispatch({ type: 'DURATION', duration: minutes })}>{minutes} min</button>)}
            </div>
            <small className="terr-test-note">1 minuto é o modo de teste deste protótipo.</small>
            <div className="terr-timer-buttons">
              {game.status === 'running' ? (
                <button type="button" className="terr-primary" onClick={() => dispatch({ type: 'PAUSE', now: Date.now() })}>Pausar sessão</button>
              ) : (
                <button type="button" className="terr-primary" onClick={() => dispatch({ type: 'START', now: Date.now() })}>{game.status === 'paused' ? 'Retomar sessão' : game.status === 'completed' ? 'Começar outra sessão' : 'Começar foco'}</button>
              )}
              {(game.status === 'running' || game.status === 'paused') && <button type="button" className="terr-secondary" onClick={() => dispatch({ type: 'CANCEL' })}>Encerrar</button>}
            </div>
            <div className="terr-session-feedback" role="status">
              {game.status === 'completed' ? `Você ganhou ${game.lastReward} sementes! Sua sala está esperando por você.` : game.status === 'paused' ? 'Pode retomar quando quiser. Seu tempo foi guardado.' : `Complete a sessão para receber ${rewardsFor(game.duration)} sementes.`}
            </div>
          </section>
          <section className="terr-sidecard terr-stats-card">
            <div><span className="terr-stat-emoji">✦</span><strong>{game.sessions}</strong><small>Sessões de foco</small></div>
            <div><span className="terr-stat-emoji">◷</span><strong>{game.focusMinutes} min</strong><small>Tempo dedicado</small></div>
          </section>
        </aside>
      </div>

      <section className="terr-inventory" aria-labelledby="terr-inventory-heading">
        <div className="terr-inventory-header"><div><span className="terr-kicker">LOJINHA DO NINHO</span><h2 id="terr-inventory-heading">Crie seu cantinho</h2><p>Os itens são independentes do cenário. Compre, guarde e mova à vontade.</p></div><span className="terr-inventory-balance">🌱 {game.seeds} sementes</span></div>
        <div className="terr-items-grid">
          {ITEMS.map((item) => {
            const owned = game.owned.includes(item.id);
            const visible = game.visible.includes(item.id);
            return (
              <article key={item.id} className={`terr-item-card ${selected === item.id ? 'active' : ''} ${owned ? 'is-owned' : ''} ${visible ? 'is-placed' : ''}`}>
                <button type="button" className="terr-item-preview" onClick={() => { setSelected(item.id); if (owned) setDecorate(true); }} aria-label={`Selecionar ${item.name}`}><img src={item.img} alt="" loading="lazy"/></button>
                <div className="terr-item-desc"><strong>{item.name}</strong><small>{item.subtitle}</small></div>
                <div className="terr-item-bottom"><span className={owned ? 'terr-owned-label' : 'terr-cost-label'}>{owned ? '✓ Desbloqueado' : `🌱 ${item.price}`}</span><button type="button" onClick={() => purchase(item)}>{owned ? visible ? 'Guardar' : 'Colocar' : 'Comprar'}</button></div>
              </article>
            );
          })}
        </div>
        <div className="terr-inventory-foot">
          <span role="status">{notice || (selectedOwned && selectedVisible && decorate ? `${selectedItem.name} selecionado. Arraste dentro da sala ou use as setas do teclado.` : 'Dica: experimente o foco de 1 minuto para ganhar suas primeiras sementes.')}</span>
          <button type="button" onClick={() => setDecorate(true)}>Organizar decorações →</button>
        </div>
      </section>
      <p className="terr-prototype-note">Protótipo local: sessões, sementes e posições ficam salvas neste navegador. O XP oficial não muda e o desbloqueio das demais salas ainda não está ativo. A persistência segura no backend ficará para a próxima etapa.</p>
    </main>
  );
}
