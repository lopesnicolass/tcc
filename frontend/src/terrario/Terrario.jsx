import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGamification } from '../context/GamificationShared.js';
import { obterToken, request } from '../services/api.js';
import { remainingFromServer } from './focusClock.js';
import { moverComDeslocamento, passouDoLimiteArrasto, clampPosition } from './dragPosition.js';
import { construirJornada } from './jornada.js';
import { mensagemErroTerrario, validarEstadoTerrario } from './terrarioErrors.js';
import './Terrario.css';

import salaImg from './assets/ninho-atualizado.webp';
import tennaAnimada from './assets/tenna-antenas.webp';
import tennaParada from './assets/tenna-parada.webp';
import camaImg from './assets/01_cama_de_folhas.webp';
import luminariaImg from './assets/02_mesinha_com_luminaria_cogumelo.webp';
import prateleiraImg from './assets/03_prateleira_com_livros_e_plantas.webp';
import quadroImg from './assets/04_quadro_de_recados.webp';
import mesaImg from './assets/05_mesa_de_estudos.webp';
import bancoImg from './assets/06_banquinho_de_estudos.webp';
import estanteImg from './assets/07_estante_de_livros.webp';
import vasinhoImg from './assets/08_planta_em_vaso.webp';
import lampiaoImg from './assets/09_lampiao.webp';
import bauImg from './assets/10_bau_de_madeira.webp';
import tapeteImg from './assets/11_tapete_de_folha.webp';
import mesaRedondaImg from './assets/12_mesa_redonda_com_planta.webp';
import almofadaImg from './assets/13_almofada_de_folhas.webp';
import bancoTroncoImg from './assets/14_banquinho_de_tronco.webp';
import { limitesParaItem, posicionarNaZona, posicionarItemNaZona, ESCALA_MIN, ESCALA_MAX, ajustarEscala, posicaoEncostada } from './posicionamentoItens.js';
import { TEST_STORAGE_PREFIX, baseTeste, lerTeste, alternarItemTeste, moverItemTeste, redimensionarItemTeste } from './modoTeste.js';

// IDs e preços existentes preservados: as compras antigas continuam valendo.
// As coordenadas são percentuais da imagem original, não da janela do usuário.
const ITEMS = [
  { id: 'vasinho', name: 'Planta em vaso', price: 0, img: vasinhoImg, width: 13, x: 30, y: 78, zone: 'chao', subtitle: 'Seu primeiro presente' },
  { id: 'mesa', name: 'Mesa de estudos', price: 10, img: mesaImg, width: 27, x: 50, y: 56, zone: 'chao', subtitle: 'Organize seus materiais' },
  { id: 'banquinho', name: 'Banquinho de estudos', price: 6, img: bancoImg, width: 12, x: 47, y: 70, zone: 'chao', subtitle: 'Um assento de madeira' },
  { id: 'luminaria', name: 'Mesa com luminária cogumelo', price: 12, img: luminariaImg, width: 13, x: 15, y: 69, zone: 'chao', subtitle: 'Luz para o seu cantinho' },
  { id: 'cama', name: 'Cama de folhas', price: 16, img: camaImg, width: 31, x: 31, y: 68, zone: 'chao', subtitle: 'Um cantinho de descanso' },
  { id: 'prateleira', name: 'Prateleira de livros e plantas', price: 18, img: prateleiraImg, width: 25, x: 26, y: 36, zone: 'parede', subtitle: 'Decore a parede da toca' },
  { id: 'quadro', name: 'Quadro de recados', price: 9, img: quadroImg, width: 17, x: 50, y: 36, zone: 'parede', subtitle: 'Suas ideias em destaque' },
  { id: 'estante', name: 'Estante de livros', price: 20, img: estanteImg, width: 18, x: 70, y: 55, zone: 'chao', subtitle: 'Guarde seus livros' },
  { id: 'lampiao', name: 'Lampião', price: 12, img: lampiaoImg, width: 10, x: 83, y: 42, zone: 'pendurado', subtitle: 'Luz quentinha na parede' },
  { id: 'bau', name: 'Baú de madeira', price: 14, img: bauImg, width: 18, x: 22, y: 79, zone: 'chao', subtitle: 'Um baú para lembranças' },
  { id: 'tapete', name: 'Tapete de folha', price: 8, img: tapeteImg, width: 30, x: 40, y: 77, zone: 'tapete', subtitle: 'Aconchego para o chão' },
  { id: 'mesa_redonda', name: 'Mesa redonda com planta', price: 18, img: mesaRedondaImg, width: 20, x: 76, y: 73, zone: 'chao', subtitle: 'Natureza e decoração' },
  { id: 'almofada', name: 'Almofada de folhas', price: 7, img: almofadaImg, width: 15, x: 63, y: 80, zone: 'tapete', subtitle: 'Um descanso macio' },
  { id: 'banquinho_tronco', name: 'Banquinho de tronco', price: 7, img: bancoTroncoImg, width: 12, x: 82, y: 80, zone: 'chao', subtitle: 'Assento feito de tronco' },
];

