import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGamification } from '../context/GamificationShared.js';
import { obterToken, request } from '../services/api.js';
import { remainingFromServer } from './focusClock.js';
import { deveAnimarTenna } from './comportamentoFoco.js';
import { moverComDeslocamento, passouDoLimiteArrasto, clampPosition } from './dragPosition.js';
import { construirJornada } from './jornada.js';
import { salasVisiveisNoMapa, formatoMapa } from './mapaSalas.js';
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
import guardaRoupaImg from './assets/15_guarda_roupa_de_folhas.webp';
import { limitesParaItem, posicionarItemNaZona, ESCALA_MIN, ESCALA_MAX, ajustarEscala, posicaoEncostada } from './posicionamentoItens.js';
import { ITEMS_SALA2, DESTAQUES_SALA2 } from './sala2Itens.js';
import { ITEMS_SALA3, ITEMS_SALA3_LEGADOS } from './sala3Itens.js';
import { distribuirMoveis, ehMovelDeEstudoAntigo } from './catalogoSalas.js';
import { TEST_STORAGE_PREFIX, baseTeste, lerTeste, alternarItemTeste, moverItemTeste, redimensionarItemTeste, prepararPreviaCompletaSala3, montarAmbienteSala3 } from './modoTeste.js';

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
  { id: 'guarda_roupa', name: 'Guarda-roupa de folhas', price: 20, img: guardaRoupaImg, width: 27, x: 59, y: 51, zone: 'chao', subtitle: 'Madeira aconchegante com detalhes de folhas' },
];

const DURATIONS = [1, 15, 25, 45];
const REWARDS = { 1: { sementes: 2, xp: 0 }, 15: { sementes: 5, xp: 10 }, 25: { sementes: 8, xp: 15 }, 45: { sementes: 12, xp: 20 } };
const TODOS_ITENS = [...ITEMS, ...ITEMS_SALA2, ...ITEMS_SALA3, ...ITEMS_SALA3_LEGADOS];
// ALTERAÇÃO TEMPORÁRIA: salas visíveis e acessíveis só no modo de teste.
// Para restaurar os bloqueios originais, altere para false ou remova esta condição.
// Não altera o banco de dados, as sessões, o XP, as sementes nem os desbloqueios reais.
const SALAS_LIBERADAS_PARA_PREVIA = true;
// O catálogo seleciona móveis por ambiente sem alterar os IDs ou as compras existentes.

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

