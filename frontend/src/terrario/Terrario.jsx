import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGamification } from '../context/GamificationShared.js';
import { obterToken, request } from '../services/api.js';
import { remainingFromServer } from './focusClock.js';
import { deveAnimarTenna } from './comportamentoFoco.js';
import { moverComDeslocamento, passouDoLimiteArrasto, clampPosition } from './dragPosition.js';
import { construirJornada } from './jornada.js';
import { salasVisiveisNoMapa, formatoMapa } from './mapaSalas.js';
import { mensagemErroTerrario, validarEstadoTerrario } from './terrarioErrors.js';
import GuiaTerrario, { chaveGuiaTerrario } from './GuiaTerrario.jsx';
import './Terrario.css';
import sementeTerrario from './assets/semente-terrario.png';

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

// Os IDs e as compras anteriores são preservados; os preços foram adaptados a 2 sementes por 15 min.
// As coordenadas são percentuais da imagem original, não da janela do usuário.
const ITEMS = [
  { id: 'vasinho', name: 'Planta em vaso', price: 0, img: vasinhoImg, width: 13, x: 30, y: 78, zone: 'chao', subtitle: 'Seu primeiro presente' },
  { id: 'mesa', name: 'Mesa de estudos', price: 6, img: mesaImg, width: 27, x: 50, y: 56, zone: 'chao', subtitle: 'Organize seus materiais' },
  { id: 'banquinho', name: 'Banquinho de estudos', price: 2, img: bancoImg, width: 12, x: 47, y: 70, zone: 'chao', subtitle: 'Um assento de madeira' },
  { id: 'luminaria', name: 'Mesa com luminária cogumelo', price: 4, img: luminariaImg, width: 13, x: 15, y: 69, zone: 'chao', subtitle: 'Luz para o seu cantinho' },
  { id: 'cama', name: 'Cama de folhas', price: 8, img: camaImg, width: 31, x: 31, y: 68, zone: 'chao', subtitle: 'Um cantinho de descanso' },
  { id: 'prateleira', name: 'Prateleira de livros e plantas', price: 6, img: prateleiraImg, width: 25, x: 26, y: 36, zone: 'parede', subtitle: 'Decore a parede da toca' },
  { id: 'quadro', name: 'Quadro de recados', price: 4, img: quadroImg, width: 17, x: 50, y: 36, zone: 'parede', subtitle: 'Suas ideias em destaque' },
  { id: 'estante', name: 'Estante de livros', price: 8, img: estanteImg, width: 18, x: 70, y: 55, zone: 'chao', subtitle: 'Guarde seus livros' },
  { id: 'lampiao', name: 'Lampião', price: 4, img: lampiaoImg, width: 10, x: 83, y: 42, zone: 'pendurado', subtitle: 'Luz quentinha na parede' },
  { id: 'bau', name: 'Baú de madeira', price: 6, img: bauImg, width: 18, x: 22, y: 79, zone: 'chao', subtitle: 'Um baú para lembranças' },
  { id: 'tapete', name: 'Tapete de folha', price: 2, img: tapeteImg, width: 30, x: 40, y: 77, zone: 'tapete', subtitle: 'Aconchego para o chão' },
  { id: 'mesa_redonda', name: 'Mesa redonda com planta', price: 8, img: mesaRedondaImg, width: 20, x: 76, y: 73, zone: 'chao', subtitle: 'Natureza e decoração' },
  { id: 'almofada', name: 'Almofada de folhas', price: 2, img: almofadaImg, width: 15, x: 63, y: 80, zone: 'tapete', subtitle: 'Um descanso macio' },
  { id: 'banquinho_tronco', name: 'Banquinho de tronco', price: 2, img: bancoTroncoImg, width: 12, x: 82, y: 80, zone: 'chao', subtitle: 'Assento feito de tronco' },
  { id: 'guarda_roupa', name: 'Guarda-roupa de folhas', price: 8, img: guardaRoupaImg, width: 27, x: 59, y: 51, zone: 'chao', subtitle: 'Madeira aconchegante com detalhes de folhas' },
];

