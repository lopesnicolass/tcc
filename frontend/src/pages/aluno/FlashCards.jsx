import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, obterToken } from '../../services/api.js';
import { obterTemasParaRevisar } from '../../utils/flashcardsReview.js';
import { MATERIAS_FLASHCARDS, organizarMaterias } from '../../utils/flashcardsMaterias.js';

// Identidade própria para os baralhos: cartões ilustrados com CSS, sem capas dos Simulados.
function slugMateria(nome = '') {
  return String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const TOTAL_CARDS_SESSAO = 10;

// Mantém a rodada ativa ao navegar por outras páginas da sidebar.
// A chave inclui o usuário para não compartilhar uma rodada entre contas.
const CHAVE_SESSAO_FLASHCARDS = 'tenna_hora_flashcards_sessao_v1';

function obterChaveSessaoFlashcards() {
  try {
    const usuario = JSON.parse(localStorage.getItem('etecamp_usuario') || 'null');
    return usuario?.id ? `${CHAVE_SESSAO_FLASHCARDS}_${usuario.id}` : null;
  } catch {
    return null;
  }
}

function recuperarSessaoFlashcards() {
  const chave = obterChaveSessaoFlashcards();
  if (!chave) return null;

  try {
    const salva = JSON.parse(sessionStorage.getItem(chave) || 'null');
    if (
      !salva ||
      !Number.isInteger(salva.sessaoId) ||
      salva.sessaoId <= 0 ||
      !Array.isArray(salva.cardsDaSessao) ||
      salva.cardsDaSessao.length === 0 ||
      !Number.isInteger(salva.indiceAtual) ||
      salva.indiceAtual < 0 ||
      salva.indiceAtual >= salva.cardsDaSessao.length ||
      !Array.isArray(salva.respostasSessao)
    ) {
      sessionStorage.removeItem(chave);
      return null;
    }
    return salva;
  } catch {
    return null;
  }
}

function guardarSessaoFlashcards(sessao) {
  const chave = obterChaveSessaoFlashcards();
  if (!chave) return;
  try {
    sessionStorage.setItem(chave, JSON.stringify(sessao));
  } catch {
    // Se o armazenamento estiver indisponível, o jogo continua normalmente.
  }
}

function apagarSessaoFlashcards() {
  const chave = obterChaveSessaoFlashcards();
  if (!chave) return;
  try {
    sessionStorage.removeItem(chave);
  } catch {
    // Navegação e saída continuam funcionando sem acesso ao armazenamento.
  }
}

// Guarda a visualização dos baralhos independentemente da rodada gamificada.
// O armazenamento da aba e a chave por conta evitam misturar alunos.
const CHAVE_VISUALIZACAO_FLASHCARDS = 'tenna_flashcards_visualizacao_v1';

function obterChaveVisualizacaoFlashcards() {
  try {
    const usuario = JSON.parse(localStorage.getItem('etecamp_usuario') || 'null');
    return usuario?.id ? `${CHAVE_VISUALIZACAO_FLASHCARDS}_${usuario.id}` : null;
  } catch {
    return null;
  }
}

function recuperarVisualizacaoFlashcards() {
  const padrao = { materia: 'Todas', virados: [], scrollY: 0, modoDesafio: 'Geral' };
  const chave = obterChaveVisualizacaoFlashcards();
  if (!chave) return padrao;

  try {
    const anterior = JSON.parse(sessionStorage.getItem(chave) || 'null');
    if (!anterior || typeof anterior.materia !== 'string') return padrao;
    return {
      materia: anterior.materia || 'Todas',
      virados: Array.isArray(anterior.virados) ? anterior.virados.filter(Number.isFinite) : [],
      scrollY: Number.isFinite(anterior.scrollY) ? Math.max(0, anterior.scrollY) : 0,
      modoDesafio: typeof anterior.modoDesafio === 'string' ? anterior.modoDesafio : 'Geral',
    };
  } catch {
    return padrao;
  }
}

function guardarVisualizacaoFlashcards(visualizacao) {
  const chave = obterChaveVisualizacaoFlashcards();
  if (!chave) return;
  try {
    sessionStorage.setItem(chave, JSON.stringify(visualizacao));
  } catch {
    // A navegação continua disponível caso o armazenamento esteja bloqueado.
  }
}

const MATERIA_ALIASES = {
  'Língua Portuguesa': 'Português',
  'Portugues': 'Português',
  'Ciências da Natureza': 'Ciências',
};

function normalizarMateria(materia) {
  return MATERIA_ALIASES[materia] || materia;
}

function embaralharCards(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i -= 1) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copia[i], copia[j]] = [
      copia[j],
      copia[i],
    ];
  }

  return copia;
}

// Sorteia sempre dez posições. Caso haja menos de dez cartões na matéria,
// faz novos embaralhamentos da mesma coleção, evitando repetições consecutivas.
function completarDezCartoes(candidatos) {
  if (!candidatos.length) return [];
  const escolhidos = [];

  while (escolhidos.length < TOTAL_CARDS_SESSAO) {
    const rodada = embaralharCards(candidatos);
    if (rodada.length > 1 && escolhidos.length &&
        rodada[0].id === escolhidos[escolhidos.length - 1].id) {
      const alternativo = rodada.findIndex((card) => card.id !== rodada[0].id);
      if (alternativo > 0) [rodada[0], rodada[alternativo]] = [rodada[alternativo], rodada[0]];
    }
    escolhidos.push(...rodada.slice(0, TOTAL_CARDS_SESSAO - escolhidos.length));
  }
  return escolhidos;
}