const DURATIONS = [1, 15, 25, 45];
const MATERIAS = ['Português', 'Matemática', 'História', 'Geografia', 'Ciências'];
const REWARDS = { 1: { sementes: 2, xp: 0 }, 15: { sementes: 5, xp: 10 }, 25: { sementes: 8, xp: 15 }, 45: { sementes: 12, xp: 20 } };
const DEFAULT_POSITIONS = Object.fromEntries(ITEMS.map(({ id, x, y }) => [id, { x, y }]));

function userKey() {
  try {
    const token = obterToken();
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const id = payload.id ?? payload.usuarioId ?? payload.userId ?? payload.sub;
    if (id != null) return String(id);
  } catch { /* Ignora tokens inválidos; as operações da API continuam autenticadas. */ }
  return 'local';
}
function seenKey() { return `tenna_terrario_conclusao_vista_${userKey()}`; }

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// O WebP contém os frames aprovados, com o corpo fixo e apenas as anteninhas em movimento.
// Respeita a preferência de acessibilidade por movimento reduzido.
function TennaAnt() {
  return (
    <picture className="terr-tenna-picture">
      <source media="(prefers-reduced-motion: reduce)" srcSet={tennaParada} />
      <img className="terr-tenna-img" src={tennaAnimada} alt="Tenna, formiguinha azul deitada, estudando no notebook e movimentando as anteninhas" draggable="false" />
    </picture>
  );
}

