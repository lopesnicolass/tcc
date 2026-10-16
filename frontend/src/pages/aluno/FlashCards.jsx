import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useState } from 'react';
import { API_URL, obterToken } from '../../services/api.js';
import { obterTemasParaRevisar } from '../../utils/flashcardsReview.js';
import { organizarMaterias } from '../../utils/flashcardsMaterias.js';

// Identidade própria para os baralhos: cartões ilustrados com CSS, sem capas dos Simulados.
function slugMateria(nome = '') {
  return String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const TOTAL_CARDS_SESSAO = 10;

const MATERIA_ALIASES = {
  'Língua Portuguesa': 'Português',
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

  const [flipped, setFlipped] =
    useState(new Set());

  const [filtro, setFiltro] =
    useState('Todas');

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');


  // =====================================================
  // HORA DOS FLASHCARDS
  // =====================================================

  const [modoJogo, setModoJogo] =
    useState(false);

  const [cardsDaSessao, setCardsDaSessao] =
    useState([]);

  const [indiceAtual, setIndiceAtual] =
    useState(0);

  const [cardVirado, setCardVirado] =
    useState(false);

  const [sessaoId, setSessaoId] =
    useState(null);

  const [respostasSessao, setRespostasSessao] =
    useState([]);

  const [finalizado, setFinalizado] =
    useState(false);

  const [iniciandoSessao, setIniciandoSessao] =
    useState(false);

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

    setFlipped(
      (atual) => {

        const novo =
          new Set(atual);

        if (
          novo.has(id)
        ) {

          novo.delete(id);

        } else {

          novo.add(id);

        }

        return novo;

      }
    );

  }


  // =====================================================
  // INICIAR HORA DOS FLASHCARDS
  // =====================================================

  async function iniciarHoraDosFlashcards() {

    if (
      cards.length <
      TOTAL_CARDS_SESSAO
    ) {

      setErro(
        `É necessário ter pelo menos ${TOTAL_CARDS_SESSAO} flashcards cadastrados.`
      );

      return;
    }

    try {

      setIniciandoSessao(true);

      setErro('');

      const token =
        obterToken();

      const selecionados =
        embaralharCards(
          cards
        ).slice(
          0,
          TOTAL_CARDS_SESSAO
        );

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

        setFinalizado(
          true
        );

      } else {

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

  function selecionarMateria(materia) {
    setFiltro(materia);
    setFlipped(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (
    modoJogo &&
    finalizado
  ) {

    return (

      <div className="flashcards-game-page">

        <div className="flashcards-game-header">

          <button
            type="button"
            className="flashcards-back-button"
            onClick={
              sairDoJogo
            }
          >
            ← Voltar para os flashcards
          </button>

          <div className="flashcards-game-title">

            <span>
              Hora dos Flashcards
            </span>

            <strong>
              Resultado da sessão
            </strong>

          </div>

        </div>


        <section className="flashcards-result">

          <div className="flashcards-result-intro">
            <div className="flashcards-result-icon" aria-hidden="true">✓</div>
            <span className="flashcards-result-eyebrow">HORA DO FLASHCARD</span>
            <h1>Desafio concluído!</h1>
            <p>Você finalizou sua rodada de {cardsDaSessao.length} flashcards.</p>
          </div>

          <div className="flashcards-result-score" role="img" aria-label={`${porcentagem}% de aproveitamento`}>
            <div className="flashcards-result-ring" style={{ '--score': `${porcentagem}%` }}>
              <div className="flashcards-result-ring-inner">
                <strong>{porcentagem}%</strong>
                <span>de aproveitamento</span>
              </div>
            </div>
          </div>

          <div className="flashcards-result-stats">

            <div className="flashcards-result-stat is-correct"><span>Acertos</span><strong>{acertos}</strong></div>
            <div className="flashcards-result-stat is-wrong"><span>Erros</span><strong>{erros}</strong></div>
          </div>


          {erros > 0 && (
            <div className="flashcards-review-suggestion">
              <h2>Vale revisar</h2>
              <p>Reforce os conteúdos em que você teve dificuldade:</p>
              <div className="flashcards-review-topics">
                {obterTemasParaRevisar(respostasSessao, cardsDaSessao).map((tema) => (
                  <span key={tema}>{tema}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flashcards-result-actions">

            <button
              type="button"
              className="flashcards-result-primary"
              onClick={
                jogarNovamente
              }
            >
              Jogar novamente
            </button>

            <button
              type="button"
              className="flashcards-result-secondary"
              onClick={
                sairDoJogo
              }
            >
              Voltar
            </button>

          </div>

        </section>

      </div>

    );

  }


  // =====================================================
  // TELA DA HORA DOS FLASHCARDS
  // =====================================================

  if (
    modoJogo
  ) {

    const cardAtual =
      cardsDaSessao[
        indiceAtual
      ];

    const progresso =
      cardsDaSessao.length > 0
        ? Math.round(
            (
              indiceAtual /
              cardsDaSessao.length
            ) * 100
          )
        : 0;

    return (

      <div className="flashcards-game-page">

        <div className="flashcards-game-header">

          <button
            type="button"
            className="flashcards-back-button"
            onClick={
              sairDoJogo
            }
            disabled={
              registrandoResposta
            }
          >
            ← Sair
          </button>

          <div className="flashcards-game-title">

            <span>
              Hora dos Flashcards
            </span>

            <strong>
              {indiceAtual + 1} de{' '}
              {cardsDaSessao.length}
            </strong>

          </div>

        </div>


        <div className="flashcards-progress-caption">
          <span>{indiceAtual} respondidos de {cardsDaSessao.length}</span>
          <strong>{progresso}% concluído</strong>
        </div>
        <div
          className="flashcards-progress"
          role="progressbar"
          aria-label="Progresso da sessão"
          aria-valuemin={0}
          aria-valuemax={cardsDaSessao.length}
          aria-valuenow={indiceAtual}
        >
          <div
            className="flashcards-progress-bar"
            style={{ width: `${Math.max(0, progresso)}%` }}
          />
        </div>


        <div className="flashcards-game-content">

          <div className="flashcards-game-context">
            <span className="flashcards-game-subject">{cardAtual.subject}</span>
            <p className="flashcards-game-subtitle">
              Leia a pergunta, vire o cartão e avalie sua resposta.
            </p>
          </div>


          <div
            className={
              `flashcard-game-card ${
                cardVirado
                  ? 'is-flipped'
                  : ''
              }`
            }

            style={{
              transform:
                `translateX(${deslocamento}px) rotate(${deslocamento * 0.04}deg)`,
            }}

            onClick={
              virarCardDoJogo
            }

            onPointerDown={
              iniciarArrasto
            }

            onPointerMove={
              moverArrasto
            }

            onPointerUp={
              finalizarArrasto
            }

            onPointerCancel={
              cancelarArrasto
            }

            role="button"

            tabIndex={0}

            onKeyDown={
              (event) => {

                if (
                  event.key ===
                    'Enter' ||
                  event.key ===
                    ' '
                ) {

                  event.preventDefault();

                  virarCardDoJogo();

                }

              }
            }

          >

            <div className="flashcard-game-inner">


              <div className="flashcard-game-face flashcard-game-front">

                <p>
                  {cardAtual.front}
                </p>

              </div>


              <div className="flashcard-game-face flashcard-game-back">

                <p>
                  {cardAtual.back}
                </p>

              </div>


            </div>

          </div>


          <div className="flashcards-swipe-hint">

            <span>
              ← Acertei
            </span>

            <span>
              Errei →
            </span>

          </div>


          <div className="flashcards-game-actions">

            <button
              type="button"
              className="flashcards-answer-button correct"
              onClick={() =>
                responderCard(true)
              }
              disabled={
                !cardVirado ||
                registrandoResposta
              }
            >
              {
                registrandoResposta
                  ? 'Registrando...'
                  : 'Acertei'
              }
            </button>


            <button
              type="button"
              className="flashcards-answer-button wrong"
              onClick={() =>
                responderCard(false)
              }
              disabled={
                !cardVirado ||
                registrandoResposta
              }
            >
              Errei
            </button>

          </div>


          {!cardVirado && (

            <p className="flashcards-game-error">
              Vire o card para liberar
              sua resposta.
            </p>

          )}


          {erro && (

            <p className="flashcards-game-error">
              {erro}
            </p>

          )}

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
                <p>
                  Teste seus conhecimentos com 10 perguntas de diferentes matérias. Vire os cartões, confira as respostas e descubra seu resultado.
                </p>
              </div>
              <button
                type="button"
                className="flashcards-game-start"
                onClick={iniciarHoraDosFlashcards}
                disabled={iniciandoSessao || cards.length < TOTAL_CARDS_SESSAO}
              >
                {iniciandoSessao ? 'Iniciando...' : 'Iniciar desafio'}
              </button>
            </div>
            {cards.length < TOTAL_CARDS_SESSAO && (
              <p className="flashcards-game-warning">
                São necessários {TOTAL_CARDS_SESSAO} flashcards para começar uma rodada.
                Atualmente, há {cards.length} disponíveis.
              </p>
            )}
          </section>

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
              <span className="flashcards-materia-hero-label">REVISÃO POR MATÉRIA</span>
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