// O desafio Geral inclui obrigatoriamente pelo menos uma pergunta de cada
// uma das cinco matérias principais. As outras cinco vagas são sorteadas
// dentre os demais cartões, sem repetições quando há 10 ou mais disponíveis.
function sortearCardsDaRodada(cards, materia = 'Geral') {
  if (materia !== 'Geral') {
    return completarDezCartoes(cards.filter((card) => card.subject === materia));
  }

  const obrigatorios = MATERIAS_FLASHCARDS.map((nome) => {
    const candidatos = cards.filter((card) => card.subject === nome);
    return candidatos.length ? embaralharCards(candidatos)[0] : null;
  });

  // Não é possível garantir todas as matérias se alguma estiver vazia.
  if (obrigatorios.some((card) => card === null)) return [];

  const jaEscolhidos = new Set(obrigatorios.map((card) => card.id));
  const disponiveis = embaralharCards(cards.filter((card) => !jaEscolhidos.has(card.id)));
  const escolhidos = [
    ...obrigatorios,
    ...disponiveis.slice(0, TOTAL_CARDS_SESSAO - obrigatorios.length),
  ];

  // Caso ainda existam menos de dez cartões únicos no conjunto,
  // complementa a rodada com novos sorteios, preservando a cobertura.
  if (escolhidos.length < TOTAL_CARDS_SESSAO) {
    const suplementares = completarDezCartoes(cards);
    escolhidos.push(...suplementares.slice(0, TOTAL_CARDS_SESSAO - escolhidos.length));
  }

  return embaralharCards(escolhidos);
}

async function lerJsonSeguro(resposta) {

  const texto =
    await resposta.text();

  if (!texto) {
    return {};
  }

  try {

    return JSON.parse(texto);

  } catch {

    throw new Error(
      `O servidor não retornou JSON. Status: ${resposta.status}.`
    );
  }
}

