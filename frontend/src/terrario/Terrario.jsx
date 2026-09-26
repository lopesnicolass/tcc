import { useCallback, useEffect, useMemo, useState } from 'react';
import './Terrario.css';
import { useGamification } from '../context/GamificationContext.jsx';

const STORAGE_KEY = 'tenna_focus_friend_v1';

const PRESETS = [15, 25, 45, 60];

const BEANS = [
  { id: 'baunilha', name: 'Baunilha', className: 'bean-vanilla', price: 0 },
  { id: 'cacau', name: 'Cacau', className: 'bean-cocoa', price: 18 },
  { id: 'menta', name: 'Menta', className: 'bean-mint', price: 28 },
  { id: 'lavanda', name: 'Lavanda', className: 'bean-lavender', price: 38 },
];

const DECOR = [
  { id: 'planta', name: 'Plantinha', icon: '🪴', price: 0, className: 'decor-plant' },
  { id: 'abajur', name: 'Abajur', icon: '🛋️', price: 12, className: 'decor-lamp' },
  { id: 'livros', name: 'Livros', icon: '📚', price: 16, className: 'decor-books' },
  { id: 'caneca', name: 'Caneca', icon: '☕', price: 20, className: 'decor-mug' },
  { id: 'quadro', name: 'Quadro', icon: '🖼️', price: 24, className: 'decor-frame' },
  { id: 'radio', name: 'Rádio', icon: '📻', price: 32, className: 'decor-radio' },
  { id: 'almofada', name: 'Almofada', icon: '🛏️', price: 36, className: 'decor-cushion' },
  { id: 'estrela', name: 'Luz de estrela', icon: '✨', price: 44, className: 'decor-stars' },
];

const DEFAULT_DATA = {
  beans: ['baunilha'],
  activeBean: 'baunilha',
  decor: ['planta'],
  coins: 0,
  sessions: 0,
  focusMinutes: 0,
};