const DURACOES_RAPIDAS = [15, 25, 45];
const DURACAO_MINIMA = 1;
const DURACAO_MAXIMA = 120;
const ANEL_CIRCUNFERENCIA = 2 * Math.PI * 90;
const TODOS_ITENS = [...ITEMS, ...ITEMS_SALA2, ...ITEMS_SALA3, ...ITEMS_SALA3_LEGADOS];
// Modo de apresentação desativado: o servidor controla salas, compras e inventário.
// As decorações da prévia ficam isoladas no localStorage e não são importadas
// para a conta do estudante ao voltar ao funcionamento real.
const SALAS_LIBERADAS_PARA_PREVIA = false;
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
  const [durationDraft, setDurationDraft] = useState('25');
  const materia = 'Estudo livre';
  const [acknowledgedId, setAcknowledgedId] = useState(() => {
    try { return Number(localStorage.getItem(seenKey())) || null; }
    catch { return null; }
  });
  const [decorate, setDecorate] = useState(false);
  // Guia simples na primeira visita, reaberto manualmente quando o aluno quiser.
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [guiaEtapa, setGuiaEtapa] = useState(0);
  const chaveGuia = useMemo(() => chaveGuiaTerrario(userKey()), []);
  const verificouPrimeiraVisitaRef = useRef(false);
  const abrirGuia = useCallback(() => { setGuiaEtapa(0); setGuiaAberto(true); }, []);
  const fecharGuia = useCallback(() => {
    setGuiaAberto(false);
    try { window.localStorage.setItem(chaveGuia, '1'); } catch { /* Armazenamento opcional. */ }
  }, [chaveGuia]);

  // O Terrário funciona no modo real por padrão: só usar itens comprados
  // e salas conquistadas com sessões válidas, conforme o servidor.
  const modoTeste = false;
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
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [selected, setSelected] = useState('vasinho');
  const [drag, setDrag] = useState(null);
  const [scalePreview, setScalePreview] = useState(null);
  const scaleDraftRef = useRef(null);
  const stageRef = useRef(null);
  const stageRef2 = useRef(null);
  const stageRef3 = useRef(null);
  const viewportRef = useRef(null);
  const sceneCardRef = useRef(null);
  // A lista de móveis acompanha a altura real do terrário. A medição é da
  // cena, não do catálogo, para que trocar de sala não faça o painel crescer.
  const [alturaCatalogo, setAlturaCatalogo] = useState(0);
  // O mapa é desenhado em 1280x1040; o zoom afeta somente a exibição,
  // sem alterar as coordenadas percentuais nem as posições dos móveis.
  const [zoomDecoracao, setZoomDecoracao] = useState(0.58);
  const salasRefs = useRef({});

  useEffect(() => {
    if (!decorate) return undefined;
    const card = sceneCardRef.current;
    if (!card) return undefined;
    const atualizarAltura = () => {
      const altura = Math.round(card.getBoundingClientRect().height);
      if (altura > 0) setAlturaCatalogo((anterior) => anterior === altura ? anterior : altura);
    };
    atualizarAltura();
    const observer = new ResizeObserver(atualizarAltura);
    observer.observe(card);
    return () => observer.disconnect();
  }, [decorate]);
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
  useEffect(() => {
    if (loading || !snapshot || verificouPrimeiraVisitaRef.current) return;
    // Não interromper uma sessão já iniciada ou recuperada do servidor.
    verificouPrimeiraVisitaRef.current = true;
    if (status === 'running' || status === 'paused') return;
    try {
      if (window.localStorage.getItem(chaveGuia) === '1') return;
    } catch { /* Se storage estiver bloqueado, o guia continua acessível. */ }
    abrirGuia();
  }, [loading, snapshot, status, chaveGuia, abrirGuia]);

  // Uma sessão restaurada pelo servidor tem prioridade sobre a decoração.
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
    : clampPosition((1 - remaining / (currentDuration * 60)) * 100, 0, 100);
  const ringOffset = ANEL_CIRCUNFERENCIA * (1 - progress / 100);
  const durationInputValida = /^\d+$/.test(durationDraft) &&
    Number(durationDraft) >= DURACAO_MINIMA && Number(durationDraft) <= DURACAO_MAXIMA;
  const podeEditarDuracao = !active && !busy && !loading && status !== 'completed';
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
  const mapaEmPiramide = decorate && formatoDoMapa === 'piramide';
  const mapaDimensoes = mapaEmPiramide
    ? { largura: 1280, altura: 1040 }
    : { largura: 1280, altura: 605 };

  // No editor, o mapa usa a largura útil do cenário e cresce verticalmente.
  // Limitar pela altura da janela deixava as três salas pequenas demais em
  // notebooks; a página pode rolar normalmente, sem barras dentro do mapa.
  // Os móveis mantêm suas coordenadas percentuais em cada sala.
  useEffect(() => {
    if (!decorate || formatoDoMapa === 'individual') return undefined;
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const ajustarZoom = () => {
      const larguraUtil = Math.max(0, viewport.clientWidth - 20);
      if (!larguraUtil) return;
      const proximoZoom = Math.max(0.1, Math.min(1, larguraUtil / mapaDimensoes.largura));
      setZoomDecoracao((anterior) =>
        Math.abs(anterior - proximoZoom) < 0.001 ? anterior : proximoZoom);
    };
    ajustarZoom();
    const observer = new ResizeObserver(ajustarZoom);
    observer.observe(viewport);
    window.addEventListener('resize', ajustarZoom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', ajustarZoom);
    };
  }, [decorate, formatoDoMapa, mapaDimensoes.largura]);

  // Centraliza a sala escolhida sem rolar a página inteira; há navegação
  // por botões, mouse, rolagem e toque (inclusive nas telas pequenas).
  useEffect(() => {
    // No modo decorar o mapa inteiro fica à vista: não centralizar ou
    // movimentar a janela ao selecionar outra sala.
    if (decorate) return;
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
  }, [decorate, selectedRoom, formatoDoMapa, jornada.totalConquistadas]);

  function alternarDecoracao() {
    // Uma sessão de foco ativa mantém o cronômetro disponível.
    if (active && !decorate) return;
    // Entrar no modo decoração não deve voltar à Sala 1 quando o usuário
    // está organizando a Sala 2 ou a Sala 3.
    setDecorate((atual) => !atual);
    if (decorate && !roomDetail.conquistada) setSelectedRoom(1);
    setDrag(null);
  }

  function iniciarNavegacao(evt) {
    if (decorate || evt.pointerType !== 'mouse' || evt.button !== 0 || evt.target.closest('button, a, input, select')) return;
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
    window.addEventListener('tenna:focus-updated', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('tenna:focus-updated', refresh);
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
      window.dispatchEvent(new CustomEvent('tenna:focus-updated', { detail: data }));
      // O andamento do foco aparece uma só vez abaixo dos botões.
      // Mensagens de ações não devem duplicar o estado do cronômetro.
      setNotice('');
    } catch (e) {
      if (sequence === sequenceRef.current) setError(mensagemErroTerrario(e));
    } finally {
      busyRef.current = false;
      if (sequence === sequenceRef.current) setBusy(false);
    }
  }

  function ajustarDuracaoEscolhida(valor) {
    const numero = Number(valor);
    const minutos = Number.isFinite(numero)
      ? Math.min(DURACAO_MAXIMA, Math.max(DURACAO_MINIMA, Math.trunc(numero)))
      : duration;
    setDuration(minutos);
    setDurationDraft(String(minutos));
  }

  function editarDuracaoDigitada(valor) {
    if (!/^\d*$/.test(valor)) return;
    setDurationDraft(valor);
    const minutos = Number(valor);
    if (valor !== '' && minutos >= DURACAO_MINIMA && minutos <= DURACAO_MAXIMA) {
      setDuration(minutos);
    }
  }

  function confirmarDuracaoDigitada() {
    ajustarDuracaoEscolhida(durationDraft === '' ? duration : Number(durationDraft));
  }

  function acknowledgeCompletion() {
    if (!session?.id) return;
    setAcknowledgedId(session.id);
    setDuration(session.duracao);
    setDurationDraft(String(session.duracao));
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
          <span className="terr-eyebrow">UM CANTINHO SÓ SEU</span>
          <h1>Um pequeno ninho. Grandes conquistas.</h1>
          <p>Estude com a Tenna, ganhe sementes e evolua ao longo da sua jornada.</p>
        </div>
        <div className="terr-header-stats">
          <div className="terr-wallet"><span className="terr-seed-icon" aria-hidden="true"><img src={sementeTerrario} alt="" /></span><div><strong>{seeds}</strong><small>Sementes</small></div></div>
          <div className="terr-level"><span>NÍVEL DO ALUNO</span><strong>{level} · {title}</strong></div>
        </div>
      </header>

      {error && (
        <div className="terr-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(''); void loadStatus(); }}>Tentar novamente</button>
        </div>
      )}
      <div className="terr-layout">
        <section className="terr-scene-card" ref={sceneCardRef} aria-labelledby="terr-scene-title">
          <div className="terr-scene-topbar">
            <div className="terr-scene-heading"><h2 id="terr-scene-title">{decorate ? 'Organize seu cantinho' : 'O cantinho da Tenna'}</h2></div>
            <div className="terr-scene-actions">
              <button type="button" className="terr-guide-trigger" onClick={abrirGuia}
                aria-haspopup="dialog" aria-controls="terr-guia-dialog" disabled={status === 'running'}>
                <span aria-hidden="true">?</span> Como funciona?
              </button>
              <button type="button" className={`terr-decorate-button ${decorate ? 'active' : ''}`} onClick={alternarDecoracao} disabled={status === 'running' || (!modoTeste && (busy || loading))} aria-pressed={decorate}>
                {decorate ? 'Concluir decoração' : '✦ Decorar sala'}
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
            <div className={`terr-world-viewport is-${formatoDoMapa} ${decorate && formatoDoMapa !== 'individual' ? 'is-fitted' : ''}`}
              style={decorate && formatoDoMapa !== 'individual' ? { height: `${Math.ceil(mapaDimensoes.altura * zoomDecoracao) + 8}px` } : undefined}
              tabIndex={0} role="region" aria-label={decorate ? 'Mapa do formigueiro para decoração' : `Sala ${selectedRoom} do formigueiro`}
              ref={viewportRef} onPointerDown={iniciarNavegacao}
              onPointerMove={moverNavegacao} onPointerUp={terminarNavegacao}
              onPointerCancel={terminarNavegacao}>
              <nav className="terr-world-toolbar" aria-label="Navegação entre as salas">
                <span className="terr-world-hint">{decorate ? 'Selecione uma sala para decorar' : 'Escolha a sala para visualizar'}</span>
                <div className="terr-world-room-buttons" role="group" aria-label="Selecionar sala">
                  {salasParaNavegacao.map((sala) => (
                    <button key={sala.numero} type="button"
                      className={selectedRoom === sala.numero ? 'active' : ''}
                      onClick={() => setSelectedRoom(sala.numero)}
                      aria-label={`Sala ${sala.numero}: ${sala.nome}${sala.conquistada ? '' : ', bloqueada'}`}
                      aria-pressed={selectedRoom === sala.numero}>
                      <span className="terr-room-tab-index" aria-hidden="true">{String(sala.numero).padStart(2, '0')}</span>
                      <span className="terr-room-tab-label" aria-hidden="true">{sala.numero === 1 ? 'Ninho' : sala.numero === 2 ? 'Estudos' : 'Prova'}</span>
                      {!sala.conquistada && <span className="terr-room-tab-lock" aria-hidden="true">🔒</span>}
                    </button>
                  ))}
                </div>
              </nav>
              <div className={decorate && formatoDoMapa !== 'individual' ? 'terr-world-fit' : 'terr-world-unscaled'}
                style={decorate && formatoDoMapa !== 'individual' ? {
                  width: `${mapaDimensoes.largura * zoomDecoracao}px`,
                  height: `${mapaDimensoes.altura * zoomDecoracao}px`,
                } : undefined}>
                <div className={`terr-world-board is-${formatoDoMapa}`}
                  style={decorate && formatoDoMapa !== 'individual' ? {
                    transform: `scale(${zoomDecoracao})`,
                    transformOrigin: 'top left',
                    margin: 0,
                  } : undefined}>
                {salasDoMapa.map((sala) => (
                  <section key={sala.numero}
                    ref={(elemento) => { salasRefs.current[sala.numero] = elemento; }}
                    className={`terr-world-room terr-world-room-${sala.numero} ${sala.conquistada ? 'is-unlocked' : 'is-locked'} ${selectedRoom === sala.numero ? 'is-current' : ''}`}
                    aria-label={`Sala ${sala.numero}, ${sala.nome}: ${sala.conquistada ? 'liberada' : 'bloqueada'}`}>
                    {sala.numero === 1 ? (
                      <div className={`terr-scene ${decorate ? 'in-decorating-mode' : ''}`} ref={stageRef}>
                        <img className="terr-scene-background" src={salaImg} alt="Ninho subterrâneo com raízes e espaço para decoração" draggable="false" />
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
                        {selectedRoom === sala.numero && (
                          <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        )}

                        
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
                        {selectedRoom === sala.numero && (
                          <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        )}
                        {roomItems2.length === 0 && <span className="terr-empty-room-message">Um novo cantinho para construir 🌱</span>}
                        
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
                        {selectedRoom === sala.numero && (
                          <div className="terr-character" style={{ zIndex: 68 }}><TennaAnt animar={animarTenna} /></div>
                        )}
                        {roomItems3.length === 0 && <span className="terr-empty-room-message">Escolha os móveis para montar sua sala de prova 📝</span>}
                        
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
            </div>

          </div>
          {!decorate && !previaLiberada && !jornada.terceiraConquistada && (
            <div className="terr-scene-bottom">
              <div className="terr-room-journey">
                <span className="terr-chapter-mark" aria-hidden="true">
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5.5" y="2.8" width="13" height="18.4" rx="2.4" />
                    <path d="M9 20.7V6.5h6.5" />
                    <circle cx="13.5" cy="13.2" r=".9" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <div className="terr-journey-copy">
                  <div className="terr-unlock-heading">
                    <span>PRÓXIMA CONQUISTA</span>
                    <span className="terr-unlock-room-tag">SALA {jornada.segundaConquistada ? '03' : '02'}</span>
                  </div>
                  <strong>{jornada.segundaConquistada ? 'Sala do Desafio Final' : 'Refúgio do Conhecimento'}</strong>
                  <small>{sessionsUntilNextRoom === 1 ? 'Só mais 1 sessão válida para desbloquear!' : `Faltam ${sessionsUntilNextRoom} sessões válidas para desbloquear`}</small>
                </div>
              </div>
              <div className="terr-room-progress">
                <div className="terr-room-progress-heading">
                  <span>Seu progresso</span>
                  <strong>{jornada.progresso}<span> / {jornada.objetivo} sessões</span></strong>
                </div>
                <div className="terr-progress-track" role="progressbar" aria-label="Progresso para desbloquear a próxima sala"
                  aria-valuemin={0} aria-valuemax={jornada.objetivo} aria-valuenow={jornada.progresso}>
                  <span style={{ width: `${jornada.percentual}%` }} />
                </div>
                <small className="terr-progress-hint">Sessões de foco de pelo menos 15 minutos</small>
              </div>
            </div>
          )}
        </section>

        {!decorate && <aside className="terr-sidebar">
          <section className={`terr-sidecard terr-timer-card is-${status}`} aria-labelledby="terr-timer-heading">
            <div className="terr-timer-heading">
              <span className="terr-kicker">ESTUDE COM A TENNA</span>
              <h2 id="terr-timer-heading">Hora do foco</h2>
              <p>Escolha o tempo e comece a estudar.</p>
            </div>
            <div className={`terr-timer-clock is-${status}`} role="timer" aria-label={`Restam ${formatTime(remaining)}. ${Math.round(progress)}% da sessão concluído.`}>
              <svg className="terr-timer-ring" viewBox="0 0 220 220" aria-hidden="true" focusable="false">
                <circle className="terr-timer-ring-track" cx="110" cy="110" r="90" />
                <circle className="terr-timer-ring-progress" cx="110" cy="110" r="90"
                  strokeDasharray={ANEL_CIRCUNFERENCIA}
                  strokeDashoffset={ringOffset} />
              </svg>
              <div className="terr-timer-inner"><strong>{formatTime(remaining)}</strong><span>{loading ? 'CARREGANDO' : busy ? 'ATUALIZANDO' : status === 'running' ? 'FOCANDO' : status === 'paused' ? 'EM PAUSA' : status === 'completed' ? 'CONCLUÍDO!' : 'PRONTO'}</span></div>
            </div>
            <div className={`terr-focus-controls ${active ? 'is-active-session' : ''}`}>
              {!active && status !== 'completed' ? (
                <div className="terr-duration-setup">
                  <div className="terr-duration-label" id="terr-duration-heading">Duração da sessão</div>
                  <div className="terr-duration-presets" role="group" aria-label="Durações rápidas">
                    {DURACOES_RAPIDAS.map((minutes) => (
                      <button key={minutes} type="button"
                        aria-pressed={currentDuration === minutes}
                        className={currentDuration === minutes ? 'active' : ''}
                        disabled={!podeEditarDuracao}
                        onClick={() => ajustarDuracaoEscolhida(minutes)}>{minutes} min</button>
                    ))}
                  </div>
                  <div className="terr-duration-picker" role="group" aria-label="Personalizar duração">
                    <button type="button" className="terr-duration-step" aria-label="Diminuir um minuto"
                      disabled={!podeEditarDuracao || duration <= DURACAO_MINIMA}
                      onClick={() => ajustarDuracaoEscolhida(duration - 1)}>−</button>
                    <div className="terr-duration-value">
                      <input type="number" min={DURACAO_MINIMA} max={DURACAO_MAXIMA} step="1"
                        inputMode="numeric" aria-label="Minutos de foco" value={durationDraft}
                        disabled={!podeEditarDuracao}
                        onChange={(event) => editarDuracaoDigitada(event.target.value)}
                        onBlur={confirmarDuracaoDigitada}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
                      <span>min</span>
                    </div>
                    <button type="button" className="terr-duration-step" aria-label="Aumentar um minuto"
                      disabled={!podeEditarDuracao || duration >= DURACAO_MAXIMA}
                      onClick={() => ajustarDuracaoEscolhida(duration + 1)}>+</button>
                  </div>
                </div>
              ) : (
                <div className="terr-duration-session" aria-live="off">
                  {status === 'completed' ? `${currentDuration} min de estudo concluídos` : `Sessão de ${currentDuration} min ${status === 'paused' ? '· em pausa' : '· em andamento'}`}
                </div>
              )}
              {(status === 'completed' || status === 'paused') && (
                <div className="terr-focus-status-slot" aria-live="polite">
                  {status === 'completed' ? (
                    <div className="terr-focus-summary" role="status">
                      <strong>🎉 Sessão concluída!</strong>
                      <div><span>🌱 +{session.sementesRecebidas} sementes</span><span>✦ +{session.xpRecebido} XP</span></div>
                    </div>
                  ) : (
                    <p className="terr-focus-one-status" role="status">Sessão pausada. Seu tempo foi guardado.</p>
                  )}
                </div>
              )}
              <div className="terr-timer-buttons">
                {status === 'running' ? (
                  <button type="button" className="terr-primary" disabled={busy || loading} onClick={() => { void sendAction('pausar'); }}>Pausar</button>
                ) : status === 'paused' ? (
                  <button type="button" className="terr-primary" disabled={busy || loading} onClick={() => { void sendAction('continuar'); }}>Retomar</button>
                ) : status === 'completed' ? (
                  <button type="button" className="terr-primary" disabled={busy || loading} onClick={acknowledgeCompletion}>Nova sessão</button>
                ) : (
                  <button type="button" className="terr-primary" disabled={busy || loading || !server || !durationInputValida} onClick={() => { void sendAction('iniciar'); }}>Começar foco</button>
                )}
                {active && <button type="button" className="terr-secondary" disabled={busy || loading} onClick={() => { void sendAction('cancelar'); }}>Encerrar</button>}
              </div>
            </div>
          </section>
        </aside>}

      {decorate && (
      <section className="terr-inventory" aria-labelledby="terr-inventory-heading"
        style={decorate && alturaCatalogo > 0 ? { '--terr-catalog-height': `${alturaCatalogo}px` } : undefined}>
        <div className="terr-inventory-header"><div>
          <h2 id="terr-inventory-heading">Móveis da {roomDetail.nome}</h2>
        </div><span className="terr-inventory-balance">{modoTeste ? `${totalItensSalaSelecionada} itens` : `🌱 ${seeds} sementes`}</span></div>
        {modoTeste && salaSelecionadaPodeDecorar && (
          <div className="terr-decor-quick-actions" aria-label="Ferramentas de teste da sala">
            <button type="button" onClick={preencherSalaTeste}>{selectedRoom === 1 ? 'Preencher sala' : 'Montar ambiente'}</button>
            <button type="button" onClick={limparSalaTeste}>Limpar sala</button>
          </div>
        )}
        {salaSelecionadaPodeDecorar ? <>
        <div className="terr-items-scroll" tabIndex={0} role="region" aria-label={`Móveis disponíveis para ${roomDetail.nome}`}>
          <div className="terr-items-grid">
          {itensDaSala(selectedRoom).map((item) => {
            const itemOwned = isOwned(item.id);
            const visible = decor.visible.includes(item.id);
            return (
              <article key={item.id} className={`terr-item-card ${selected === item.id ? 'active' : ''} ${itemOwned ? 'is-owned' : ''} ${visible ? 'is-placed' : ''}`}>
                <button type="button" className="terr-item-preview" onClick={() => { setSelected(item.id); if (itemOwned) { setSelectedRoom(salaDoItem(item.id)); setDecorate(true); } }} aria-label={`Selecionar ${item.name}`}><img src={item.img} alt="" loading="lazy"/></button>
                <div className="terr-item-desc"><strong>{item.name}</strong></div>
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
      {guiaAberto && <GuiaTerrario etapa={guiaEtapa} definirEtapa={setGuiaEtapa}
        fechar={fecharGuia} modoTeste={modoTeste} />}
    </main>
  );
}
