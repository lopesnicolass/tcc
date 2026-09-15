import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const MATERIAS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
];

const TOTAL_CARDS_SESSAO = 10;


// =====================================================
// FUNÇÃO PARA EMBARALHAR
// =====================================================

function embaralharCards(lista) {
  const copia = [...lista];

  for (
    let i = copia.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      copia[i],
      copia[j],
    ] = [
      copia[j],
      copia[i],
    ];
  }

  return copia;
}


export default function FlashCards() {

  // =====================================================
  // CARDS NORMAIS
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
        localStorage.getItem(
          'etecamp_token'
        );

      const resposta =
        await fetch(
          `${API_URL}/flashcards`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Erro ao carregar flashcards.'
        );
      }

      const flashcards =
        Array.isArray(dados)
          ? dados
          : dados.flashcards || [];

      const cardsFormatados =
        flashcards
          .filter(
            (card) =>
              card.ativo === 1 ||
              card.ativo === true
          )
          .map((card) => ({
            id: card.id,
            subject: card.materia,
            front: card.primario,
            back: card.secundario,
          }));

      setCards(cardsFormatados);

    } catch (erro) {

      console.error(
        'Erro ao carregar flashcards:',
        erro
      );

      setErro(
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

    if (flipped.has(id)) {

      setFlipped((prev) => {

        const next =
          new Set(prev);

        next.delete(id);

        return next;
      });

      return;
    }

    setFlipped((prev) => {

      const next =
        new Set(prev);

      next.add(id);

      return next;
    });
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
        localStorage.getItem(
          'etecamp_token'
        );

      const selecionados =
        embaralharCards(cards)
          .slice(
            0,
            TOTAL_CARDS_SESSAO
          );

      const resposta =
        await fetch(
          `${API_URL}/flashcards/resultados/sessoes`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              totalCards:
                selecionados.length,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.erro ||
          'Não foi possível iniciar a sessão.'
        );
      }

      setSessaoId(
        dados.sessao.id
      );

      setCardsDaSessao(
        selecionados
      );

      setIndiceAtual(0);
      setCardVirado(false);
      setRespostasSessao([]);
      setFinalizado(false);

      setDeslocamento(0);
      setInicioArrasto(null);
      setArrastando(false);

      setModoJogo(true);

    } catch (erro) {

      console.error(
        'Erro ao iniciar sessão:',
        erro
      );

      setErro(
        erro.message ||
        'Não foi possível iniciar a sessão.'
      );

    } finally {

      setIniciandoSessao(false);
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
      (prev) => !prev
    );
  }


  // =====================================================
  // REGISTRAR RESPOSTA
  // =====================================================

  async function responderCard(acertou) {

    if (
      !sessaoId ||
      !cardVirado ||
      registrandoResposta ||
      finalizado
    ) {
      return;
    }

    const cardAtual =
      cardsDaSessao[indiceAtual];

    if (!cardAtual) {
      return;
    }

    try {

      setRegistrandoResposta(true);
      setErro('');

      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      const resposta =
        await fetch(
          `${API_URL}/flashcards/resultados/sessoes/${sessaoId}/respostas`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              flashcardId:
                cardAtual.id,

              materia:
                cardAtual.subject,

              acertou,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.erro ||
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

      setDeslocamento(0);
      setInicioArrasto(null);
      setArrastando(false);

      const proximoIndice =
        indiceAtual + 1;

      if (
        proximoIndice >=
        cardsDaSessao.length
      ) {

        await finalizarSessao();

        setFinalizado(true);

      } else {

        setIndiceAtual(
          proximoIndice
        );

        setCardVirado(false);
      }

    } catch (erro) {

      console.error(
        'Erro ao registrar resposta:',
        erro
      );

      setErro(
        erro.message ||
        'Não foi possível registrar sua resposta.'
      );

    } finally {

      setRegistrandoResposta(false);
    }
  }


  // =====================================================
  // FINALIZAR SESSÃO
  // =====================================================

  async function finalizarSessao() {

    if (!sessaoId) {
      return;
    }

    try {

      const token =
        localStorage.getItem(
          'etecamp_token'
        );

      const resposta =
        await fetch(
          `${API_URL}/flashcards/resultados/sessoes/${sessaoId}/finalizar`,
          {
            method: 'PUT',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {

        throw new Error(
          dados.erro ||
          'Erro ao finalizar sessão.'
        );
      }

    } catch (erro) {

      console.error(
        'Erro ao finalizar sessão:',
        erro
      );
    }
  }


  // =====================================================
  // SAIR DO JOGO
  // =====================================================

  function sairDoJogo() {

    setModoJogo(false);
    setSessaoId(null);
    setCardsDaSessao([]);
    setIndiceAtual(0);
    setCardVirado(false);
    setRespostasSessao([]);
    setFinalizado(false);

    setInicioArrasto(null);
    setDeslocamento(0);
    setArrastando(false);
  }


  // =====================================================
  // JOGAR NOVAMENTE
  // =====================================================

  async function jogarNovamente() {

    sairDoJogo();

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

    setArrastando(true);

    setInicioArrasto({
      x: event.clientX,
      y: event.clientY,
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

    const distancia =
      event.clientX -
      inicioArrasto.x;

    setDeslocamento(
      distancia
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

    setArrastando(false);
    setInicioArrasto(null);

    const limite = 120;

    if (
      Math.abs(distancia) <
      limite
    ) {

      setDeslocamento(0);

      return;
    }

    if (distancia < 0) {

      responderCard(true);

    } else {

      responderCard(false);
    }
  }


  // =====================================================
  // CANCELAR ARRASTO
  // =====================================================

  function cancelarArrasto() {

    setArrastando(false);
    setInicioArrasto(null);
    setDeslocamento(0);
  }


  // =====================================================
  // CONTAGEM POR MATÉRIA
  // =====================================================

  function contarPorMateria(materia) {

    return cards.filter(
      (card) =>
        card.subject === materia
    ).length;
  }


  // =====================================================
  // CARDS FILTRADOS
  // =====================================================

  const cardsFiltrados =
    useMemo(() => {

      if (
        filtro === 'Todas'
      ) {
        return cards;
      }

      return cards.filter(
        (card) =>
          card.subject ===
          filtro
      );

    }, [
      cards,
      filtro,
    ]);


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
    cardsParaExibir
  ) {

    if (
      cardsParaExibir.length === 0
    ) {

      return (
        <p className="flashcards-vazio">
          Nenhum flashcard encontrado.
        </p>
      );
    }

    return (
      <div className="flashcard-grid">

        {cardsParaExibir.map(
          (card) => (

            <div
              className={`flashcard ${
                flipped.has(card.id)
                  ? 'flipped'
                  : ''
              }`}
              key={card.id}
              onClick={() =>
                toggle(card.id)
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
  // CARREGANDO
  // =====================================================

  if (carregando) {

    return (
      <div>

        <div className="page-header">

          <div>

            <h1>
              Flash Cards
            </h1>

            <p>
              Revise os conteúdos de forma rápida com os Cards
            </p>

          </div>

        </div>

        <p>
          Carregando flashcards...
        </p>

      </div>
    );
  }


  // =====================================================
  // ERRO
  // =====================================================

  if (
    erro &&
    !modoJogo
  ) {

    return (
      <div>

        <div className="page-header">

          <div>

            <h1>
              Flash Cards
            </h1>

            <p>
              Revise os conteúdos de forma rápida com os Cards
            </p>

          </div>

        </div>

        <div className="flashcards-erro">

          <p>
            {erro}
          </p>

          <button
            className="flashcards-btn-primary"
            onClick={() => {

              setErro('');

              carregarFlashcards();

            }}
          >
            Tentar novamente
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // MODO JOGO
  // =====================================================

  if (modoJogo) {

    const cardAtual =
      cardsDaSessao[indiceAtual];

    // ===================================================
    // RESULTADO FINAL
    // ===================================================

    if (finalizado) {

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
              ← Voltar para Flash Cards
            </button>

          </div>


          <div className="flashcards-result">

            <div className="flashcards-result-icon">
              ✓
            </div>

            <span className="flashcards-game-eyebrow">
              Hora dos Flashcards
            </span>

            <h1>
              Sessão concluída!
            </h1>

            <p>
              Você terminou os 10 flashcards.
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
                  Cards
                </span>

                <strong>
                  {totalRespondido}
                </strong>

              </div>

            </div>


            <div className="flashcards-result-actions">

              <button
                type="button"
                className="flashcards-btn-secondary"
                onClick={
                  sairDoJogo
                }
              >
                Voltar
              </button>

              <button
                type="button"
                className="flashcards-btn-primary"
                onClick={
                  jogarNovamente
                }
              >
                Jogar novamente
              </button>

            </div>

          </div>

        </div>
      );
    }


    // ===================================================
    // CARD ATUAL
    // ===================================================

    if (!cardAtual) {
      return null;
    }


    const progresso =
      (
        indiceAtual /
        cardsDaSessao.length
      ) * 100;


    const estiloArrasto = {
      transform:
        `translateX(${deslocamento}px) rotate(${deslocamento * 0.04}deg)`,

      transition:
        arrastando
          ? 'none'
          : 'transform 0.2s ease',
    };


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
              Hora dos Flashcards!
            </span>

            <strong>
              {indiceAtual + 1}
              {' '}
              de
              {' '}
              {cardsDaSessao.length}
            </strong>

          </div>

        </div>


        <div className="flashcards-progress">

          <div
            className="flashcards-progress-bar"
            style={{
              width:
                `${progresso}%`,
            }}
          />

        </div>


        <div className="flashcards-game-content">

          <p className="flashcards-game-subtitle">
            Pense na resposta antes de virar o card.
          </p>


          <div
            className={`flashcard-game-card ${
              cardVirado
                ? 'is-flipped'
                : ''
            } ${
              arrastando
                ? 'is-dragging'
                : ''
            }`}
            style={estiloArrasto}
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
          >

            <div className="flashcard-game-inner">

              <div className="flashcard-game-face flashcard-game-front">

                <span className="flashcard-game-label">
                  {cardAtual.subject}
                </span>

                <p>
                  {cardAtual.front}
                </p>

                <small>
                  Clique para virar
                </small>

              </div>


              <div className="flashcard-game-face flashcard-game-back">

                <span className="flashcard-game-label">
                  Resposta
                </span>

                <p>
                  {cardAtual.back}
                </p>

              </div>

            </div>

          </div>


          {cardVirado && (

            <div className="flashcards-swipe-hint">

              <span>
                ← Acertei
              </span>

              <span>
                Errei →
              </span>

            </div>

          )}


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
              ← Acertei
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
              Errei →
            </button>

          </div>


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
    <div>

      <div className="page-header">

        <div>

          <h1>
            Flash Cards
          </h1>

          <p>
            Revise os conteúdos de forma rápida com os Cards
          </p>

        </div>

      </div>


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
            {iniciandoSessao
              ? 'Iniciando...'
              : 'Começar'}
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
          FILTROS
      ================================================= */}

      <div className="materia-tabs">

        <button
          className={`materia-tab ${
            filtro === 'Todas'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setFiltro('Todas')
          }
        >
          Todas{' '}

          <span className="materia-tab-count">
            {cards.length}
          </span>

        </button>


        {MATERIAS.map(
          (materia) => (

            <button
              key={materia}
              className={`materia-tab ${
                filtro === materia
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setFiltro(materia)
              }
            >
              {materia}{' '}

              <span className="materia-tab-count">
                {contarPorMateria(
                  materia
                )}
              </span>

            </button>

          )
        )}

      </div>


      {/* =================================================
          LISTAGEM NORMAL
      ================================================= */}

      {filtro === 'Todas' ? (

        MATERIAS.map(
          (materia) => {

            const cardsDaMateria =
              cards.filter(
                (card) =>
                  card.subject ===
                  materia
              );

            if (
              cardsDaMateria.length ===
              0
            ) {
              return null;
            }

            return (
              <div
                className="materia-section"
                key={materia}
              >

                <h2 className="materia-section-title">
                  {materia}
                </h2>

                {renderGrid(
                  cardsDaMateria
                )}

              </div>
            );
          }
        )

      ) : (

        <div className="materia-section">

          {renderGrid(
            cardsFiltrados
          )}

        </div>

      )}

    </div>
  );
}