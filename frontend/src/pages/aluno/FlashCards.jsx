import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const TOTAL_CARDS_SESSAO = 10;

const MATERIA_ALIASES = {
  'Língua Portuguesa': 'Português',
  'Ciências da Natureza': 'Ciências',
};

function normalizarMateria(materia) {
  return MATERIA_ALIASES[materia] || materia;
}

function obterToken() {
  return (
    localStorage.getItem('etecamp_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
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

  const [busca, setBusca] =
    useState('');

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

  const materiasDisponiveis =
    useMemo(
      () => {

        const nomes =
          [];

        const vistos =
          new Set();

        cards.forEach(
          (card) => {

            if (
              card.subject &&
              !vistos.has(
                card.subject
              )
            ) {

              vistos.add(
                card.subject
              );

              nomes.push(
                card.subject
              );

            }

          }
        );

        return nomes;

      },
      [cards]
    );


  // =====================================================
  // CONTAGEM POR MATÉRIA
  // =====================================================

  function contarPorMateria(
    materia
  ) {

    return cards.filter(
      (card) =>
        card.subject ===
        materia
    ).length;

  }


  // =====================================================
  // CARDS FILTRADOS
  // =====================================================

  const cardsFiltrados =
    useMemo(
      () => {

        const termo =
          busca
            .trim()
            .toLowerCase();

        return cards.filter(
          (card) => {

            const correspondeMateria =
              filtro === 'Todas' ||
              card.subject ===
                filtro;

            const correspondeBusca =
              !termo ||

              card.front
                .toLowerCase()
                .includes(
                  termo
                ) ||

              card.back
                .toLowerCase()
                .includes(
                  termo
                ) ||

              card.subject
                .toLowerCase()
                .includes(
                  termo
                ) ||

              card.content
                .toLowerCase()
                .includes(
                  termo
                );

            return (
              correspondeMateria &&
              correspondeBusca
            );

          }
        );

      },
      [
        cards,
        filtro,
        busca,
      ]
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

  function renderGrid(
    lista
  ) {

    if (!lista.length) {

      return (
        <p className="flashcards-vazio">
          Nenhum flashcard encontrado.
        </p>
      );

    }

    return (
      <div className="flashcard-grid">

        {lista.map(
          (card) => (

            <div
              className={
                `flashcard ${
                  flipped.has(
                    card.id
                  )
                    ? 'flipped'
                    : ''
                }`
              }

              key={
                card.id
              }

              onClick={() =>
                toggle(
                  card.id
                )
              }
            >

              <div className="flashcard-inner">

                <div className="flashcard-face front">

                  {card.front}

                </div>

                <div className="flashcard-face back">

                  {card.back}

                </div>

              </div>

            </div>

          )
        )}

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
        <p className="flashcards-vazio">
          Nenhum flashcard encontrado.
        </p>
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
          className="materia-section"
          key={
            materia
          }
        >

          <h2 className="materia-section-title">

            {materia}

          </h2>

          {Array.from(
            conteudos.entries()
          ).map(
            ([
              conteudo,
              cardsDoConteudo,
            ]) => (

              <div
                className="flashcards-content-section"
                key={
                  `${materia}-${conteudo}`
                }
              >

                <h3 className="flashcards-content-title">

                  {conteudo}

                </h3>

                {renderGrid(
                  cardsDoConteudo
                )}

              </div>

            )
          )}

        </section>

      )
    );

  }


  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {

    return (
      <div className="flashcards-erro">

        <p>
          Carregando flashcards...
        </p>

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


        <div className="flashcards-progress">

          <div
            className="flashcards-progress-bar"
            style={{
              width:
                '100%',
            }}
          />

        </div>


        <section className="flashcards-result">

          <div className="flashcards-result-icon">
            ✓
          </div>

          <h1>
            Sessão finalizada!
          </h1>

          <p>
            Você respondeu aos 10
            flashcards da sessão.
          </p>

          <div className="flashcards-result-score">

            <strong>
              {porcentagem}%
            </strong>

            <span>
              de aproveitamento
            </span>

          </div>


          <div className="flashcards-result-stats">

            <div className="flashcards-result-stat">

              <span>
                Acertos
              </span>

              <strong>
                {acertos}
              </strong>

            </div>


            <div className="flashcards-result-stat">

              <span>
                Erros
              </span>

              <strong>
                {erros}
              </strong>

            </div>


            <div className="flashcards-result-stat">

              <span>
                Respondidos
              </span>

              <strong>
                {totalRespondido}
              </strong>

            </div>

          </div>


          <div className="flashcards-result-actions">

            <button
              type="button"
              className="flashcards-answer-button correct"
              onClick={
                jogarNovamente
              }
            >
              Jogar novamente
            </button>

            <button
              type="button"
              className="flashcards-answer-button wrong"
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


        <div className="flashcards-progress">

          <div
            className="flashcards-progress-bar"
            style={{
              width:
                `${Math.max(
                  0,
                  progresso
                )}%`,
            }}
          />

        </div>


        <div className="flashcards-game-content">

          <p className="flashcards-game-subtitle">
            Toque no card para revelar
            a resposta.
          </p>


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

                <span className="flashcard-game-label">
                  PERGUNTA
                </span>

                <p>
                  {cardAtual.front}
                </p>

                <small>
                  {cardAtual.subject}
                </small>

              </div>


              <div className="flashcard-game-face flashcard-game-back">

                <span className="flashcard-game-label">
                  RESPOSTA
                </span>

                <p>
                  {cardAtual.back}
                </p>

                <small>
                  {
                    cardAtual.content ||
                    cardAtual.subject
                  }
                </small>

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

      <section className="flashcards-hero">

        <div className="flashcards-hero-content">

          <span className="flashcards-hero-eyebrow">
            REVISÃO RÁPIDA
          </span>

          <h1>
            Flash Cards
          </h1>

          <p>
            Revise os conteúdos de forma rápida
            e teste seus conhecimentos para o
            Vestibulinho.
          </p>

        </div>


        <div
          className="flashcards-hero-badge"
          aria-hidden="true"
        >

          <span>
            ✦
          </span>

          <strong>
            {cards.length}
          </strong>

          <small>
            cards disponíveis
          </small>

        </div>

      </section>


      {/* =================================================
          HORA DOS FLASHCARDS
      ================================================= */}

      <section className="flashcards-game-banner">

        <div className="flashcards-game-banner-content">

          <div>

            <span className="flashcards-game-eyebrow">
              GAMIFICAÇÃO
            </span>

            <h2>
              Hora dos Flashcards!
            </h2>

            <p>
              Teste seus conhecimentos com 10
              flashcards. Vire o card e indique
              se você acertou ou errou.
            </p>

          </div>


          <button
            type="button"
            className="flashcards-game-start"
            onClick={
              iniciarHoraDosFlashcards
            }
            disabled={
              iniciandoSessao ||
              cards.length <
                TOTAL_CARDS_SESSAO
            }
          >
            {
              iniciandoSessao
                ? 'Iniciando...'
                : 'Começar'
            }
          </button>

        </div>


        {cards.length <
          TOTAL_CARDS_SESSAO && (

          <p className="flashcards-game-warning">
            É necessário ter pelo menos 10
            flashcards cadastrados para jogar.
          </p>

        )}

      </section>


      {/* =================================================
          PESQUISA
      ================================================= */}

      <div className="flashcards-search">

        <span
          className="flashcards-search-icon"
          aria-hidden="true"
        >
          ⌕
        </span>


        <input
          type="search"
          value={
            busca
          }
          onChange={
            (event) =>
              setBusca(
                event.target.value
              )
          }
          placeholder="Pesquisar flashcards..."
          aria-label="Pesquisar flashcards"
        />


        {busca && (

          <button
            type="button"
            className="flashcards-search-clear"
            onClick={() =>
              setBusca('')
            }
            aria-label="Limpar pesquisa"
          >
            ×
          </button>

        )}

      </div>


      {/* =================================================
          MATÉRIAS
      ================================================= */}

      <div className="materia-tabs">

        <button
          type="button"
          className={
            `materia-tab ${
              filtro ===
              'Todas'
                ? 'active'
                : ''
            }`
          }
          onClick={() =>
            setFiltro(
              'Todas'
            )
          }
        >

          Todas{' '}

          <span className="materia-tab-count">
            {cards.length}
          </span>

        </button>


        {materiasDisponiveis.map(
          (materia) => (

            <button
              type="button"
              key={
                materia
              }
              className={
                `materia-tab ${
                  filtro ===
                  materia
                    ? 'active'
                    : ''
                }`
              }
              onClick={() =>
                setFiltro(
                  materia
                )
              }
            >

              {materia}{' '}

              <span className="materia-tab-count">

                {
                  contarPorMateria(
                    materia
                  )
                }

              </span>

            </button>

          )
        )}

      </div>


      {/* =================================================
          ERRO
      ================================================= */}

      {erro && (

        <div className="flashcards-erro">

          <p>
            {erro}
          </p>

          <button
            type="button"
            className="flashcards-btn-primary"
            onClick={
              carregarFlashcards
            }
          >
            Tentar novamente
          </button>

        </div>

      )}


      {/* =================================================
          LISTAGEM
      ================================================= */}

      {!erro &&
        renderFlashcardsOrganizados(
          cardsFiltrados
        )}

    </div>

  );

}