// Anteninhas animadas somente no modo foco. Em personalização, a Tenna
// permanece estática mesmo com as três salas visíveis no mapa.
// A preferência por movimento reduzido mantém a imagem parada em ambos os modos.
function TennaAnt({ animar = false }) {
  return (
    <picture className="terr-tenna-picture">
      <source media="(prefers-reduced-motion: reduce)" srcSet={tennaParada} />
      <img className="terr-tenna-img" src={animar ? tennaAnimada : tennaParada}
        alt={animar ? 'Tenna, formiguinha azul estudando e movimentando as anteninhas' : 'Tenna, formiguinha azul parada estudando no notebook'}
        draggable="false" />
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
  const materia = 'Estudo livre';
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
    try {
      const chave = `${TEST_STORAGE_PREFIX}${userKey()}`;
      const storage = window.localStorage;
      const salvo = lerTeste(storage, chave, ITEMS);
      // Exibe o guarda-roupa uma vez também para quem já tinha a sala salva.
      // Depois respeita se o usuário guardar ou reposicionar o móvel.
      const versaoChave = `${chave}_guarda_roupa_v1`;
      const novaPrevia = storage.getItem(versaoChave) !== '1';
      if (novaPrevia) {
        try { storage.setItem(versaoChave, '1'); } catch { /* Armazenamento opcional. */ }
      }
      const visibilidade = novaPrevia && salvo.iniciado
        ? [...new Set([...salvo.visible, 'guarda_roupa'])]
        : salvo.visible;
      // Migração visual pontual: se o móvel estava no antigo limite superior
      // (56%), sobe para 51%. Posições personalizadas fora desse limite ficam intactas.
      const alturaChave = `${chave}_guarda_roupa_altura_v2`;
      const migrarAltura = storage.getItem(alturaChave) !== '1';
      const anterior = salvo.positions?.guarda_roupa;
      const posicoes = migrarAltura && salvo.iniciado && anterior?.y === 56
        ? { ...salvo.positions, guarda_roupa: { ...anterior, y: 51 } }
        : salvo.positions;
      const atualizado = { ...salvo, visible: visibilidade, positions: posicoes };
      if (migrarAltura) {
        try {
          // Persiste antes da marca de versão: evita reaplicar a migração
          // na dupla inicialização de desenvolvimento do React.
          if (posicoes !== salvo.positions) storage.setItem(chave, JSON.stringify(atualizado));
          storage.setItem(alturaChave, '1');
        } catch { /* Armazenamento opcional. */ }
      }
      return atualizado;
    } catch { return { iniciado: false, visible: [], positions: {}, scales: {} }; }
  });
  // A Sala 2 tem uma decoração de teste independente da Sala 1.
  const chaveTeste2 = useMemo(() => `${TEST_STORAGE_PREFIX}sala2_${userKey()}`, []);
  const [testeSalvo2, setTesteSalvo2] = useState(() => {
    try { return lerTeste(window.localStorage, `${TEST_STORAGE_PREFIX}sala2_${userKey()}`, ITEMS_SALA2); }
    catch { return { iniciado: false, visible: [], positions: {}, scales: {} }; }
  });
  const chaveTeste3 = useMemo(() => `${TEST_STORAGE_PREFIX}sala3_${userKey()}`, []);
  const [testeSalvo3, setTesteSalvo3] = useState(() => {
    try { return prepararPreviaCompletaSala3(lerTeste(window.localStorage, `${TEST_STORAGE_PREFIX}sala3_${userKey()}`, [...ITEMS_SALA3, ...ITEMS_SALA3_LEGADOS]), ITEMS_SALA3); }
    catch { return prepararPreviaCompletaSala3({ iniciado: false, visible: [], positions: {}, scales: {} }, ITEMS_SALA3); }
  });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [selected, setSelected] = useState('vasinho');
  const [drag, setDrag] = useState(null);
  const [scalePreview, setScalePreview] = useState(null);
  const scaleDraftRef = useRef(null);
  const stageRef = useRef(null);
  const stageRef2 = useRef(null);
  const stageRef3 = useRef(null);
  const viewportRef = useRef(null);
  const decorDialogRef = useRef(null);
  const decorCloseRef = useRef(null);
  const salasRefs = useRef({});
  const panRef = useRef(null);
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
  // Uma sessão restaurada pelo servidor tem prioridade sobre o editor modal.
  // Sem isso o cronômetro fica escondido por uma janela aberta anteriormente.
  useEffect(() => {
    if (!active) return;
    setDecorate(false);
    setDrag(null);
  }, [active]);
  const currentDuration = active || status === 'completed' ? session.duracao : duration;
  const remaining = active ? remainingFromServer(server, snapshot?.receivedAt, now)
    : status === 'completed' ? 0 : duration * 60;
  const progress = status === 'completed' ? 100
    : clampPosition(Math.round((1 - remaining / (currentDuration * 60)) * 100), 0, 100);
  const animarTenna = deveAnimarTenna(status, decorate, remaining);
  const seeds = server?.sementes ?? 0;
  const validSessions = server?.sessoesValidas ?? 0;
  const focusMinutes = Math.floor((server?.tempoTotalSegundos ?? 0) / 60);
  const jornadaReal = construirJornada(server);
  const previaLiberada = SALAS_LIBERADAS_PARA_PREVIA && modoTeste;
  // Apenas apresentação: o servidor continua mantendo os desbloqueios verdadeiros.
  const jornada = previaLiberada ? {
    ...jornadaReal,
    segundaConquistada: true,
    terceiraConquistada: true,
    totalConquistadas: 3,
    salas: jornadaReal.salas.map((sala) => ({
      ...sala, conquistada: true,
      jogavel: true,
      estado: 'conquistada',
    })),
  } : jornadaReal;
  const sessionsUntilNextRoom = jornadaReal.faltam;
  const roomDetail = jornada.salas.find((room) => room.numero === selectedRoom) || jornada.salas[0];
  const salasDoMapa = salasVisiveisNoMapa(jornada.salas, decorate, selectedRoom);
  // Os botões continuam mostrando todas as salas liberadas, mesmo quando só
  // uma delas é renderizada no modo foco. No modo decorar, incluem bloqueadas.
  const salasParaNavegacao = jornada.salas.filter((sala) => decorate || sala.conquistada);
  const formatoDoMapa = formatoMapa(salasDoMapa);

  // Centraliza a sala escolhida sem rolar a página inteira; há navegação
  // por botões, mouse, rolagem e toque (inclusive nas telas pequenas).
  useEffect(() => {
    const viewport = viewportRef.current;
    const sala = salasRefs.current[selectedRoom];
    if (!viewport || !sala) return;
    const margemEsquerda = sala.offsetLeft + sala.offsetWidth / 2 - viewport.clientWidth / 2;
    const margemSuperior = sala.offsetTop + sala.offsetHeight / 2 - viewport.clientHeight / 2;
    viewport.scrollTo({
      left: Math.max(0, margemEsquerda),
      top: Math.max(0, margemSuperior),
      behavior: 'auto',
    });
  }, [selectedRoom, formatoDoMapa, jornada.totalConquistadas]);

  function alternarDecoracao() {
    // Durante uma sessão ativa, o cronômetro não deve ficar atrás do editor.
    if (active && !decorate) return;
    // Entrar no modo decoração não deve voltar à Sala 1 quando o usuário
    // está organizando a Sala 2 ou a Sala 3.
    setDecorate((atual) => !atual);
    if (decorate && !roomDetail.conquistada) setSelectedRoom(1);
    setDrag(null);
  }

  // A personalização se comporta como uma janela modal: bloqueia o scroll da
  // página, recebe o foco e pode ser fechada por Escape sem perder posições.
  useEffect(() => {
    if (!decorate) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    decorCloseRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDecorate(false);
        setDrag(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const container = decorDialogRef.current;
      if (!container) return;
      const focusables = [...container.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')]
        .filter((node) => node.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
  }, [decorate]);

  function iniciarNavegacao(evt) {
    if (evt.pointerType !== 'mouse' || evt.button !== 0 || evt.target.closest('button, a, input, select')) return;
    const viewport = evt.currentTarget;
    panRef.current = {
      id: evt.pointerId, x: evt.clientX, y: evt.clientY,
      esquerda: viewport.scrollLeft, cima: viewport.scrollTop,
    };
    viewport.setPointerCapture(evt.pointerId);
  }
  function moverNavegacao(evt) {
    const ponto = panRef.current;
    if (!ponto || ponto.id !== evt.pointerId) return;
    const viewport = evt.currentTarget;
    viewport.scrollLeft = ponto.esquerda - (evt.clientX - ponto.x);
    viewport.scrollTop = ponto.cima - (evt.clientY - ponto.y);
  }
  function terminarNavegacao(evt) {
    if (panRef.current?.id !== evt.pointerId) return;
    panRef.current = null;
    if (evt.currentTarget.hasPointerCapture(evt.pointerId)) evt.currentTarget.releasePointerCapture(evt.pointerId);
  }

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
    // Garantia extra: toda ação do cronômetro mantém o foco acessível, mesmo
    // quando a pessoa acabou de sair da edição ou recarregou a página.
    if (action === 'iniciar' || action === 'continuar') setDecorate(false);
    busyRef.current = true;
    setBusy(true);
    setConfirmCancel(false);
    setError('');
    const sequence = ++sequenceRef.current;
    try {
      const path = action === 'iniciar' ? '/terrario/foco/iniciar' : `/terrario/foco/${session.id}/${action}`;
      const body = action === 'iniciar' ? {
        materia,
        duracao: duration
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
    setDuration(session.duracao);
    setNotice('');
    try { localStorage.setItem(seenKey(), String(session.id)); } catch { /* Opcional */ }
  }

  // O modo de teste é uma cópia independente do inventário, guardada apenas no navegador.
  // Nenhuma decoração de teste gasta sementes, compra itens nem grava no servidor.
  const ownedInventory = useMemo(() => server?.inventario || [], [server]);
  // Acervo de estudo antigo: usuários que já compraram conservam seus móveis.
  // Enquanto a Sala 2 estiver bloqueada, permanecem na Sala 1; depois migram
  // visualmente para a Sala 2, sem alterar nenhum dado persistido na conta.
  const { sala1: catalogoSala1, sala2: catalogoSala2, salaPorId } = useMemo(
    () => distribuirMoveis(ITEMS, ITEMS_SALA2, ownedInventory, jornada.segundaConquistada),
    [ownedInventory, jornada.segundaConquistada]
  );
  // Protótipos antigos da Sala 3 só permanecem disponíveis para quem já os comprou.
  const catalogoSala3 = useMemo(() => [
    ...ITEMS_SALA3,
    ...ITEMS_SALA3_LEGADOS.filter((item) => ownedInventory.some((owned) => owned.id === item.id)),
  ], [ownedInventory]);
  const itensDaSala = (numero) => numero === 3 ? catalogoSala3 : numero === 2 ? catalogoSala2 : catalogoSala1;
  const salaSelecionadaPodeDecorar = selectedRoom === 1 || ((selectedRoom === 2 || selectedRoom === 3) && roomDetail.conquistada);
  const totalItensSalaSelecionada = itensDaSala(selectedRoom).length;
  const tituloCatalogo = selectedRoom === 1 ? 'Catálogo do Ninho Inicial' : `Catálogo · ${roomDetail.nome}`;
  const resumoCatalogo = selectedRoom === 1
    ? 'Itens aconchegantes para montar o primeiro cantinho da Tenna.'
    : roomDetail.conquistada
      ? totalItensSalaSelecionada === 1 ? 'Conheça o primeiro móvel exclusivo desta sala.' : `Veja os ${totalItensSalaSelecionada} itens exclusivos desta sala.`
      : 'Continue estudando para desbloquear a decoração desta sala.';
  const salaDoItem = (id) => {
    if (id.startsWith('s3_')) return 3;
    return salaPorId[id] ?? (ehMovelDeEstudoAntigo(id)
      ? (jornada.segundaConquistada ? 2 : 1) : id.startsWith('s2_') ? 2 : 1);
  };
  const decorOficial = useMemo(() => baseTeste(catalogoSala1, ownedInventory), [catalogoSala1, ownedInventory]);
  const decorOficial2 = useMemo(() => baseTeste(catalogoSala2, ownedInventory), [catalogoSala2, ownedInventory]);
  const decorOficial3 = useMemo(() => baseTeste(catalogoSala3, ownedInventory), [catalogoSala3, ownedInventory]);
  // Testes de versões anteriores podem não ter todas as posições. Preenche-se
  // somente o que estiver ausente, sem sobrescrever a decoração do usuário.
  // Na primeira prévia, o novo guarda-roupa já aparece na parede da Sala 1.
  // Depois de personalizar, o estado salvo é respeitado (inclusive se for guardado).
  const decorTeste = testeSalvo.iniciado ? {
    ...decorOficial, ...testeSalvo,
    positions: { ...decorOficial.positions, ...testeSalvo.positions },
    scales: { ...decorOficial.scales, ...testeSalvo.scales }
  } : { ...decorOficial, visible: [...new Set([...decorOficial.visible, 'guarda_roupa'])] };
  const decorTeste2 = testeSalvo2.iniciado ? {
    ...decorOficial2, ...testeSalvo2,
    positions: { ...decorOficial2.positions, ...testeSalvo2.positions },
    scales: { ...decorOficial2.scales, ...testeSalvo2.scales }
  } : decorOficial2;
  const decorTeste3 = testeSalvo3.iniciado ? {
    ...decorOficial3, ...testeSalvo3,
    positions: { ...decorOficial3.positions, ...testeSalvo3.positions },
    scales: { ...decorOficial3.scales, ...testeSalvo3.scales }
  } : { ...decorOficial3, visible: ITEMS_SALA3.map((item) => item.id) };
  const decorSala1 = modoTeste ? decorTeste : decorOficial;
  const decorSala2 = modoTeste ? decorTeste2 : decorOficial2;
  const decorSala3 = modoTeste ? decorTeste3 : decorOficial3;
  const decor = selectedRoom === 3 ? decorSala3 : selectedRoom === 2 ? decorSala2 : decorSala1;
  useEffect(() => {
    if (!testeSalvo.iniciado) return;
    try { localStorage.setItem(chaveTeste, JSON.stringify({ visible: testeSalvo.visible, positions: testeSalvo.positions, scales: testeSalvo.scales })); }
    catch { /* O preview funciona também se o navegador bloquear armazenamento local. */ }
  }, [chaveTeste, testeSalvo]);
  useEffect(() => {
    if (!testeSalvo2.iniciado) return;
    try { localStorage.setItem(chaveTeste2, JSON.stringify({ visible: testeSalvo2.visible, positions: testeSalvo2.positions, scales: testeSalvo2.scales, layoutV3: true, layoutV4: true })); }
    catch { /* O teste continua disponível mesmo sem armazenamento. */ }
  }, [chaveTeste2, testeSalvo2]);
  useEffect(() => {
    if (!testeSalvo3.iniciado) return;
    try { localStorage.setItem(chaveTeste3, JSON.stringify({ visible: testeSalvo3.visible, positions: testeSalvo3.positions, scales: testeSalvo3.scales, layoutSala3Completo: true })); }
    catch { /* O teste continua disponível mesmo sem armazenamento. */ }
  }, [chaveTeste3, testeSalvo3]);
  const atualizarTeste = (fn) => setTesteSalvo((atual) => {
    const base = baseTeste(catalogoSala1, ownedInventory);
    const estadoAtual = atual.iniciado ? {
      ...base, ...atual,
      positions: { ...base.positions, ...atual.positions },
      scales: { ...base.scales, ...atual.scales }
    } : { ...base, visible: [...new Set([...base.visible, 'guarda_roupa'])] };
    return fn(estadoAtual);
  });
  const atualizarTeste2 = (fn) => setTesteSalvo2((atual) => fn(atual.iniciado ? {
    ...baseTeste(catalogoSala2, ownedInventory), ...atual,
    positions: { ...baseTeste(catalogoSala2, ownedInventory).positions, ...atual.positions },
    scales: { ...baseTeste(catalogoSala2, ownedInventory).scales, ...atual.scales }
  } : baseTeste(catalogoSala2, ownedInventory)));
  const atualizarTeste3 = (fn) => setTesteSalvo3((atual) => fn(atual.iniciado ? {
    ...baseTeste(catalogoSala3, ownedInventory), ...atual,
    positions: { ...baseTeste(catalogoSala3, ownedInventory).positions, ...atual.positions },
    scales: { ...baseTeste(catalogoSala3, ownedInventory).scales, ...atual.scales }
  } : prepararPreviaCompletaSala3(baseTeste(catalogoSala3, ownedInventory), ITEMS_SALA3)));
  const atualizarSalaDeTeste = (id, fn) => salaDoItem(id) === 3 ? atualizarTeste3(fn) : salaDoItem(id) === 2 ? atualizarTeste2(fn) : atualizarTeste(fn);
  const decorDoItem = (id) => salaDoItem(id) === 3 ? decorSala3 : salaDoItem(id) === 2 ? decorSala2 : decorSala1;
  const selectedItem = TODOS_ITENS.find((item) => item.id === selected) || ITEMS[0];
  const isOwned = (id) => {
    const sala = salaDoItem(id);
    return (sala === 1 || (sala === 2 && jornada.segundaConquistada) || (sala === 3 && jornada.terceiraConquistada))
      && (modoTeste || ownedInventory.some((item) => item.id === id));
  };
  const selectedVisible = itensDaSala(selectedRoom).some((item) => item.id === selected)
    && salaDoItem(selected) === selectedRoom && isOwned(selected) && decor.visible.includes(selected);
  const selectedScale = scalePreview?.id === selected ? scalePreview.scale : ajustarEscala(decor.scales?.[selected] ?? 1);
  const canAttachWall = !!posicaoEncostada(selected);
  const roomItems = catalogoSala1.filter((item) => decorSala1.visible.includes(item.id));
  const roomItems2 = catalogoSala2.filter((item) => decorSala2.visible.includes(item.id));
  const roomItems3 = catalogoSala3.filter((item) => decorSala3.visible.includes(item.id));
  const sortedItems = [...roomItems].sort((a, b) => decorSala1.positions[a.id].y - decorSala1.positions[b.id].y);
  const sortedItems2 = [...roomItems2].sort((a, b) => decorSala2.positions[a.id].y - decorSala2.positions[b.id].y);
  const sortedItems3 = [...roomItems3].sort((a, b) => decorSala3.positions[a.id].y - decorSala3.positions[b.id].y);

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
    if ((salaDoItem(item.id) === 2 && !jornada.segundaConquistada) || (salaDoItem(item.id) === 3 && !jornada.terceiraConquistada)) return;
    if (modoTeste) { guardarOuColocar(item); return; }
    setSelected(item.id);
    void sendDecorAction(`/terrario/loja/${item.id}/comprar`, { method: 'POST' },
      `${item.name} comprado! Agora você pode colocá-lo na Sala ${salaDoItem(item.id)}.`);
  }

  function guardarOuColocar(item) {
    if ((salaDoItem(item.id) === 2 && !jornada.segundaConquistada) || (salaDoItem(item.id) === 3 && !jornada.terceiraConquistada)) return;
    const colocar = !decorDoItem(item.id).visible.includes(item.id);
    setSelected(item.id);
    if (modoTeste) {
      atualizarSalaDeTeste(item.id, (atual) => alternarItemTeste(atual, item.id));
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
      atualizarSalaDeTeste(id, (atual) => moverItemTeste(atual, id, point, itensDaSala(salaDoItem(id))));
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
      atualizarSalaDeTeste(id, (atual) => redimensionarItemTeste(atual, id, escala, itensDaSala(salaDoItem(id))));
      return;
    }
    const item = TODOS_ITENS.find((i) => i.id === id);
    const ponto = item ? posicionarItemNaZona(decorDoItem(id).positions[id], item, escala) : null;
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
    void moverItem(item.id, posicionarItemNaZona(ponto, item, decorDoItem(item.id).scales?.[item.id] ?? 1));
  }

  // Ações da prévia disponíveis dentro do próprio editor, sem precisar sair
  // da janela para preencher ou limpar a sala que está sendo decorada.
  function preencherSalaTeste() {
    const update = selectedRoom === 3 ? atualizarTeste3 : selectedRoom === 2 ? atualizarTeste2 : atualizarTeste;
    update((atual) => selectedRoom === 3 ? montarAmbienteSala3(atual, ITEMS_SALA3) : ({
      ...atual,
      iniciado: true,
      visible: selectedRoom === 2 ? [...DESTAQUES_SALA2] : itensDaSala(selectedRoom).map((item) => item.id),
      ...(selectedRoom === 2 ? {
        positions: Object.fromEntries(ITEMS_SALA2.map((item) => [item.id, { x: item.x, y: item.y }])),
        layoutV3: true, layoutV4: true,
      } : {}),
    }));
    setDecorate(true);
  }

  function limparSalaTeste() {
    (selectedRoom === 3 ? atualizarTeste3 : selectedRoom === 2 ? atualizarTeste2 : atualizarTeste)(
      (atual) => ({ ...atual, iniciado: true, visible: [] })
    );
    setDrag(null);
  }

  function startDragging(evt, itemId) {
    if (!(decorate || (modoTeste && salaDoItem(itemId) === 3)) || (busy && !modoTeste) || !isOwned(itemId) || (selectedRoom !== salaDoItem(itemId) && !(modoTeste && salaDoItem(itemId) === 3)) || evt.button !== 0) return;
    evt.preventDefault();
    evt.currentTarget.setPointerCapture(evt.pointerId);
    draggingRef.current = {
      id: itemId, pointerId: evt.pointerId,
      startX: evt.clientX, startY: evt.clientY,
      original: { ...decorDoItem(itemId).positions[itemId] }, moved: false
    };
    setSelected(itemId);
  }
  function pointForDrag(track, evt) {
    const bounds = (salaDoItem(track.id) === 3 ? stageRef3.current : salaDoItem(track.id) === 2 ? stageRef2.current : stageRef.current)?.getBoundingClientRect();
    if (!bounds) return null;
    return moverComDeslocamento(track.original,
      evt.clientX - track.startX, evt.clientY - track.startY,
      bounds.width, bounds.height, limitesParaItem(TODOS_ITENS.find((item) => item.id === track.id), decorDoItem(track.id).scales?.[track.id] ?? 1));
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
    if (!(decorate || (modoTeste && salaDoItem(item.id) === 3)) || (busy && !modoTeste) || !isOwned(item.id) || (selectedRoom !== salaDoItem(item.id) && !(modoTeste && salaDoItem(item.id) === 3))) return;
    const moves = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] };
    const movement = moves[evt.key];
    if (!movement) return;
    evt.preventDefault();
    const itemDecor = decorDoItem(item.id);
    const pos = itemDecor.positions[item.id];
    void moverItem(item.id, posicionarItemNaZona({ x: pos.x + movement[0], y: pos.y + movement[1] }, item, itemDecor.scales?.[item.id] ?? 1));
  }

  return (
    <main className={`terr-page ${status === 'running' ? 'is-focusing' : ''} ${decorate ? 'is-decorating' : ''}`}>
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
      {decorate && <div className="terr-decor-backdrop" aria-hidden="true" onClick={alternarDecoracao} />}
      <div className={decorate ? 'terr-decor-dialog' : 'terr-main-content'}
        ref={decorDialogRef} role={decorate ? 'dialog' : undefined}
        aria-modal={decorate ? 'true' : undefined}
        aria-labelledby={decorate ? 'terr-decor-dialog-title' : undefined}>
        {decorate && (
          <header className="terr-decor-dialog-header">
            <div>
              <span className="terr-kicker">PERSONALIZE SEU FORMIGUEIRO</span>
              <h2 id="terr-decor-dialog-title">Meu cantinho, meu jeito</h2>
              <p>Escolha a sala, arraste os móveis e monte o seu ambiente.</p>
            </div>
            <div className="terr-decor-header-actions">
              <button type="button" className="terr-decor-to-focus" onClick={() => { setDecorate(false); setDrag(null); }}>
                ◷ Ir para o foco
              </button>
              <button type="button" className="terr-decor-close" ref={decorCloseRef} onClick={alternarDecoracao}>
                ✓ Concluir decoração
              </button>
            </div>
          </header>
        )}
      <div className="terr-layout">
        <section className="terr-scene-card" aria-labelledby="terr-scene-title">
          <div className="terr-scene-topbar">
            <div className="terr-scene-heading"><span className="terr-kicker">SEU FORMIGUEIRO · {decorate ? 'MODO DE PERSONALIZAÇÃO' : status === 'running' ? 'MODO FOCO' : 'MODO DE VISUALIZAÇÃO'}</span><h2 id="terr-scene-title">{decorate ? 'Decore seu formigueiro' : 'O cantinho da Tenna'}</h2><p>{decorate ? 'Veja as três salas juntas e organize os móveis do seu formigueiro.' : status === 'running' ? 'Uma sala por vez, cronômetro ativo e menos distrações na tela.' : 'Escolha uma sala para visualizar o seu cantinho com a Tenna.'}</p></div>
            <div className="terr-scene-actions">
              <span className={`terr-status ${status === 'running' ? 'is-working' : ''}`}><span />{status === 'running' ? 'Tenna focada' : status === 'paused' ? 'Foco pausado' : 'Tenna em casa'}</span>
              <button type="button" className={`terr-decorate-button ${decorate ? 'active' : ''}`} onClick={alternarDecoracao} disabled={status === 'running' || (!modoTeste && (busy || loading))} aria-pressed={decorate}>
                {decorate ? '✓ Terminar decoração' : '✦ Decorar sala'}
              </button>
            </div>
          </div>
          {decorate && roomDetail.conquistada && selectedVisible && (
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
            <div className="terr-world-toolbar" aria-label="Navegação do formigueiro">
              <span className="terr-world-hint">{decorate ? '↔ Explore o formigueiro completo e selecione uma sala para decorar' : modoTeste && selectedRoom === 3 ? 'Sala 3 · Arraste os móveis; use “Decorar sala” para mudar o tamanho' : 'Uma sala por vez · escolha a sala nos botões ao lado'}</span>
              <div className="terr-world-room-buttons" role="group" aria-label="Escolher uma sala do formigueiro">
                {salasParaNavegacao.map((sala) => (
                  <button key={sala.numero} type="button"
                    className={selectedRoom === sala.numero ? 'active' : ''}
                    onClick={() => setSelectedRoom(sala.numero)} aria-pressed={selectedRoom === sala.numero}>
                    {previaLiberada ? '👁' : sala.conquistada ? '◉' : '🔒'} Sala {sala.numero}
                  </button>
                ))}
              </div>
            </div>
            <div className={`terr-world-viewport is-${formatoDoMapa}`}
              tabIndex={0} role="region" aria-label={decorate ? 'Mapa do formigueiro para decoração' : `Sala ${selectedRoom} do formigueiro`}
              ref={viewportRef} onPointerDown={iniciarNavegacao}
              onPointerMove={moverNavegacao} onPointerUp={terminarNavegacao}
              onPointerCancel={terminarNavegacao}>
              <div className={`terr-world-board is-${formatoDoMapa}`}>
                {salasDoMapa.map((sala) => (
                  <section key={sala.numero}
                    ref={(elemento) => { salasRefs.current[sala.numero] = elemento; }}
                    className={`terr-world-room terr-world-room-${sala.numero} ${sala.conquistada ? 'is-unlocked' : 'is-locked'} ${selectedRoom === sala.numero ? 'is-current' : ''}`}
                    aria-label={`Sala ${sala.numero}, ${sala.nome}: ${sala.conquistada ? 'liberada' : 'bloqueada'}`}>
                    <div className="terr-world-room-heading">
                      <span>SALA {String(sala.numero).padStart(2, '0')} · {sala.nome}</span>
                      <span>{previaLiberada ? '👁 Prévia' : sala.conquistada ? '✓ Liberada' : '🔒 Bloqueada'}</span>
                    </div>
                    {sala.numero === 1 ? (
                      <div className={`terr-scene ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef}>
                        <img className="terr-scene-background" src={salaImg} alt="Ninho subterrâneo com raízes e espaço para decoração" draggable="false" />
                        <div className="terr-scene-story" aria-hidden="true">{status === 'running' ? 'Shhh... a Tenna está estudando!' : status === 'completed' ? 'Boa! Mais uma sessão concluída!' : status === 'paused' ? 'Descansar também faz parte!' : 'Nosso primeiro cantinho 🌱'}</div>
                        {sortedItems.map((item) => {
                          const pos = drag?.id === item.id ? drag : decorSala1.positions[item.id];
                          return (
                            <button type="button" key={item.id}
                              className={`terr-scene-item ${decorate ? 'movable' : ''} ${selected === item.id && decorate ? 'selected' : ''}`}
                              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${item.width * (scalePreview?.id === item.id ? scalePreview.scale : ajustarEscala(decorSala1.scales?.[item.id] ?? 1))}%`, zIndex: item.zone === 'parede' || item.zone === 'pendurado' ? 12 : item.zone === 'tapete' ? 14 : Math.round(pos.y) }}
                              onPointerDown={(evt) => startDragging(evt, item.id)} onPointerMove={moveDragging}
                              onPointerUp={finishDragging} onPointerCancel={finishDragging}
                              onKeyDown={(evt) => updateWithKeyboard(evt, item)} onClick={() => setSelected(item.id)}
                              aria-label={`${item.name}${decorate ? ', arraste ou use as setas para reposicionar' : ''}`}
                              title={decorate ? `Mover ${item.name}` : item.name}>
                              <img src={item.img} alt="" draggable="false" />
                            </button>
                          );
                        })}
                        <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        {active && <div className="terr-inroom-timer" role="timer">{status === 'paused' ? 'Pausa' : 'Foco'} · {formatTime(remaining)}</div>}
                        {decorate && <div className="terr-decor-hint">{modoTeste ? 'TESTE LIVRE · ' : ''}Toque em um móvel para ajustar o tamanho. Arraste ou use as setas para mover</div>}
                      </div>
                    ) : sala.numero === 2 && sala.conquistada ? (
                      <div className={`terr-scene terr-scene-empty ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef2} aria-label="Sala 2 — Refúgio do Conhecimento">
                        <img className="terr-scene-background" src={salaImg} alt="Câmara de terra e raízes pronta para seus novos móveis" loading="lazy" draggable="false" />
                        {sortedItems2.map((item) => {
                          const pos = drag?.id === item.id ? drag : decorSala2.positions[item.id];
                          return (
                            <button type="button" key={item.id}
                              className={`terr-scene-item terr-sala2-item ${decorate && selectedRoom === 2 ? 'movable' : ''} ${selected === item.id && decorate && selectedRoom === 2 ? 'selected' : ''}`} data-zona={item.zone} data-item-id={item.id}
                              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${item.width * (scalePreview?.id === item.id ? scalePreview.scale : ajustarEscala(decorSala2.scales?.[item.id] ?? 1))}%`, zIndex: item.zone === 'parede' || item.zone === 'pendurado' ? 12 : item.zone === 'tapete' ? 14 : Math.round(pos.y) }}
                              onPointerDown={(evt) => startDragging(evt, item.id)} onPointerMove={moveDragging}
                              onPointerUp={finishDragging} onPointerCancel={finishDragging}
                              onKeyDown={(evt) => updateWithKeyboard(evt, item)} onClick={() => { setSelectedRoom(2); setSelected(item.id); }}
                              aria-label={`${item.name}${decorate ? ', arraste ou use as setas para reposicionar' : ''}`}
                              title={decorate ? `Mover ${item.name}` : item.name}>
                              <img src={item.img} alt="" draggable="false" />
                            </button>
                          );
                        })}
                        <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        {roomItems2.length === 0 && <span className="terr-empty-room-message">Um novo cantinho para construir 🌱</span>}
                        {decorate && selectedRoom === 2 && <div className="terr-decor-hint">{modoTeste ? 'TESTE LIVRE · ' : ''}Arraste os móveis ou use as setas para mover</div>}
                      </div>
                    ) : sala.numero === 3 && sala.conquistada ? (
                      <div className={`terr-scene terr-scene-empty ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef3} aria-label="Sala 3 — Sala do Desafio Final">
                        <img className="terr-scene-background" src={salaImg} alt="Câmara de terra e raízes da sala do vestibulinho" loading="lazy" draggable="false" />
                        <div className="terr-scene-story" aria-hidden="true">Teto fechado · a abertura virá na conquista final</div>
                        {sortedItems3.map((item) => {
                          const pos = drag?.id === item.id ? drag : decorSala3.positions[item.id];
                          return (
                            <button type="button" key={item.id}
                              data-item-id={item.id} data-zona={item.zone}
                              className={`terr-scene-item ${((decorate && selectedRoom === 3) || modoTeste) ? 'movable' : ''} ${selected === item.id && decorate && selectedRoom === 3 ? 'selected' : ''}`}
                              style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${item.width * (scalePreview?.id === item.id ? scalePreview.scale : ajustarEscala(decorSala3.scales?.[item.id] ?? 1))}%`, zIndex: item.id === 's3_kit' ? 86 : item.zone === 'parede' || item.zone === 'pendurado' ? 12 : item.zone === 'tapete' ? 14 : Math.round(pos.y) }}
                              onPointerDown={(evt) => startDragging(evt, item.id)} onPointerMove={moveDragging}
                              onPointerUp={finishDragging} onPointerCancel={finishDragging}
                              onKeyDown={(evt) => updateWithKeyboard(evt, item)} onClick={() => { setSelectedRoom(3); setSelected(item.id); }}
                              aria-label={`${item.name}${(decorate || modoTeste) ? ', arraste ou use as setas para reposicionar' : ''}`}
                              title={(decorate || modoTeste) ? `Mover ${item.name}` : item.name}>
                              <img src={item.img} alt="" draggable="false" />
                            </button>
                          );
                        })}
                        <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        {roomItems3.length === 0 && <span className="terr-empty-room-message">Escolha os móveis para montar sua sala de prova 📝</span>}
                        {decorate && selectedRoom === 3 && <div className="terr-decor-hint">{modoTeste ? 'TESTE LIVRE · ' : ''}Arraste os móveis ou use as setas para mover</div>}
                      </div>
                    ) : (
                      <div className={`terr-world-preview ${sala.conquistada ? 'is-unlocked' : 'is-locked'}`}>
                        <img src={salaImg} alt="" loading="lazy" draggable="false" />
                        {sala.numero === 3 && <span className="terr-world-roof">Teto fechado</span>}
                        <div className="terr-world-gate">
                          <span className="terr-world-gate-symbol" aria-hidden="true">{sala.conquistada ? '👁' : '🔒'}</span>
                          <strong>{sala.nome}</strong>
                          <small>{sala.numero === 2 ? `Faltam ${jornadaReal.faltamSala2} sessões válidas para liberar` : `Faltam ${jornadaReal.faltamSala3} sessões válidas para liberar`}</small>
                        </div>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
            <p className="terr-world-footnote">{decorate ? (previaLiberada ? 'Modo de teste: o mapa mostra as três salas e permite decorar sem gastar sementes.' : 'Modo decoração: o formigueiro aparece completo; salas bloqueadas podem ser visualizadas, mas não decoradas.') : (previaLiberada ? 'Modo de teste: escolha Sala 1, 2 ou 3 para visualizar uma de cada vez. Use Decorar sala para ver o formigueiro completo.' : 'Modo visualização: somente a sala selecionada aparece. A Tenna se anima ao iniciar uma sessão de foco.')}</p>
          </div>
          <div className="terr-scene-bottom">
            <div className="terr-room-journey"><span className="terr-chapter-mark" aria-hidden="true">✦</span><div className="terr-journey-copy"><span>PRÓXIMA SALA</span><strong>{jornada.terceiraConquistada ? 'Todas as salas liberadas' : jornada.segundaConquistada ? 'Sala do Desafio Final' : 'Refúgio do Conhecimento'}</strong><small>{previaLiberada ? 'Disponível para experimentar no modo de teste.' : jornada.terceiraConquistada ? 'As três salas já foram conquistadas.' : jornada.segundaConquistada ? `Faltam ${jornada.faltamSala3} sessões válidas para liberar a Sala 3` : `Faltam ${sessionsUntilNextRoom} sessões válidas para liberar`}</small></div></div>
            <div className="terr-room-progress"><div><span>{jornada.progresso} de {jornada.objetivo} sessões</span><strong>{jornada.percentual}%</strong></div><div className="terr-progress-track"><span style={{ width: `${jornada.percentual}%` }}/></div></div>
          </div>
        </section>

        <aside className="terr-sidebar">
          <section className="terr-sidecard terr-timer-card" aria-labelledby="terr-timer-heading">
            <span className="terr-kicker">ESTUDE COM A TENNA</span>
            <h2 id="terr-timer-heading">Hora do foco</h2>
            <p>Sem seleção de matéria: escolha só o tempo e comece. O cronômetro salva o andamento da sessão. Você pode pausar e retomar quando precisar.</p>
            <div className="terr-timer-clock" style={{ '--progress': `${progress}%` }} role="timer" aria-label={`Restam ${formatTime(remaining)}`}>
              <div className="terr-timer-inner"><strong>{formatTime(remaining)}</strong><span>{loading ? 'CARREGANDO' : busy ? 'ATUALIZANDO' : status === 'running' ? 'FOCANDO' : status === 'paused' ? 'EM PAUSA' : status === 'completed' ? 'CONCLUÍDO!' : 'PRONTO PARA COMEÇAR'}</span></div>
            </div>
            <div className="terr-focus-ritual" aria-label="Preparação rápida para o foco">
              <strong>Antes de começar</strong>
              <ul>
                <li>Deixe apenas o material necessário aberto.</li>
                <li>Silencie notificações e distrações.</li>
                <li>Use a Tenna como companhia e foque até o fim do tempo.</li>
              </ul>
            </div>
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

      {!decorate && (
      <section className="terr-overview-grid" aria-label="Resumo do foco e da sala">
        <article className="terr-overview-card">
          <div className="terr-overview-head">
            <div>
              <span className="terr-kicker">SALA ATUAL</span>
              <h3>{roomDetail.nome}</h3>
            </div>
            <span className="terr-overview-badge">Sala {roomDetail.numero}</span>
          </div>
          <p>{roomDetail.descricao}</p>
          <div className="terr-overview-progress">
            <div><span>Progresso da jornada</span><strong>{jornada.percentual}%</strong></div>
            <div className="terr-progress-track"><span style={{ width: `${jornada.percentual}%` }} /></div>
            {!jornada.terceiraConquistada && <small>{jornada.segundaConquistada ? `Faltam ${jornada.faltamSala3} sessões válidas para a Sala 3.` : `Faltam ${sessionsUntilNextRoom} sessões válidas para liberar a próxima sala.`}</small>}
          </div>
        </article>
        <article className="terr-overview-card terr-overview-card-focus">
          <div className="terr-overview-head">
            <div>
              <span className="terr-kicker">PERSONALIZAÇÃO</span>
              <h3>{tituloCatalogo}</h3>
            </div>
            <span className="terr-overview-badge">{salaSelecionadaPodeDecorar ? `${totalItensSalaSelecionada} itens` : 'Bloqueado'}</span>
          </div>
          <p>{resumoCatalogo}</p>
          <div className="terr-overview-actions">
            <button type="button" className="terr-decorate-button" onClick={() => { if (salaSelecionadaPodeDecorar) setDecorate(true); }}>
              {salaSelecionadaPodeDecorar ? 'Abrir catálogo' : 'Continuar jornada'}
            </button>
          </div>
        </article>
      </section>

      )}

      {decorate && (
      <section className="terr-inventory" aria-labelledby="terr-inventory-heading">
        <div className="terr-inventory-header"><div>
          <span className="terr-kicker">SALA {String(selectedRoom).padStart(2, '0')} · PERSONALIZAÇÃO</span>
          <h2 id="terr-inventory-heading">{selectedRoom === 1 ? 'Crie seu cantinho' : roomDetail.nome}</h2>
          <p>{selectedRoom === 1
            ? (modoTeste ? 'Decore o Ninho Inicial livremente no modo de teste.' : 'Compre móveis aconchegantes e salve a decoração na sua conta.')
            : roomDetail.conquistada
              ? (modoTeste ? `Experimente os ${totalItensSalaSelecionada} itens desta sala sem gastar sementes.` : 'Escolha e organize os móveis exclusivos desta sala.')
              : 'Esta sala ainda está bloqueada. Continue estudando para avançar na jornada.'}</p>
        </div><span className="terr-inventory-balance">{modoTeste && roomDetail.conquistada ? `✦ ${totalItensSalaSelecionada} itens para testes` : `🌱 ${seeds} sementes`}</span></div>
        {modoTeste && salaSelecionadaPodeDecorar && (
          <div className="terr-decor-quick-actions" aria-label="Ferramentas de teste da sala">
            <button type="button" onClick={preencherSalaTeste}>{selectedRoom === 1 ? 'Preencher sala' : 'Montar ambiente'}</button>
            <button type="button" onClick={limparSalaTeste}>Limpar sala</button>
          </div>
        )}
        {salaSelecionadaPodeDecorar ? <>
        <div className="terr-items-grid">
          {itensDaSala(selectedRoom).map((item) => {
            const itemOwned = isOwned(item.id);
            const visible = decor.visible.includes(item.id);
            return (
              <article key={item.id} className={`terr-item-card ${selected === item.id ? 'active' : ''} ${itemOwned ? 'is-owned' : ''} ${visible ? 'is-placed' : ''}`}>
                <button type="button" className="terr-item-preview" onClick={() => { setSelected(item.id); if (itemOwned) { setSelectedRoom(salaDoItem(item.id)); setDecorate(true); } }} aria-label={`Selecionar ${item.name}`}><img src={item.img} alt="" loading="lazy"/></button>
                <div className="terr-item-desc"><strong>{item.name}</strong><small>{ehMovelDeEstudoAntigo(item.id) ? 'Item preservado de versões anteriores' : item.subtitle}</small></div>
                <div className="terr-item-bottom"><span className={itemOwned ? 'terr-owned-label' : 'terr-cost-label'}>{ehMovelDeEstudoAntigo(item.id) ? '✓ Item preservado' : modoTeste ? '✦ Teste grátis' : itemOwned ? '✓ Desbloqueado' : `🌱 ${item.price}`}</span>
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
          <span role="status">{selectedVisible ? `${selectedItem.name}: arraste, use as setas e ajuste o tamanho no painel acima do cenário.` : modoTeste ? 'Teste à vontade: os itens desta sala ficam apenas neste navegador.' : 'Compre com sementes e salve a organização da sua sala.'}</span>
          <button type="button" onClick={alternarDecoracao}>Concluir decoração</button>
        </div>
        </> : <div className="terr-inventory-empty">
          <span aria-hidden="true">{roomDetail.conquistada ? '🌱' : '🔒'}</span>
          <strong>{roomDetail.conquistada ? 'Sua sala começa vazia' : 'Sala bloqueada'}</strong>
          <p>{roomDetail.conquistada ? 'Esta sala possui um catálogo próprio e você poderá organizá-la quando estiver disponível neste fluxo.' : 'A decoração ficará disponível quando esta sala for desbloqueada.'}</p>
          <button type="button" className="terr-secondary" onClick={() => { setSelectedRoom(1); setDecorate(false); }}>Voltar ao foco</button>
        </div>}
      </section>
      )}
      </div>
    </main>
  );
}