function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return DEFAULT_DATA;

    return {
      ...DEFAULT_DATA,
      ...saved,
      beans: Array.isArray(saved.beans) && saved.beans.length ? saved.beans : DEFAULT_DATA.beans,
      decor: Array.isArray(saved.decor) && saved.decor.length ? saved.decor : DEFAULT_DATA.decor,
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function Bean({ skin, working, sad }) {
  const bean = BEANS.find((item) => item.id === skin) || BEANS[0];

  return (
    <div className={`focus-bean ${bean.className} ${working ? 'is-working' : ''} ${sad ? 'is-sad' : ''}`} aria-hidden="true">
      <div className="focus-bean-shadow" />
      <div className="focus-bean-body">
        <span className="bean-face bean-face-left" />
        <span className="bean-face bean-face-right" />
        <span className="bean-mouth" />
        <span className="bean-blush bean-blush-left" />
        <span className="bean-blush bean-blush-right" />
      </div>
      <div className="focus-bean-feet">
        <span />
        <span />
      </div>
    </div>
  );
}

export default function Terrario() {
  const { xp, streak, level, title, addXP } = useGamification();

  const [data, setData] = useState(loadSavedData);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finishedRecently, setFinishedRecently] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [message, setMessage] = useState('Escolha um tempo e comece sua sessão.');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  const completeFocus = useCallback(() => {
    const reward = Math.max(4, Math.round(durationMinutes * 0.4));

    setRunning(false);
    setFinishedRecently(true);
    setMessage(`Sessão concluída! Você ganhou ${reward} estrelas.`);
    setData((current) => ({
      ...current,
      coins: current.coins + reward,
      sessions: current.sessions + 1,
      focusMinutes: current.focusMinutes + durationMinutes,
    }));

    addXP(0, 'atividade concluída');
  }, [addXP, durationMinutes]);

  useEffect(() => {
    if (running && remaining === 0) {
      completeFocus();
    }
  }, [completeFocus, remaining, running]);

  const progress = useMemo(() => {
    const total = Math.max(1, durationMinutes * 60);
    return Math.min(1, Math.max(0, (total - remaining) / total));
  }, [durationMinutes, remaining]);

  const activeBean = BEANS.find((item) => item.id === data.activeBean) || BEANS[0];
  const ownedDecor = DECOR.filter((item) => data.decor.includes(item.id));
  const nextReward = Math.max(1, Math.round(durationMinutes * 0.4));
  const totalFocusHours = Math.floor(data.focusMinutes / 60);
  const totalFocusRest = data.focusMinutes % 60;

  function selectDuration(minutes) {
    if (running) return;
    setDurationMinutes(minutes);
    setRemaining(minutes * 60);
    setFinishedRecently(false);
    setMessage(`Sessão de ${minutes} minutos pronta.`);
  }

  function startFocus() {
    if (remaining === 0) setRemaining(durationMinutes * 60);
    setFinishedRecently(false);
    setRunning(true);
    setMessage('Seu companheiro começou a focar com você.');
  }

  function pauseFocus() {
    setRunning(false);
    setMessage('Sessão pausada. Retome quando estiver pronto.');
  }

  function stopFocus() {
    setRunning(false);
    setRemaining(durationMinutes * 60);
    setFinishedRecently(false);
    setMessage('Sessão encerrada sem recompensa. A próxima tentativa começa limpa.');
  }

  function buyBean(bean) {
    if (data.beans.includes(bean.id)) {
      setData((current) => ({ ...current, activeBean: bean.id }));
      setMessage(`${bean.name} agora é seu companheiro.`);
      return;
    }

    if (data.coins < bean.price) {
      setMessage(`Você precisa de mais ${bean.price - data.coins} estrelas.`);
      return;
    }

    setData((current) => ({
      ...current,
      coins: current.coins - bean.price,
      beans: [...current.beans, bean.id],
      activeBean: bean.id,
    }));
    setMessage(`${bean.name} desbloqueado.`);
  }

  function buyDecor(item) {
    if (data.decor.includes(item.id)) return;
    if (data.coins < item.price) {
      setMessage(`Você precisa de mais ${item.price - data.coins} estrelas.`);
      return;
    }

    setData((current) => ({
      ...current,
      coins: current.coins - item.price,
      decor: [...current.decor, item.id],
    }));
    setMessage(`${item.name} entrou no seu quarto.`);
  }

  return (
    <div className="focus-page">
      <header className="focus-header">
        <div>
          <span className="focus-kicker">SEU CANTINHO DE FOCO</span>
          <h1>Meu companheiro de foco</h1>
          <p>Estude no seu ritmo. Seu companheiro trabalha junto com você.</p>
        </div>

        <div className="focus-header-actions">
          <div className="focus-wallet" title="Estrelas acumuladas">
            <span className="focus-wallet-icon">✦</span>
            <div>
              <strong>{data.coins}</strong>
              <small>estrelas</small>
            </div>
          </div>
          <button
            type="button"
            className="focus-shop-button"
            onClick={() => setShopOpen((value) => !value)}
          >
            {shopOpen ? 'Fechar loja' : 'Abrir loja'}
          </button>
        </div>
      </header>

      <section className="focus-main-grid">
        <div className="focus-room-card">
          <div className="focus-room-topbar">
            <div>
              <strong>Quarto do {activeBean.name}</strong>
              <span>{running ? 'Seu companheiro está trabalhando.' : 'Deixe o ambiente do seu jeitinho.'}</span>
            </div>
            <div className={`focus-status ${running ? 'is-active' : ''}`}>
              <span />
              {running ? 'FOCANDO' : 'PRONTO'}
            </div>
          </div>

          <div className={`focus-room ${running ? 'focus-room-working' : ''}`}>
            <div className="focus-window">
              <span className="focus-cloud focus-cloud-one" />
              <span className="focus-cloud focus-cloud-two" />
              <span className="focus-sun" />
            </div>

            <div className="focus-wall-shelf">
              <span />
              <span />
              <span />
            </div>

            <div className="focus-desk">
              <div className="focus-desk-top" />
              <div className="focus-desk-leg focus-desk-leg-left" />
              <div className="focus-desk-leg focus-desk-leg-right" />
              <div className="focus-monitor">
                <div className="focus-monitor-glow" />
                <span>FOCO</span>
              </div>
            </div>

            <div className="focus-bean-wrap">
              <Bean skin={data.activeBean} working={running} sad={finishedRecently === false && !running && remaining !== durationMinutes * 60 && remaining > 0} />
              {running && <span className="focus-knitting">✦</span>}
            </div>

            <div className="focus-rug" />
            <div className="focus-floor-plant" aria-hidden="true">🪴</div>
            <div className="focus-room-cat" aria-hidden="true">✦</div>

            {ownedDecor.map((item) => (
              <div key={item.id} className={`focus-decor ${item.className}`} title={item.name}>
                {item.icon}
              </div>
            ))}

            {running && (
              <div className="focus-room-overlay">
                <div className="focus-timer-bubble">
                  <span>tempo restante</span>
                  <strong>{formatTime(remaining)}</strong>
                  <small>não interrompa seu companheiro 💛</small>
                </div>
              </div>
            )}
          </div>

          <div className="focus-room-footer">
            <div>
              <strong>{message}</strong>
              <span>{finishedRecently ? 'Ótimo trabalho. Use suas estrelas para personalizar o quarto.' : `${nextReward} estrelas ao concluir esta sessão.`}</span>
            </div>
            <div className="focus-mini-stats">
              <span>{data.sessions} sessões</span>
              <span>{data.focusMinutes} min focados</span>
            </div>
          </div>
        </div>

        <aside className="focus-control-card">
          <div className="focus-control-heading">
            <span>SESSÃO</span>
            <strong>Hora de focar</strong>
          </div>

          <div className="focus-timer-ring" aria-label={`Tempo restante ${formatTime(remaining)}`}>
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle className="focus-ring-base" cx="80" cy="80" r="64" />
              <circle
                className="focus-ring-progress"
                cx="80"
                cy="80"
                r="64"
                strokeDasharray="402"
                strokeDashoffset={402 - (402 * progress)}
              />
            </svg>
            <div className="focus-timer-center">
              <strong>{formatTime(remaining)}</strong>
              <span>{running ? 'em andamento' : 'pronto para começar'}</span>
            </div>
          </div>

          <div className="focus-presets">
            {PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={durationMinutes === minutes ? 'active' : ''}
                onClick={() => selectDuration(minutes)}
                disabled={running}
              >
                {minutes} min
              </button>
            ))}
          </div>

          <div className="focus-session-actions">
            {!running ? (
              <button type="button" className="focus-primary-button" onClick={startFocus}>
                Começar foco
              </button>
            ) : (
              <button type="button" className="focus-primary-button" onClick={pauseFocus}>
                Pausar
              </button>
            )}
            <button type="button" className="focus-secondary-button" onClick={stopFocus}>
              Encerrar
            </button>
          </div>

          <div className="focus-profile-card">
            <Bean skin={data.activeBean} working={false} />
            <div>
              <strong>Nível {level} · {title}</strong>
              <span>{xp} XP · {streak} dias de sequência</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="focus-progress-grid">
        <div className="focus-info-card">
          <span className="focus-info-icon">⏱</span>
          <div>
            <strong>{data.sessions}</strong>
            <span>sessões concluídas</span>
          </div>
        </div>

        <div className="focus-info-card">
          <span className="focus-info-icon">✦</span>
          <div>
            <strong>{data.coins}</strong>
            <span>estrelas guardadas</span>
          </div>
        </div>

        <div className="focus-info-card">
          <span className="focus-info-icon">⌛</span>
          <div>
            <strong>{totalFocusHours}h {totalFocusRest}m</strong>
            <span>tempo total de foco</span>
          </div>
        </div>
      </section>

      {shopOpen && (
        <section className="focus-shop-panel">
          <div className="focus-shop-heading">
            <div>
              <span className="focus-kicker">PERSONALIZAÇÃO</span>
              <h2>Deixe o quarto com a sua cara</h2>
            </div>
            <strong>✦ {data.coins}</strong>
          </div>

          <div className="focus-shop-section">
            <div className="focus-shop-section-title">
              <strong>Companheiros</strong>
              <span>Troque o visual do seu companheiro.</span>
            </div>
            <div className="focus-shop-grid">
              {BEANS.map((bean) => {
                const owned = data.beans.includes(bean.id);
                const active = data.activeBean === bean.id;
                return (
                  <article key={bean.id} className={`focus-shop-item ${active ? 'is-active' : ''}`}>
                    <div className="focus-shop-preview">
                      <Bean skin={bean.id} working={false} />
                    </div>
                    <div className="focus-shop-item-copy">
                      <strong>{bean.name}</strong>
                      <span>{owned ? 'Desbloqueado' : `${bean.price} estrelas`}</span>
                    </div>
                    <button type="button" onClick={() => buyBean(bean)} disabled={active}>
                      {active ? 'Usando' : owned ? 'Usar' : 'Desbloquear'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="focus-shop-section">
            <div className="focus-shop-section-title">
              <strong>Decorações</strong>
              <span>Use as recompensas das suas sessões para renovar o quarto.</span>
            </div>
            <div className="focus-shop-grid focus-shop-grid-decor">
              {DECOR.map((item) => {
                const owned = data.decor.includes(item.id);
                return (
                  <article key={item.id} className={`focus-shop-item ${owned ? 'is-active' : ''}`}>
                    <div className="focus-decor-preview">{item.icon}</div>
                    <div className="focus-shop-item-copy">
                      <strong>{item.name}</strong>
                      <span>{owned ? 'No quarto' : `${item.price} estrelas`}</span>
                    </div>
                    <button type="button" onClick={() => buyDecor(item)} disabled={owned}>
                      {owned ? 'Comprado' : 'Comprar'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