export default function FlashCards() {

  // =====================================================
  // FLASHCARDS NORMAIS
  // =====================================================

  const [cards, setCards] =
    useState([]);

  // Recupera a matéria e os cartões abertos quando a sidebar desmonta a página.
  const [visualizacaoInicial] = useState(recuperarVisualizacaoFlashcards);
  const scrollPendente = useRef(visualizacaoInicial.scrollY);

  const [flipped, setFlipped] =
    useState(() => new Set(visualizacaoInicial.virados));

  const [filtro, setFiltro] =
    useState(visualizacaoInicial.materia);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');


  // =====================================================
  // HORA DOS FLASHCARDS
  // =====================================================

  // Recupera a rodada quando o usuário volta à página pelo menu lateral.
  const [sessaoRestaurada] = useState(recuperarSessaoFlashcards);

  // A escolha da matéria vale para a rodada inteira, inclusive após navegar
  // pela sidebar ou escolher jogar novamente no resultado.
  const [materiaDoDesafio, setMateriaDoDesafio] = useState(
    sessaoRestaurada?.materiaDoDesafio || visualizacaoInicial.modoDesafio || 'Geral'
  );

  const [modoJogo, setModoJogo] =
    useState(Boolean(sessaoRestaurada));

  const [cardsDaSessao, setCardsDaSessao] =
    useState(sessaoRestaurada?.cardsDaSessao || []);

  const [indiceAtual, setIndiceAtual] =
    useState(sessaoRestaurada?.indiceAtual || 0);

  const [cardVirado, setCardVirado] =
    useState(Boolean(sessaoRestaurada?.cardVirado));

  const [sessaoId, setSessaoId] =
    useState(sessaoRestaurada?.sessaoId || null);

  const [respostasSessao, setRespostasSessao] =
    useState(sessaoRestaurada?.respostasSessao || []);

  const [finalizado, setFinalizado] =
    useState(Boolean(sessaoRestaurada?.finalizado));

  const [iniciandoSessao, setIniciandoSessao] =
    useState(false);

  // O desafio só mostra as opções depois de clicar em Iniciar desafio.
  const [seletorDesafioAberto, setSeletorDesafioAberto] = useState(false);
  const seletorDesafioRef = useRef(null);
  const abrirDesafioRef = useRef(null);
  const iniciandoSessaoRef = useRef(false);

  const [registrandoResposta, setRegistrandoResposta] =
    useState(false);


  // =====================================================
  // ARRASTO
  // =====================================================

  const [inicioArrasto, setInicioArrasto] =
    useState(null);

  const [deslocamento, setDeslocamento] =
    useState(0);

  const [arrastando, setArrastando] =
    useState(false);


  // =====================================================
  // CARREGAR FLASHCARDS
  // =====================================================

  useEffect(() => {

    carregarFlashcards();

  }, []);

  // A escolha acontece sobre a página, sem esconder nem perder os baralhos.
  // Escape, foco e rolagem são tratados para usar também pelo teclado/celular.
  useEffect(() => {
    if (!seletorDesafioAberto) return undefined;

    // Compensa a largura da barra de rolagem que desaparece com o modal.
    // Assim, o conteúdo mantém a mesma largura e não salta para a direita.
    const overflowAnterior = document.body.style.overflow;
    const paddingAnterior = document.body.style.paddingRight;
    const larguraDaBarra = window.innerWidth - document.documentElement.clientWidth;
    if (larguraDaBarra > 0) {
      const paddingAtual = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${paddingAtual + larguraDaBarra}px`;
    }
    document.body.style.overflow = 'hidden';
    seletorDesafioRef.current?.querySelector('.flashcards-challenge-close')?.focus();

    function aoPressionarTecla(event) {
      if (event.key === 'Escape' && !iniciandoSessaoRef.current) {
        setSeletorDesafioAberto(false);
      }
      if (event.key !== 'Tab') return;
      const botoes = Array.from(seletorDesafioRef.current?.querySelectorAll('button:not(:disabled)') || []);
      if (!botoes.length) return;
      const primeiro = botoes[0];
      const ultimo = botoes[botoes.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoPressionarTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.body.style.paddingRight = paddingAnterior;
      document.removeEventListener('keydown', aoPressionarTecla);
      abrirDesafioRef.current?.focus();
    };
  }, [seletorDesafioAberto]);

  // Atualiza a rolagem da matéria aberta enquanto o aluno estuda.
  useEffect(() => {
    if (modoJogo) return undefined;
    const guardarPosicao = () => {
      guardarVisualizacaoFlashcards({
        materia: filtro,
        virados: [...flipped],
        scrollY: window.scrollY,
        modoDesafio: materiaDoDesafio,
      });
    };
    window.addEventListener('scroll', guardarPosicao, { passive: true });
    return () => window.removeEventListener('scroll', guardarPosicao);
  }, [modoJogo, filtro, flipped, materiaDoDesafio]);

  // Espera os baralhos chegarem antes de restaurar a posição: antes disso a
  // página ainda não tem altura suficiente para retornar ao conteúdo anterior.
  useEffect(() => {
    if (modoJogo || carregando || scrollPendente.current === null) return;
    const posicao = scrollPendente.current;
    scrollPendente.current = null;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: posicao, behavior: 'instant' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [modoJogo, carregando]);

  // Salva o estado da rodada entre mudanças de rota (sem criar nova sessão).
  useEffect(() => {
    if (!modoJogo || !sessaoId || cardsDaSessao.length === 0) return;

    guardarSessaoFlashcards({
      sessaoId,
      cardsDaSessao,
      indiceAtual,
      cardVirado,
      respostasSessao,
      finalizado,
      materiaDoDesafio,
    });
  }, [modoJogo, sessaoId, cardsDaSessao, indiceAtual, cardVirado, respostasSessao, finalizado, materiaDoDesafio]);


  async function carregarFlashcards() {

    try {

      setCarregando(true);

      setErro('');

      const token =
        obterToken();

      const resposta =
        await fetch(
          `${API_URL}/flashcards`,
          {
            headers:
              token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {},
          }
        );

      const dados =
        await lerJsonSeguro(
          resposta
        );

      if (!resposta.ok) {

        throw new Error(
          dados.erro ||
          dados.mensagem ||
          'Erro ao carregar flashcards.'
        );

      }

      const lista =
        Array.isArray(dados)
          ? dados
          : dados.flashcards || [];

      const cardsFormatados =
        lista
          .filter(
            (card) =>
              card.ativo === 1 ||
              card.ativo === true
          )
          .map(
            (card) => ({

              id:
                Number(card.id),

              subject:
                normalizarMateria(
                  card.materia ||
                  'Sem matéria'
                ),

              subjectId:
                card.materia_id ||
                null,

              contentId:
                card.topico_id ||
                null,

              content:
                card.conteudo ||
                '',

              front:
                card.primario ||
                '',

              back:
                card.secundario ||
                '',
            })
          )
          .filter(
            (card) =>
              card.front ||
              card.back
          );

      setCards(
        cardsFormatados
      );

    } catch (error) {

      console.error(
        'Erro ao carregar flashcards:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível carregar os flashcards.'
      );

    } finally {

      setCarregando(false);

    }

  }


  // =====================================================
  // VIRAR CARD NORMAL
  // =====================================================

  function toggle(id) {
    const novo = new Set(flipped);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setFlipped(novo);
    guardarVisualizacaoFlashcards({
      materia: filtro,
      virados: [...novo],
      scrollY: window.scrollY,
      modoDesafio: materiaDoDesafio,
    });
  }


  // =====================================================
  // INICIAR HORA DOS FLASHCARDS
  // =====================================================

  async function iniciarHoraDosFlashcards() {
    if (iniciandoSessaoRef.current) return;
    const selecionados = sortearCardsDaRodada(cards, materiaDoDesafio);

    if (selecionados.length !== TOTAL_CARDS_SESSAO) {
      setErro('Não há flashcards disponíveis para iniciar esta rodada.');
      return;
    }

    try {

      iniciandoSessaoRef.current = true;
      setIniciandoSessao(true);

      setErro('');

      const token =
        obterToken();

      const resposta =
        await fetch(
          `${API_URL}/flashcards/resultados/sessoes`,
          {
            method:
              'POST',

            headers: {

              'Content-Type':
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                totalCards:
                  selecionados.length,
              }),
          }
        );

      const dados =
        await lerJsonSeguro(
          resposta
        );

      if (
        !resposta.ok
      ) {

        throw new Error(
          dados.erro ||
          dados.mensagem ||
          'Não foi possível iniciar a sessão.'
        );

      }

      if (
        !dados.sessao?.id
      ) {

        throw new Error(
          'O servidor não retornou o ID da sessão de flashcards.'
        );

      }

      setSessaoId(
        Number(
          dados.sessao.id
        )
      );

      setCardsDaSessao(
        selecionados
      );

      setIndiceAtual(
        0
      );

      setCardVirado(
        false
      );

      setRespostasSessao(
        []
      );

      setFinalizado(
        false
      );

      setDeslocamento(
        0
      );

      setInicioArrasto(
        null
      );

      setArrastando(
        false
      );

      setModoJogo(
        true
      );
      setSeletorDesafioAberto(false);

      // Registra a rodada imediatamente, mesmo se navegar antes do próximo render.
      guardarSessaoFlashcards({
        sessaoId: Number(dados.sessao.id),
        cardsDaSessao: selecionados,
        indiceAtual: 0,
        cardVirado: false,
        respostasSessao: [],
        finalizado: false,
        materiaDoDesafio,
      });

    } catch (error) {

      console.error(
        'Erro ao iniciar sessão:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível iniciar a sessão.'
      );

    } finally {

      iniciandoSessaoRef.current = false;
      setIniciandoSessao(
        false
      );

    }

  }


  // =====================================================
  // VIRAR CARD DO JOGO
  // =====================================================

  function virarCardDoJogo() {

    if (
      registrandoResposta ||
      finalizado
    ) {
      return;
    }

    setCardVirado(
      (atual) => !atual
    );

  }


  // =====================================================
  // FINALIZAR SESSÃO NO BACKEND
  // =====================================================

  async function finalizarSessao() {

    if (!sessaoId) {
      return;
    }

    const token =
      obterToken();

    const resposta =
      await fetch(
        `${API_URL}/flashcards/resultados/sessoes/${sessaoId}/finalizar`,
        {
          method:
            'PUT',

          headers:
            token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
        }
      );

    const dados =
      await lerJsonSeguro(
        resposta
      );

    if (
      !resposta.ok
    ) {

      throw new Error(
        dados.erro ||
        dados.mensagem ||
        'Erro ao finalizar sessão.'
      );

    }

  }


  // =====================================================
  // REGISTRAR RESPOSTA
  // =====================================================

  async function responderCard(
    acertou
  ) {

    if (
      !sessaoId ||
      !cardVirado ||
      registrandoResposta ||
      finalizado
    ) {

      return;

    }

    const cardAtual =
      cardsDaSessao[
        indiceAtual
      ];

    if (!cardAtual) {
      return;
    }

    try {

      setRegistrandoResposta(
        true
      );

      setErro('');

      const token =
        obterToken();

      const resposta =
        await fetch(
          `${API_URL}/flashcards/resultados/sessoes/${sessaoId}/respostas`,
          {
            method:
              'POST',

            headers: {

              'Content-Type':
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify({

                flashcardId:
                  cardAtual.id,

                materia:
                  cardAtual.subject,

                acertou,

                // Repetições só ocorrem quando há menos de 10 cartões da matéria.
                permitirRepeticao: respostasSessao.some(
                  (anterior) => anterior.flashcardId === cardAtual.id
                ),

              }),
          }
        );

      const dados =
        await lerJsonSeguro(
          resposta
        );

      if (
        !resposta.ok
      ) {

        throw new Error(
          dados.erro ||
          dados.mensagem ||
          'Não foi possível registrar a resposta.'
        );

      }

      const novasRespostas = [
        ...respostasSessao,

        {
          flashcardId:
            cardAtual.id,

          materia:
            cardAtual.subject,

          acertou,
        },
      ];

      setRespostasSessao(
        novasRespostas
      );

      setDeslocamento(
        0
      );

      setInicioArrasto(
        null
      );

      setArrastando(
        false
      );

      const proximoIndice =
        indiceAtual + 1;

      if (
        proximoIndice >=
        cardsDaSessao.length
      ) {

        await finalizarSessao();

        guardarSessaoFlashcards({
          sessaoId,
          cardsDaSessao,
          indiceAtual,
          cardVirado: true,
          respostasSessao: novasRespostas,
          finalizado: true,
          materiaDoDesafio,
        });

        setFinalizado(
          true
        );

      } else {

        guardarSessaoFlashcards({
          sessaoId,
          cardsDaSessao,
          indiceAtual: proximoIndice,
          cardVirado: false,
          respostasSessao: novasRespostas,
          finalizado: false,
          materiaDoDesafio,
        });

        setIndiceAtual(
          proximoIndice
        );

        setCardVirado(
          false
        );

      }

    } catch (error) {

      console.error(
        'Erro ao registrar resposta:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível registrar sua resposta.'
      );

    } finally {

      setRegistrandoResposta(
        false
      );

    }

  }


  // =====================================================
  // SAIR DO JOGO
  // =====================================================

  function sairDoJogo() {

    apagarSessaoFlashcards();

    setModoJogo(
      false
    );

    setSessaoId(
      null
    );

    setCardsDaSessao(
      []
    );

    setIndiceAtual(
      0
    );

    setCardVirado(
      false
    );

    setRespostasSessao(
      []
    );

    setFinalizado(
      false
    );

    setInicioArrasto(
      null
    );

    setDeslocamento(
      0
    );

    setArrastando(
      false
    );

    setErro('');

  }


  // =====================================================
  // JOGAR NOVAMENTE
  // =====================================================

  async function jogarNovamente() {

    apagarSessaoFlashcards();

    setModoJogo(
      false
    );

    setSessaoId(
      null
    );

    setCardsDaSessao(
      []
    );

    setIndiceAtual(
      0
    );

    setCardVirado(
      false
    );

    setRespostasSessao(
      []
    );

    setFinalizado(
      false
    );

    setErro('');

    await iniciarHoraDosFlashcards();

  }


  // =====================================================
  // INÍCIO DO ARRASTO
  // =====================================================

  function iniciarArrasto(event) {

    if (
      !cardVirado ||
      registrandoResposta ||
      finalizado
    ) {

      return;

    }

    setArrastando(
      true
    );

    setInicioArrasto({
      x:
        event.clientX,

      y:
        event.clientY,
    });

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

  }


  // =====================================================
  // MOVIMENTO DO ARRASTO
  // =====================================================

  function moverArrasto(event) {

    if (
      !arrastando ||
      !inicioArrasto
    ) {

      return;

    }

    setDeslocamento(
      event.clientX -
      inicioArrasto.x
    );

  }


  // =====================================================
  // FINALIZAR ARRASTO
  // =====================================================

  function finalizarArrasto(event) {

    if (
      !arrastando ||
      !inicioArrasto
    ) {

      return;

    }

    const distancia =
      event.clientX -
      inicioArrasto.x;

    setArrastando(
      false
    );

    setInicioArrasto(
      null
    );

    const limite =
      120;

    if (
      Math.abs(
        distancia
      ) < limite
    ) {

      setDeslocamento(
        0
      );

      return;

    }

    setDeslocamento(
      0
    );

    if (
      distancia < 0
    ) {

      responderCard(
        true
      );

    } else {

      responderCard(
        false
      );

    }

  }


  // =====================================================
  // CANCELAR ARRASTO
  // =====================================================

  function cancelarArrasto() {

    setArrastando(
      false
    );

    setInicioArrasto(
      null
    );

    setDeslocamento(
      0
    );

  }


  // =====================================================
  // MATÉRIAS
  // =====================================================

  // Inclui as cinco matérias principais, inclusive quando ainda não há cartões.
  // Também mantém matérias adicionais cadastradas pelo administrador.
  const materiasDisponiveis = useMemo(() => organizarMaterias(cards), [cards]);
  const materiaSelecionada = filtro === 'Todas' ? null : filtro;
  const materiasFaltantesNoGeral = MATERIAS_FLASHCARDS.filter(
    (materia) => !cards.some((card) => card.subject === materia)
  );
  const quantidadeNoDesafio = materiaDoDesafio === 'Geral'
    ? cards.length
    : cards.filter((card) => card.subject === materiaDoDesafio).length;
  const podeIniciarDesafio = quantidadeNoDesafio > 0 &&
    (materiaDoDesafio !== 'Geral' || materiasFaltantesNoGeral.length === 0);

  function escolherMateriaDoDesafio(materia) {
    setMateriaDoDesafio(materia);
    setErro('');
    guardarVisualizacaoFlashcards({
      materia: filtro,
      virados: [...flipped],
      scrollY: window.scrollY,
      modoDesafio: materia,
    });
  }

  function selecionarMateria(materia) {
    scrollPendente.current = null;
    setFiltro(materia);
    setFlipped(new Set());
    guardarVisualizacaoFlashcards({ materia, virados: [], scrollY: 0, modoDesafio: materiaDoDesafio });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function voltarAosBaralhos() {
    selecionarMateria('Todas');
  }

  // Apenas os cartões da matéria selecionada; sem painel de busca ou resumos extras.
  const cardsFiltrados = useMemo(
    () => cards.filter((card) => filtro === 'Todas' || card.subject === filtro),
    [cards, filtro]
  );

  // =====================================================
  // RESULTADO
  // =====================================================

  const acertos =
    respostasSessao.filter(
      (resposta) =>
        resposta.acertou
    ).length;

  const erros =
    respostasSessao.filter(
      (resposta) =>
        !resposta.acertou
    ).length;

  const totalRespondido =
    respostasSessao.length;

  const porcentagem =
    totalRespondido > 0
      ? Math.round(
          (
            acertos /
            totalRespondido
          ) * 100
        )
      : 0;


  // =====================================================
  // GRID NORMAL
  // =====================================================

  function renderGrid(lista) {
    if (!lista.length) {
      return null;
    }

    return (
      <div className="flashcard-grid">
        {lista.map((card) => {
          const virado = flipped.has(card.id);

          return (
            <button
              type="button"
              key={card.id}
              className={`flashcard ${virado ? 'flipped' : ''}`}
              onClick={() => toggle(card.id)}
              aria-pressed={virado}
              aria-label={`${virado ? 'Resposta' : 'Pergunta'}: ${virado ? card.back : card.front}. ${virado ? 'Voltar à pergunta' : 'Revelar resposta'}`}
            >
              <span className="flashcard-inner">
                <span className="flashcard-face front" aria-hidden={virado}>
                  <span className="flashcard-face-text">{card.front}</span>
                </span>

                <span className="flashcard-face back" aria-hidden={!virado}>
                  <span className="flashcard-face-text">{card.back}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }


  // =====================================================
  // LISTAGEM ORGANIZADA
  // =====================================================

  function renderFlashcardsOrganizados(
    lista
  ) {

    if (!lista.length) {
      return (
        <div className="flashcards-vazio" role="status">
          <strong>Nenhum flashcard nesta matéria</strong>
          <p>Quando houver flashcards cadastrados, eles aparecerão aqui.</p>
        </div>
      );
    }

    const grupos =
      new Map();

    lista.forEach(
      (card) => {

        const materia =
          card.subject ||
          'Sem matéria';

        const conteudo =
          card.content ||
          'Conteúdo não definido';

        if (
          !grupos.has(
            materia
          )
        ) {

          grupos.set(
            materia,
            new Map()
          );

        }

        const porConteudo =
          grupos.get(
            materia
          );

        if (
          !porConteudo.has(
            conteudo
          )
        ) {

          porConteudo.set(
            conteudo,
            []
          );

        }

        porConteudo
          .get(
            conteudo
          )
          .push(
            card
          );

      }
    );

    return Array.from(
      grupos.entries()
    ).map(
      ([
        materia,
        conteudos,
      ]) => (

        <section
          className={`materia-section materia-${materia
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`}
          key={
            materia
          }
        >

          {Array.from(conteudos.entries()).map(([conteudo, cardsDoConteudo]) => (
            <section className="flashcards-content-section" key={`${materia}-${conteudo}`}>
              <div className="flashcards-content-heading">
                <div className="flashcards-content-heading-main">
                  <div>
                    <span className="flashcards-content-kicker">CONTEÚDO</span>
                    <h3 className="flashcards-content-title">{conteudo}</h3>
                  </div>
                </div>
              </div>
              {renderGrid(cardsDoConteudo)}
            </section>
          ))}

        </section>

      )
    );

  }


  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {

    return (
      <div className="flashcards-loading" role="status" aria-live="polite">
        <span className="flashcards-loading-spinner" aria-hidden="true" />
        Carregando flashcards...
      </div>
    );

  }


  // =====================================================
  // RESULTADO DA SESSÃO
  // =====================================================

  if (modoJogo && finalizado) {
    return (
      <div className="flashcards-game-page flashcards-finished">
        <div className="flashcards-session-layout">
          <section className="flashcards-result" aria-labelledby="flashcards-result-title">
            <div className="flashcards-result-summary">
              <div className="flashcards-result-intro">
                <span className="flashcards-result-status"><span aria-hidden="true">✓</span> Sessão concluída</span>
                <h2 id="flashcards-result-title">Você concluiu o desafio!</h2>
                <p>
                  {materiaDoDesafio === 'Geral' ? 'Rodada geral' : materiaDoDesafio} · {cardsDaSessao.length} flashcards revisados.
                  Confira seus resultados e o que vale reforçar.
                </p>
              </div>
              <div className="flashcards-result-score" role="img" aria-label={`${porcentagem}% de aproveitamento`}>
                <div className="flashcards-result-ring" style={{ '--score': `${porcentagem}%` }}>
                  <div className="flashcards-result-ring-inner">
                    <strong>{porcentagem}%</strong>
                    <span>aproveitamento</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flashcards-result-stats">
              <div className="flashcards-result-stat is-correct">
                <span><span className="flashcards-stat-dot" aria-hidden="true">✓</span> Acertei</span>
                <strong>{acertos}</strong>
              </div>
              <div className="flashcards-result-stat is-wrong">
                <span><span className="flashcards-stat-dot" aria-hidden="true">×</span> Errei</span>
                <strong>{erros}</strong>
              </div>
            </div>

            {erros > 0 ? (
              <div className="flashcards-review-suggestion">
                <div>
                  <span className="flashcards-review-eyebrow">PRÓXIMOS PASSOS</span>
                  <h3>Conteúdos para revisar</h3>
                  <p>Estes temas apareceram nos cartões que você ainda pode reforçar:</p>
                </div>
                <div className="flashcards-review-topics">
                  {obterTemasParaRevisar(respostasSessao, cardsDaSessao).map((tema) => (
                    <span key={tema}>{tema}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flashcards-review-suggestion flashcards-review-success">
                <span className="flashcards-review-eyebrow">ÓTIMO RESULTADO</span>
                <h3>Você acertou todos os cartões!</h3>
                <p>Continue revisando para manter o conteúdo em dia.</p>
              </div>
            )}

            <div className="flashcards-result-actions">
              <button type="button" className="flashcards-result-primary" onClick={jogarNovamente}>
                Jogar novamente <span aria-hidden="true">↻</span>
              </button>
              <button type="button" className="flashcards-result-secondary" onClick={sairDoJogo}>
                Voltar aos flashcards
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =====================================================
  // TELA DA HORA DOS FLASHCARDS
  // =====================================================

  if (modoJogo) {
    const cardAtual = cardsDaSessao[indiceAtual];
    const progresso = cardsDaSessao.length > 0
      ? Math.round((indiceAtual / cardsDaSessao.length) * 100)
      : 0;

    return (
      <div className="flashcards-game-page flashcards-playing">
        <button
          type="button"
          className="flashcards-session-back-arrow"
          onClick={sairDoJogo}
          disabled={registrandoResposta}
          aria-label="Voltar aos flashcards"
          title="Voltar aos flashcards"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flashcards-session-layout">
          <div className="flashcards-session-progress">
            <div className="flashcards-session-progress-top">
              <span className="flashcards-session-progress-label">HORA DOS FLASHCARDS</span>
            </div>
            <div className="flashcards-session-progress-heading">
              <strong>Cartão {indiceAtual + 1} de {cardsDaSessao.length}</strong>
              <div className="flashcards-session-progress-meta">
                <span>{indiceAtual} respondidos</span>
                <span className="flashcards-session-progress-percent">{progresso}%</span>
              </div>
            </div>
            <div
              className="flashcards-progress"
              role="progressbar"
              aria-label="Progresso da sessão"
              aria-valuemin={0}
              aria-valuemax={cardsDaSessao.length}
              aria-valuenow={indiceAtual}
            >
              <div className="flashcards-progress-bar" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          <section className="flashcards-game-content" aria-label={`Cartão de estudo de ${cardAtual.subject}`}>
            <div
              className={`flashcard-game-card flashcard-game-materia-${slugMateria(cardAtual.subject)} ${cardVirado ? 'is-flipped' : ''}`}
              style={{ transform: `translateX(${deslocamento}px) rotate(${deslocamento * 0.04}deg)` }}
              onClick={virarCardDoJogo}
              onPointerDown={iniciarArrasto}
              onPointerMove={moverArrasto}
              onPointerUp={finalizarArrasto}
              onPointerCancel={cancelarArrasto}
              role="button"
              tabIndex={0}
              aria-label={cardVirado ? 'Resposta do flashcard. Ative para ver a pergunta' : 'Pergunta do flashcard. Ative para revelar a resposta'}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  virarCardDoJogo();
                }
              }}
            >
              <div className="flashcard-game-inner">
                <div className="flashcard-game-face flashcard-game-front" aria-hidden={cardVirado}>
                  <span className="flashcard-game-face-tag">PERGUNTA</span>
                  <p>{cardAtual.front}</p>
                  <span className="flashcard-game-flip-hint"><span aria-hidden="true">↻</span> Clique para ver a resposta</span>
                </div>
                <div className="flashcard-game-face flashcard-game-back" aria-hidden={!cardVirado}>
                  <span className="flashcard-game-face-tag">RESPOSTA</span>
                  <p>{cardAtual.back}</p>
                  <span className="flashcard-game-flip-hint"><span aria-hidden="true">↻</span> Clique para rever a pergunta</span>
                </div>
              </div>
            </div>

            <p className="flashcards-game-guidance" aria-live="polite">
              {cardVirado
                ? 'Como foi sua resposta? Escolha uma opção abaixo.'
                : 'Vire o cartão para liberar sua avaliação.'}
            </p>

            <div className="flashcards-game-actions">
              <button
                type="button"
                className="flashcards-answer-button correct"
                onClick={() => responderCard(true)}
                disabled={!cardVirado || registrandoResposta}
              >
                <span className="flashcards-answer-symbol" aria-hidden="true">✓</span>
                {registrandoResposta ? 'Registrando...' : 'Acertei'}
              </button>
              <button
                type="button"
                className="flashcards-answer-button wrong"
                onClick={() => responderCard(false)}
                disabled={!cardVirado || registrandoResposta}
              >
                <span className="flashcards-answer-symbol" aria-hidden="true">×</span>
                Errei
              </button>
            </div>

            {cardVirado && (
              <p className="flashcards-swipe-help">Você também pode arrastar o cartão para a esquerda ou direita.</p>
            )}
            {erro && <p className="flashcards-game-error" role="alert">{erro}</p>}
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // TELA NORMAL
  // =====================================================

  return (
    <div className="flashcards-page page-shell">
      {!materiaSelecionada && (
        <section className="flashcards-hero">
          <div className="flashcards-hero-content">
            <span className="flashcards-hero-eyebrow">SEU ESPAÇO DE REVISÃO</span>
            <h1>Flashcards</h1>
            <p>Estude no seu ritmo. Escolha um baralho ou desafie seus conhecimentos em uma rodada rápida.</p>
          </div>
        </section>
      )}

      {erro && (
        <div className="flashcards-erro" role="alert">
          <p>{erro}</p>
          <button type="button" className="flashcards-btn-primary" onClick={carregarFlashcards}>
            Tentar novamente
          </button>
        </div>
      )}

      {!materiaSelecionada ? (
        <>
          <section className="flashcards-game-banner">
            <div className="flashcards-game-banner-content">
              <div>
                <span className="flashcards-game-eyebrow">DESAFIO RÁPIDO <span aria-hidden="true">✦</span></span>
                <h2>Hora do FlashCard!</h2>
                <p>Teste seus conhecimentos em uma rodada de 10 flashcards aleatórios. Você escolhe o tema antes de começar.</p>
              </div>
              <button
                type="button"
                ref={abrirDesafioRef}
                className="flashcards-game-start"
                onClick={() => {
                  setErro('');
                  setSeletorDesafioAberto(true);
                }}
                disabled={iniciandoSessao || cards.length === 0}
              >
                Iniciar desafio
              </button>
            </div>
          </section>

          {seletorDesafioAberto && (
            <div
              className="flashcards-challenge-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !iniciandoSessaoRef.current) {
                  setSeletorDesafioAberto(false);
                }
              }}
            >
              <section
                className="flashcards-challenge-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="flashcards-challenge-title"
                aria-describedby="flashcards-challenge-description"
                ref={seletorDesafioRef}
              >
                <div className="flashcards-challenge-head">
                  <div>
                    <span className="flashcards-challenge-eyebrow">HORA DO FLASHCARD</span>
                    <h2 id="flashcards-challenge-title">Escolha seu desafio</h2>
                    <p id="flashcards-challenge-description">Prefere misturar as matérias ou revisar apenas uma?</p>
                  </div>
                  <button
                    type="button"
                    className="flashcards-challenge-close"
                    aria-label="Fechar escolha do desafio"
                    onClick={() => setSeletorDesafioAberto(false)}
                    disabled={iniciandoSessao}
                  >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="flashcards-challenge-body">
                  <div className="flashcards-challenge-options-heading">
                    <strong id="flashcards-game-mode-label">Qual rodada você quer jogar?</strong>
                    <span>10 cartões por rodada</span>
                  </div>
                  <div className="flashcards-game-options-list" role="group" aria-labelledby="flashcards-game-mode-label">
                    <button
                      type="button"
                      className={`flashcards-game-mode is-general ${materiaDoDesafio === 'Geral' ? 'is-selected' : ''}`}
                      aria-pressed={materiaDoDesafio === 'Geral'}
                      onClick={() => escolherMateriaDoDesafio('Geral')}
                      disabled={cards.length === 0 || iniciandoSessao}
                    >
                      <span className="flashcards-game-mode-dot" aria-hidden="true" />
                      Geral
                    </button>
                    {materiasDisponiveis.map((materia) => {
                      const disponivel = cards.some((card) => card.subject === materia);
                      return (
                        <button
                          type="button"
                          key={materia}
                          className={`flashcards-game-mode flashcards-game-mode-${slugMateria(materia)} ${materiaDoDesafio === materia ? 'is-selected' : ''}`}
                          aria-pressed={materiaDoDesafio === materia}
                          title={!disponivel ? 'Ainda não há flashcards nesta matéria' : undefined}
                          onClick={() => escolherMateriaDoDesafio(materia)}
                          disabled={!disponivel || iniciandoSessao}
                        >
                          <span className="flashcards-game-mode-dot" aria-hidden="true" />
                          {materia}
                        </button>
                      );
                    })}
                  </div>
                  {podeIniciarDesafio && materiaDoDesafio !== 'Geral' && quantidadeNoDesafio < TOTAL_CARDS_SESSAO && (
                    <p className="flashcards-challenge-note" role="status">
                      Esta matéria tem {quantidadeNoDesafio} {quantidadeNoDesafio === 1 ? 'cartão' : 'cartões'}. Alguns podem se repetir para completar a rodada.
                    </p>
                  )}
                  {materiaDoDesafio === 'Geral' && materiasFaltantesNoGeral.length > 0 && (
                    <p className="flashcards-challenge-note" role="status">
                      O desafio Geral precisa de pelo menos um flashcard de cada matéria. Faltam: {materiasFaltantesNoGeral.join(', ')}.
                    </p>
                  )}
                  {!podeIniciarDesafio && materiaDoDesafio !== 'Geral' && (
                    <p className="flashcards-challenge-note" role="status">Selecione uma opção com flashcards disponíveis.</p>
                  )}
                  {erro && <p className="flashcards-challenge-error" role="alert">{erro}</p>}
                </div>

                <div className="flashcards-challenge-footer">
                  <button
                    type="button"
                    className="flashcards-challenge-confirm"
                    onClick={iniciarHoraDosFlashcards}
                    disabled={iniciandoSessao || !podeIniciarDesafio}
                  >
                    {iniciandoSessao ? 'Preparando rodada...' : 'Começar rodada'}
                  </button>
                </div>
              </section>
            </div>
          )}

          <section className="flashcards-materias flashcards-materias-direta" aria-label="Baralhos disponíveis">
            <div className="flashcards-decks-grid">
              {materiasDisponiveis.map((materia) => {
                const cardsDaMateria = cards.filter((card) => card.subject === materia);
                const quantidade = cardsDaMateria.length;
                return (
                  <button
                    type="button"
                    key={materia}
                    className={`flashcards-deck flashcards-deck-${slugMateria(materia)}`}
                    onClick={() => selecionarMateria(materia)}
                    aria-label={`Abrir baralho de ${materia}: ${quantidade} ${quantidade === 1 ? 'flashcard' : 'flashcards'}`}
                  >
                    <span className="flashcards-deck-illustration" aria-hidden="true">
                      <span className="flashcards-deck-sheet flashcards-deck-sheet-bottom" />
                      <span className="flashcards-deck-sheet flashcards-deck-sheet-middle" />
                      <span className="flashcards-deck-sheet flashcards-deck-sheet-front">
                        <span className="flashcards-deck-glyph">?</span>
                        <span className="flashcards-deck-dashes"><i /><i /></span>
                      </span>
                    </span>
                    <span className="flashcards-deck-details">
                      <strong className="flashcards-deck-title">{materia}</strong>
                      <span className="flashcards-deck-action">Abrir baralho</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className={`flashcards-materia-hero flashcards-materia-${slugMateria(materiaSelecionada)}`} aria-label={`Matéria: ${materiaSelecionada}`}>
            <div className="flashcards-materia-hero-content">
              <nav className="flashcards-materia-trilha" aria-label="Navegação da matéria">
                <button
                  type="button"
                  className="flashcards-materia-trilha-link"
                  onClick={voltarAosBaralhos}
                  aria-label="Voltar aos baralhos"
                  title="Voltar aos baralhos"
                >
                  Baralhos
                </button>
                <svg className="flashcards-materia-trilha-separador" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <span className="flashcards-materia-hero-label" aria-current="page">Revisão por matéria</span>
              </nav>
              <h1>{materiaSelecionada}</h1>
            </div>
            <span className="flashcards-materia-hero-art" aria-hidden="true"><span /><span /><span /></span>
          </section>
          {!erro && renderFlashcardsOrganizados(cardsFiltrados)}
        </>
      )}
    </div>
  );
}