export default function Terrario() {
  const { level, title, recarregarGamificacao } = useGamification();
  const [snapshot, setSnapshot] = useState(null);
  const snapshotRef = useRef(null);
  const sequenceRef = useRef(0);
  const busyRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [duration, setDuration] = useState(25);
  const [materia, setMateria] = useState('Matemática');
  const [acknowledgedId, setAcknowledgedId] = useState(() => {
    try { return Number(localStorage.getItem(seenKey())) || null; }
    catch { return null; }
  });
  const [decorate, setDecorate] = useState(false);
  // Nesta versão de avaliação o modo livre já começa ativo.
  // Ao desligá-lo, a loja e o inventário oficiais continuam como antes.
  const [modoTeste, setModoTeste] = useState(true);
  const chaveTeste = useMemo(() => `${TEST_STORAGE_PREFIX}${userKey()}`, []);
  const [testeSalvo, setTesteSalvo] = useState(() => {
    try { return lerTeste(window.localStorage, `${TEST_STORAGE_PREFIX}${userKey()}`, ITEMS); }
    catch { return { iniciado: false, visible: [], positions: {} }; }
  });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [selected, setSelected] = useState('vasinho');
  const [drag, setDrag] = useState(null);
  const [scalePreview, setScalePreview] = useState(null);
  const scaleDraftRef = useRef(null);
  const stageRef = useRef(null);
  const draggingRef = useRef(null);

  const applyResponse = useCallback((data) => {
    validarEstadoTerrario(data);
    const previous = snapshotRef.current?.data?.sessao;
    const current = data?.sessao;
    const receivedAt = Date.now();
    snapshotRef.current = { data, receivedAt };
    setSnapshot({ data, receivedAt });
    setNow(receivedAt);
    setError('');
    if (current?.estado === 'concluida' && current.id !== previous?.id &&
      previous?.estado === 'em_andamento') {
      void recarregarGamificacao?.('Sessão de foco concluída');
    } else if (current?.estado === 'concluida' && previous?.id === current.id &&
      previous?.estado !== 'concluida') {
      void recarregarGamificacao?.('Sessão de foco concluída');
    }
  }, [recarregarGamificacao]);

  const loadStatus = useCallback(async () => {
    if (busyRef.current) return;
    const sequence = ++sequenceRef.current;
    try {
      const data = await request('/terrario/estado');
      if (sequence === sequenceRef.current && !busyRef.current) applyResponse(data);
    } catch (e) {
      if (sequence === sequenceRef.current) setError(mensagemErroTerrario(e));
    } finally {
      if (sequence === sequenceRef.current) setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void loadStatus();
    return () => { sequenceRef.current += 1; };
  }, [loadStatus]);

  const server = snapshot?.data;
  const session = server?.sessao;
  const completed = session?.estado === 'concluida' && session.id !== acknowledgedId;
  const status = session?.estado === 'em_andamento' ? 'running'
    : session?.estado === 'pausada' ? 'paused'
    : completed ? 'completed' : 'idle';
  const active = status === 'running' || status === 'paused';
  const currentDuration = active || status === 'completed' ? session.duracao : duration;
  const remaining = active ? remainingFromServer(server, snapshot?.receivedAt, now)
    : status === 'completed' ? 0 : duration * 60;
  const progress = status === 'completed' ? 100
    : clampPosition(Math.round((1 - remaining / (currentDuration * 60)) * 100), 0, 100);
  const seeds = server?.sementes ?? 0;
  const validSessions = server?.sessoesValidas ?? 0;
  const focusMinutes = Math.floor((server?.tempoTotalSegundos ?? 0) / 60);
  const jornada = construirJornada(server);
  const sessionsUntilNextRoom = jornada.faltam;
  const roomDetail = jornada.salas.find((room) => room.numero === selectedRoom) || jornada.salas[0];

  useEffect(() => {
    if (status !== 'running') return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'running') return undefined;
    // O servidor valida o fim e o crédito. Atualizar o navegador nunca duplica XP.
    const timer = window.setInterval(() => { void loadStatus(); }, 4000);
    return () => window.clearInterval(timer);
  }, [status, loadStatus]);

  useEffect(() => {
    const refresh = () => { if (!document.hidden) void loadStatus(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadStatus]);

  async function sendAction(action) {
    if (busyRef.current || !server) return;
    busyRef.current = true;
    setBusy(true);
    setConfirmCancel(false);
    setError('');
    const sequence = ++sequenceRef.current;
    try {
      const path = action === 'iniciar' ? '/terrario/foco/iniciar' : `/terrario/foco/${session.id}/${action}`;
      const body = action === 'iniciar' ? {
        materia,
        duracao
      } : null;
      const options = { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) };
      const data = await request(path, options);
      if (sequence !== sequenceRef.current) return;
      applyResponse(data);
      setNotice(action === 'pausar' ? 'A sessão foi pausada e seu tempo está guardado.'
        : action === 'cancelar' ? 'Sessão encerrada sem perder suas conquistas.'
        : action === 'continuar' ? 'Boa sessão! A Tenna voltou a estudar.'
        : 'Sessão iniciada. Bons estudos!');
    } catch (e) {
      if (sequence === sequenceRef.current) setError(mensagemErroTerrario(e));
    } finally {
      busyRef.current = false;
      if (sequence === sequenceRef.current) setBusy(false);
    }
  }

  function acknowledgeCompletion() {
    if (!session?.id) return;
    setAcknowledgedId(session.id);
    setMateria(session.materia);
    setDuration(session.duracao);
    setNotice('');
    try { localStorage.setItem(seenKey(), String(session.id)); } catch { /* Opcional */ }
  }

  // O modo de teste é uma cópia independente do inventário, guardada apenas no navegador.
  // Nenhuma decoração de teste gasta sementes, compra itens nem grava no servidor.
  const ownedInventory = useMemo(() => server?.inventario || [], [server]);
  const decorOficial = useMemo(() => baseTeste(ITEMS, ownedInventory), [ownedInventory]);
  const decorTeste = testeSalvo.iniciado ? testeSalvo : decorOficial;
  const decor = modoTeste ? decorTeste : decorOficial;
  useEffect(() => {
    if (!testeSalvo.iniciado) return;
    try { localStorage.setItem(chaveTeste, JSON.stringify({ visible: testeSalvo.visible, positions: testeSalvo.positions, scales: testeSalvo.scales })); }
    catch { /* O preview funciona também se o navegador bloquear armazenamento local. */ }
  }, [chaveTeste, testeSalvo]);
  const atualizarTeste = (fn) => setTesteSalvo((atual) => fn(atual.iniciado ? atual : baseTeste(ITEMS, ownedInventory)));
  const selectedItem = ITEMS.find((item) => item.id === selected) || ITEMS[0];
  const isOwned = (id) => modoTeste || ownedInventory.some((item) => item.id === id);
  const selectedVisible = isOwned(selected) && decor.visible.includes(selected);
  const selectedScale = scalePreview?.id === selected ? scalePreview.scale : ajustarEscala(decor.scales?.[selected] ?? 1);
  const canAttachWall = !!posicaoEncostada(selected);
  const roomItems = ITEMS.filter((item) => decor.visible.includes(item.id));
  const sortedItems = useMemo(() => [...roomItems].sort((a, b) => decor.positions[a.id].y - decor.positions[b.id].y), [roomItems, decor.positions]);

  async function sendDecorAction(path, options, mensagem) {
    if (busyRef.current || !server) return false;
    busyRef.current = true;
    setBusy(true);
    setError('');
    const sequence = ++sequenceRef.current;
    try {
      const data = await request(path, options);
      if (sequence !== sequenceRef.current) return false;
      applyResponse(data);
      setNotice(mensagem);
      return true;
    } catch (e) {
      if (sequence === sequenceRef.current) setError(mensagemErroTerrario(e));
      return false;
    } finally {
      busyRef.current = false;
      if (sequence === sequenceRef.current) setBusy(false);
    }
  }

  function comprar(item) {
    if (modoTeste) { guardarOuColocar(item); return; }
    setSelected(item.id);
    void sendDecorAction(`/terrario/loja/${item.id}/comprar`, { method: 'POST' },
      `${item.name} comprado! Agora você pode colocá-lo no ninho.`);
  }

  function guardarOuColocar(item) {
    const colocar = !decor.visible.includes(item.id);
    setSelected(item.id);
    if (modoTeste) {
      atualizarTeste((atual) => alternarItemTeste(atual, item.id));
      if (colocar) setDecorate(true);
      setNotice(`${item.name} ${colocar ? 'adicionado ao cenário' : 'retirado da sala'} (modo teste).`);
      return;
    }
    void sendDecorAction(`/terrario/inventario/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ equipado: colocar })
    }, `${item.name} ${colocar ? 'colocado no ninho' : 'guardado no inventário'}.`);
  }

  async function moverItem(id, point) {
    if (modoTeste) {
      atualizarTeste((atual) => moverItemTeste(atual, id, point, ITEMS));
      setDrag(null);
      return;
    }
    await sendDecorAction(`/terrario/inventario/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ equipado: true, x: point.x, y: point.y })
    }, 'Posição salva na sua conta.');
    setDrag(null);
  }

  // Redimensionar é independente da posição e nunca exige sementes no modo de teste.
  // No modo oficial, o backend mantém a escala junto com o inventário do aluno.
  function redimensionarItem(id, valor) {
    if (!isOwned(id) || (busy && !modoTeste)) return;
    const escala = ajustarEscala(valor);
    setSelected(id);
    if (modoTeste) {
      atualizarTeste((atual) => redimensionarItemTeste(atual, id, escala, ITEMS));
      return;
    }
    const item = ITEMS.find((i) => i.id === id);
    const ponto = item ? posicionarItemNaZona(decor.positions[id], item, escala) : null;
    void sendDecorAction(`/terrario/inventario/${id}`, {
      method: 'PATCH', body: JSON.stringify({ equipado: true, escala, ...(ponto || {}) })
    }, 'Tamanho salvo na sua conta.');
  }

  // Ao arrastar o slider, o tamanho muda ao vivo; o servidor só recebe a
  // última medida ao soltar (evita requisições sobrepostas e pulos de escala).
  function previewEscala(valor) {
    const scale = ajustarEscala(valor);
    if (modoTeste) { redimensionarItem(selected, scale); return; }
    scaleDraftRef.current = { id: selected, scale };
    setScalePreview({ id: selected, scale });
  }
  function salvarEscalaDoControle() {
    const draft = scaleDraftRef.current;
    if (!draft) return;
    scaleDraftRef.current = null;
    setScalePreview(null);
    redimensionarItem(draft.id, draft.scale);
  }

  function encostarNaParede(item) {
    const ponto = posicaoEncostada(item.id);
    if (!ponto) return;
    setSelected(item.id);
    void moverItem(item.id, posicionarNaZona(ponto, item.zone));
  }

  function startDragging(evt, itemId) {
    if (!decorate || (busy && !modoTeste) || !isOwned(itemId) || evt.button !== 0) return;
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    draggingRef.current = {
      id: itemId, pointerId: evt.pointerId,
      startX: evt.clientX, startY: evt.clientY,
      original: { ...decor.positions[itemId] }, moved: false
    };
    setSelected(itemId);
  }
  function pointForDrag(track, evt) {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return moverComDeslocamento(track.original,
      evt.clientX - track.startX, evt.clientY - track.startY,
      bounds.width, bounds.height, limitesParaItem(ITEMS.find((item) => item.id === track.id), decor.scales?.[track.id] ?? 1));
  }
  function moveDragging(evt) {
    const track = draggingRef.current;
    if (!track || track.pointerId !== evt.pointerId) return;
    if (!track.moved && !passouDoLimiteArrasto(track.startX, track.startY, evt.clientX, evt.clientY)) return;
    track.moved = true;
    const point = pointForDrag(track, evt);
    if (point) setDrag({ id: track.id, ...point });
  }
  function finishDragging(evt) {
    const track = draggingRef.current;
    if (!track || track.pointerId !== evt.pointerId) return;
    draggingRef.current = null;
    if (evt.type === 'pointercancel' || !track.moved) {
      setDrag(null);
      return;
    }
    const point = pointForDrag(track, evt);
    if (point) void moverItem(track.id, point);
    else setDrag(null);
  }
  function updateWithKeyboard(evt, item) {
    if (!decorate || (busy && !modoTeste) || !isOwned(item.id)) return;
    const moves = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
    const movement = moves[evt.key];
    if (!movement) return;
    evt.preventDefault();
    const pos = decor.positions[item.id];
    void moverItem(item.id, posicionarItemNaZona({ x: pos.x + movement[0], y: pos.y + movement[1] }, item, decor.scales?.[item.id] ?? 1));
  }

  return (
    <main className="terr-page">
      <header className="terr-header">
        <div className="terr-header-copy">
          <span className="terr-eyebrow">UM CANTINHO SÓ SEU · TERRÁRIO DA TENNA</span>
          <h1>Um pequeno ninho. Grandes conquistas.</h1>
          <p>Estude com a Tenna, ganhe sementes e evolua ao longo da sua jornada.</p>
        </div>
        <div className="terr-header-stats">
          <div className="terr-wallet"><span aria-hidden="true">🌱</span><div><strong>{seeds}</strong><small>Sementes</small></div></div>
          <div className="terr-level"><span>NÍVEL DO ALUNO</span><strong>{level} · {title}</strong></div>
        </div>
      </header>

      {error && (
        <div className="terr-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(''); void loadStatus(); }}>Tentar novamente</button>
        </div>
      )}
      <section className={`terr-test-banner ${modoTeste ? 'is-active' : ''}`} aria-label="Modo de teste da decoração">
        <div className="terr-test-banner-copy">
          <strong>🛠️ {modoTeste ? 'Decoração livre para testes' : 'Decoração com sementes'}</strong>
          <span>{modoTeste ? 'Os 14 móveis estão liberados! Adicione, retire e arraste sem gastar sementes. As alterações ficam apenas neste navegador.' : 'Loja oficial ativada: as compras usam sementes e as posições são salvas na sua conta.'}</span>
        </div>
        <div className="terr-test-banner-actions">
          {modoTeste && <>
            <button type="button" onClick={() => { atualizarTeste((atual) => ({ ...atual, iniciado: true, visible: ITEMS.map((item) => item.id) })); setDecorate(true); }}>Colocar todos</button>
            <button type="button" onClick={() => { atualizarTeste((atual) => ({ ...atual, iniciado: true, visible: [] })); setDrag(null); }}>Esvaziar sala</button>
          </>}
          <button type="button" className="terr-test-mode-toggle" aria-pressed={modoTeste} onClick={() => { setModoTeste((ativo) => !ativo); setDrag(null); }}>
            {modoTeste ? 'Desativar teste' : 'Ativar teste'}
          </button>
        </div>
      </section>
      <div className="terr-layout">
        <section className="terr-scene-card" aria-labelledby="terr-scene-title">
          <div className="terr-scene-topbar">
            <div className="terr-scene-heading"><span className="terr-kicker">SALA 01 · SEU PONTO DE PARTIDA</span><h2 id="terr-scene-title">Ninho Inicial</h2><p>O primeiro espaço da sua jornada com a Tenna.</p></div>
            <div className="terr-scene-actions">
              <span className={`terr-status ${status === 'running' ? 'is-working' : ''}`}><span />{status === 'running' ? 'Tenna focada' : status === 'paused' ? 'Foco pausado' : 'Tenna em casa'}</span>
              <button type="button" className={`terr-decorate-button ${decorate ? 'active' : ''}`} onClick={() => setDecorate((value) => !value)} disabled={!modoTeste && (busy || loading)} aria-pressed={decorate}>
                {decorate ? '✓ Terminar decoração' : '✦ Decorar sala'}
              </button>
            </div>
          </div>
          {decorate && selectedVisible && (
            <div className="terr-size-toolbar" role="group" aria-label={`Personalizar ${selectedItem.name}`}>
              <div className="terr-size-item">
                <img src={selectedItem.img} alt="" draggable="false" />
                <div><strong>{selectedItem.name}</strong><small>Ajuste o tamanho deste item</small></div>
              </div>
              <div className="terr-size-editor">
                <button type="button" className="terr-size-step" aria-label={`Diminuir ${selectedItem.name}`} title="Diminuir 10%" disabled={selectedScale <= ESCALA_MIN || (!modoTeste && busy)} onClick={() => redimensionarItem(selected, selectedScale - 0.1)}>−</button>
                <input type="range" aria-label={`Tamanho de ${selectedItem.name}`} min={ESCALA_MIN} max={ESCALA_MAX} step="0.1" value={selectedScale}
                  disabled={!modoTeste && busy} onChange={(evt) => previewEscala(Number(evt.target.value))}
                  onPointerUp={salvarEscalaDoControle} onPointerCancel={salvarEscalaDoControle} onKeyUp={salvarEscalaDoControle} onBlur={salvarEscalaDoControle} />
                <button type="button" className="terr-size-step" aria-label={`Aumentar ${selectedItem.name}`} title="Aumentar 10%" disabled={selectedScale >= ESCALA_MAX || (!modoTeste && busy)} onClick={() => redimensionarItem(selected, selectedScale + 0.1)}>+</button>
                <span className="terr-size-value">{Math.round(selectedScale * 100)}%</span>
                <button type="button" className="terr-size-reset" disabled={selectedScale === 1 || (!modoTeste && busy)} onClick={() => redimensionarItem(selected, 1)}>Restaurar</button>
              </div>
              {canAttachWall && <button type="button" className="terr-wall-snap" disabled={!modoTeste && busy} onClick={() => encostarNaParede(selectedItem)}>↤ Encostar na parede</button>}
            </div>
          )}
          <div className="terr-scene-shell">
            <div className={`terr-scene ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef}>
              <img className="terr-scene-background" src={salaImg} alt="Ninho subterrâneo com paredes arredondadas, raízes e espaço para decoração" draggable="false" />
              <div className="terr-scene-story" aria-hidden="true">{status === 'running' ? 'Shhh... a Tenna está estudando!' : status === 'completed' ? 'Boa! Mais uma sessão concluída!' : status === 'paused' ? 'Descansar também faz parte!' : 'Nosso primeiro cantinho 🌱'}</div>
              {sortedItems.map((item) => {
                const pos = drag?.id === item.id ? drag : decor.positions[item.id];
                return (
                  <button type="button" key={item.id}
                    className={`terr-scene-item ${decorate ? 'movable' : ''} ${selected === item.id && decorate ? 'selected' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${item.width * (scalePreview?.id === item.id ? scalePreview.scale : ajustarEscala(decor.scales?.[item.id] ?? 1))}%`, zIndex: item.zone === 'parede' || item.zone === 'pendurado' ? 12 : item.zone === 'tapete' ? 14 : Math.round(pos.y) }}
                    onPointerDown={(evt) => startDragging(evt, item.id)} onPointerMove={moveDragging}
                    onPointerUp={finishDragging} onPointerCancel={finishDragging}
                    onKeyDown={(evt) => updateWithKeyboard(evt, item)} onClick={() => setSelected(item.id)}
                    aria-label={`${item.name}${decorate ? ', arraste ou use as setas para reposicionar' : ''}`}
                    title={decorate ? `Mover ${item.name}` : item.name}>
                    <img src={item.img} alt="" draggable="false" />
                  </button>
                );
              })}
              <div className="terr-character" style={{ zIndex: 68 }}>
                <TennaAnt />
              </div>
              {active && <div className="terr-inroom-timer" role="timer">{status === 'paused' ? 'Pausa' : 'Foco'} · {formatTime(remaining)}</div>}
              {decorate && <div className="terr-decor-hint">{modoTeste ? 'TESTE LIVRE · ' : ''}Toque em um móvel para ajustar o tamanho. Arraste ou use as setas para mover</div>}
            </div>
          </div>
          <div className="terr-scene-bottom">
            <div className="terr-room-journey"><span className="terr-chapter-mark" aria-hidden="true">✦</span><div className="terr-journey-copy"><span>PRÓXIMO CAPÍTULO</span><strong>O Cantinho de Estudos</strong><small>{jornada.segundaConquistada ? 'Conquistado! O novo cenário está em preparação.' : `Faltam ${sessionsUntilNextRoom} sessões válidas para conquistar`}</small></div></div>
            <div className="terr-room-progress"><div><span>{jornada.progresso} de {jornada.objetivo} sessões</span><strong>{jornada.percentual}%</strong></div><div className="terr-progress-track"><span style={{ width: `${jornada.percentual}%` }}/></div></div>
          </div>
        </section>

        <aside className="terr-sidebar">
          <section className="terr-sidecard terr-timer-card" aria-labelledby="terr-timer-heading">
            <span className="terr-kicker">ESTUDE COM A TENNA</span>
            <h2 id="terr-timer-heading">Hora do foco</h2>
            <p>Escolha a matéria e a duração. Suas sessões ficam salvas na sua conta.</p>
            <div className="terr-timer-clock" style={{ '--progress': `${progress}%` }} role="timer" aria-label={`Restam ${formatTime(remaining)}`}>
              <div className="terr-timer-inner"><strong>{formatTime(remaining)}</strong><span>{loading ? 'CARREGANDO' : busy ? 'ATUALIZANDO' : status === 'running' ? 'FOCANDO' : status === 'paused' ? 'EM PAUSA' : status === 'completed' ? 'CONCLUÍDO!' : 'PRONTO PARA COMEÇAR'}</span></div>
            </div>
            <label className="terr-duration-label" htmlFor="terr-materia">Matéria da sessão</label>
            <select id="terr-materia" className="terr-subject-select" value={active || status === 'completed' ? session.materia : materia}
              disabled={active || busy || loading || status === 'completed'} onChange={(evt) => setMateria(evt.target.value)}>
              {MATERIAS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className="terr-duration-label">Duração da sessão</div>
            <div className="terr-duration-options">
              {DURATIONS.map((minutes) => <button key={minutes} type="button"
                disabled={active || busy || loading || status === 'completed'} className={minutes === currentDuration ? 'active' : ''}
                onClick={() => setDuration(minutes)}>{minutes} min</button>)}
            </div>
            <small className="terr-test-note">1 minuto: demonstração (+2 sementes, sem XP ou avanço de sala). Sessões de 15 min ou mais contam para a jornada.</small>
            <div className="terr-timer-buttons">
              {status === 'running' ? (
                <button type="button" className="terr-primary" disabled={busy || loading} onClick={() => { void sendAction('pausar'); }}>Pausar sessão</button>
              ) : status === 'paused' ? (
                <button type="button" className="terr-primary" disabled={busy || loading} onClick={() => { void sendAction('continuar'); }}>Retomar sessão</button>
              ) : status === 'completed' ? (
                <button type="button" className="terr-primary" disabled={busy || loading} onClick={acknowledgeCompletion}>Preparar nova sessão</button>
              ) : (
                <button type="button" className="terr-primary" disabled={busy || loading || !server} onClick={() => { void sendAction('iniciar'); }}>Começar foco</button>
              )}
              {active && <button type="button" className="terr-secondary" disabled={busy || loading} onClick={() => setConfirmCancel(true)}>Encerrar</button>}
            </div>
            {confirmCancel && active && (
              <div className="terr-confirm-cancel" role="group" aria-label="Confirmar encerramento da sessão">
                <p>Encerrar esta sessão? O tempo atual não dará recompensa, mas suas conquistas anteriores continuam salvas.</p>
                <div>
                  <button type="button" className="terr-cancel-back" onClick={() => setConfirmCancel(false)}>Continuar estudando</button>
                  <button type="button" className="terr-cancel-confirm" disabled={busy} onClick={() => { void sendAction('cancelar'); }}>Sim, encerrar</button>
                </div>
              </div>
            )}
            {status === 'completed' ? (
              <div className="terr-focus-summary" role="status">
                <strong>🎉 Sessão concluída!</strong>
                <span>{session.materia} · {session.duracao} minutos de foco</span>
                <div><span>🌱 +{session.sementesRecebidas} sementes</span><span>✦ +{session.xpRecebido} XP</span></div>
                <small>Recompensa registrada na sua conta.</small>
              </div>
            ) : (
              <div className="terr-session-feedback" role="status">
                {status === 'paused' ? 'Seu tempo está salvo no servidor. Volte quando quiser.'
                  : status === 'running' ? `${session.materia} · Fique à vontade para sair e voltar: o progresso continua salvo.`
                  : `Ao concluir: até +${REWARDS[duration].sementes} sementes${REWARDS[duration].xp ? ` e +${REWARDS[duration].xp} XP` : ''}, respeitando os limites diários.`}
              </div>
            )}
            {notice && <div className="terr-inline-notice" role="status">{notice}</div>}
          </section>
          <section className="terr-sidecard terr-stats-card">
            <div><span className="terr-stat-emoji">✦</span><strong>{validSessions}</strong><small>Sessões válidas</small></div>
            <div><span className="terr-stat-emoji">◷</span><strong>{focusMinutes} min</strong><small>Tempo de foco</small></div>
          </section>
        </aside>
      </div>

      <section className="terr-journey" id="jornada" aria-labelledby="terr-journey-title">
        <div className="terr-journey-header">
          <div>
            <span className="terr-kicker">TRILHA DE CONQUISTAS</span>
            <h2 id="terr-journey-title">A jornada da Tenna <span aria-hidden="true">✦</span></h2>
            <p>Um capítulo de cada vez. Seu progresso é salvo na conta e você não perde conquistas por fazer pausas.</p>
          </div>
          <span className="terr-journey-count" aria-label={`${jornada.totalConquistadas} de 6 capítulos conquistados`}>
            <strong>{jornada.totalConquistadas}<span>/6</span></strong>
            <small>capítulos conquistados</small>
          </span>
        </div>
        <div className="terr-journey-cards" role="group" aria-label="Escolher capítulo da jornada para conhecer">
          {jornada.salas.map((room) => (
            <button key={room.numero} type="button"
              className={`terr-journey-card terr-journey-${room.tema} ${room.estado === 'futura' ? 'is-future' : ''} ${selectedRoom === room.numero ? 'is-selected' : ''}`}
              onClick={() => setSelectedRoom(room.numero)}
              aria-pressed={selectedRoom === room.numero} aria-label={`Capítulo ${room.numero}: ${room.nome}. ${room.jogavel ? 'Disponível' : room.conquistada ? 'Conquistado, cenário em preparação' : room.numero === 2 ? 'Bloqueado, requer cinco sessões' : 'Planejado para o futuro'}`}>
              <span className="terr-journey-card-top"><span>CAPÍTULO {String(room.numero).padStart(2, '0')}</span><span aria-hidden="true">{room.jogavel ? '✓' : room.conquistada ? '★' : '🔒'}</span></span>
              <span className="terr-journey-visual" aria-hidden="true"><span>{room.simbolo}</span></span>
              <strong>{room.nome}</strong>
              <small>{room.subtitulo}</small>
              <span className={`terr-journey-pill is-${room.estado}`}>{room.jogavel ? 'Sala atual' : room.conquistada ? 'Conquistada' : room.numero === 2 ? 'Em progresso' : 'Em breve'}</span>
            </button>
          ))}
        </div>
        <div className="terr-journey-detail" role="region" aria-label={`Detalhes do capítulo ${roomDetail.numero}`}>
          <div className="terr-journey-detail-icon" aria-hidden="true">{roomDetail.simbolo}</div>
          <div className="terr-journey-detail-copy">
            <span>CAPÍTULO {String(roomDetail.numero).padStart(2, '0')} · {roomDetail.jogavel ? 'DISPONÍVEL AGORA' : roomDetail.conquistada ? 'CONQUISTA ALCANÇADA' : 'UM PASSO DE CADA VEZ'}</span>
            <h3>{roomDetail.nome}</h3>
            <p>{roomDetail.descricao}</p>
            {roomDetail.numero === 2 && (
              <div className="terr-journey-goal">
                <div><span>{jornada.segundaConquistada ? '✓ Meta alcançada' : 'Sua meta: 5 sessões de pelo menos 15 min'}</span><strong>{jornada.progresso}/{jornada.objetivo}</strong></div>
                <div className="terr-progress-track"><span style={{ width: `${jornada.percentual}%` }} /></div>
                <small>{jornada.segundaConquistada ? 'Desbloqueio permanente. O cenário da Sala 2 ainda não é jogável.' : `Faltam ${jornada.faltam} ${jornada.faltam === 1 ? 'sessão válida' : 'sessões válidas'}. Sessões de demonstração não contam.`}</small>
              </div>
            )}
            {roomDetail.numero > 2 && <p className="terr-journey-future-note">Esta etapa é uma prévia. Novos cenários e requisitos serão adicionados em futuras versões.</p>}
          </div>
          {roomDetail.jogavel && <a className="terr-journey-back" href="#terr-scene-title">Voltar ao ninho ↑</a>}
        </div>
      </section>

      <section className="terr-inventory" aria-labelledby="terr-inventory-heading">
        <div className="terr-inventory-header"><div><span className="terr-kicker">SEU NINHO · PERSONALIZAÇÃO</span><h2 id="terr-inventory-heading">Crie seu cantinho</h2><p>{modoTeste ? 'Escolha qualquer móvel, ajuste seu tamanho e arraste pelo cenário, sem gastar sementes.' : 'Use suas sementes para comprar móveis. Suas compras e decorações ficam salvas na sua conta.'}</p></div><span className="terr-inventory-balance">{modoTeste ? '✦ 14 itens liberados para testes' : `🌱 ${seeds} sementes`}</span></div>
        <div className="terr-items-grid">
          {ITEMS.map((item) => {
            const itemOwned = isOwned(item.id);
            const visible = decor.visible.includes(item.id);
            return (
              <article key={item.id} className={`terr-item-card ${selected === item.id ? 'active' : ''} ${itemOwned ? 'is-owned' : ''} ${visible ? 'is-placed' : ''}`}>
                <button type="button" className="terr-item-preview" onClick={() => { setSelected(item.id); if (itemOwned) setDecorate(true); }} aria-label={`Selecionar ${item.name}`}><img src={item.img} alt="" loading="lazy"/></button>
                <div className="terr-item-desc"><strong>{item.name}</strong><small>{item.subtitle}</small></div>
                <div className="terr-item-bottom"><span className={itemOwned ? 'terr-owned-label' : 'terr-cost-label'}>{modoTeste ? '✦ Teste grátis' : itemOwned ? '✓ Desbloqueado' : `🌱 ${item.price}`}</span>
                  <button type="button" disabled={!modoTeste && (busy || loading || !server || (!itemOwned && seeds < item.price))}
                    title={!modoTeste && !itemOwned && seeds < item.price ? 'Sementes insuficientes' : undefined}
                    onClick={() => itemOwned ? guardarOuColocar(item) : comprar(item)}>
                    {itemOwned ? visible ? 'Guardar' : 'Colocar' : seeds < item.price ? 'Faltam sementes' : 'Comprar'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="terr-inventory-foot">
          <span role="status">{selectedVisible && decorate ? `${selectedItem.name}: arraste ou use as setas para mover; ajuste o tamanho no painel acima do cenário.` : modoTeste ? 'Teste à vontade: os itens ficam salvos somente neste navegador, sem consumir sementes.' : 'Compre com sementes e decore chão e paredes. Tudo é salvo na sua conta.'}</span>
          <button type="button" onClick={() => setDecorate(true)}>Organizar decorações →</button>
        </div>
      </section>
      <p className="terr-prototype-note">{modoTeste ? 'Modo de teste: as posições de teste ficam só neste navegador. Sementes, XP, compras e progresso da jornada não são alterados pela decoração livre.' : 'Sessões, XP, sementes, itens e conquista da Sala 2 ficam vinculados à sua conta. As Salas 2 a 6 estão representadas como capítulos da jornada; apenas o Ninho Inicial tem cenário jogável nesta versão.'}</p>
    </main>
  );
}
