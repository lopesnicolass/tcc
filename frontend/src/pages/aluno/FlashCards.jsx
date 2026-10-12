import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useState } from 'react';
import { API_URL, obterToken } from '../../services/api.js';
import { alternarCardsVirados, obterTemasParaRevisar } from '../../utils/flashcardsReview.js';
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

  // Inclui as cinco matérias principais, inclusive quando ainda não há cartões.
  // Também mantém matérias adicionais cadastradas pelo administrador.
  const materiasDisponiveis = useMemo(() => organizarMaterias(cards), [cards]);
  const materiaSelecionada = filtro === 'Todas' ? null : filtro;

  function selecionarMateria(materia) {
    setFiltro(materia);
    setBusca('');
    setFlipped(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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


  // Revela/oculta somente os cartões presentes no filtro atual.
  const todosExibidosVirados =
    cardsFiltrados.length > 0 &&
    cardsFiltrados.every((card) => flipped.has(card.id));

  function alternarRespostasExibidas() {
    setFlipped((anterior) => alternarCardsVirados(anterior, cardsFiltrados));
  }

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
                  <span className="flashcard-side-label">PERGUNTA</span>
                  <span className="flashcard-face-text">{card.front}</span>
                  <span className="flashcard-face-hint">Toque para ver a resposta ↗</span>
                </span>

                <span className="flashcard-face back" aria-hidden={!virado}>
                  <span className="flashcard-side-label">RESPOSTA</span>
                  <span className="flashcard-face-text">{card.back}</span>
                  <span className="flashcard-face-hint">Toque para voltar ↩</span>
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
          <strong>{busca.trim() ? 'Nenhum card encontrado' : 'Nenhum flashcard nesta matéria'}</strong>
          <p>
            {busca.trim()
              ? 'Tente pesquisar outra palavra nesta matéria.'
              : 'Quando houver flashcards cadastrados nesta matéria, eles aparecerão aqui.'}
          </p>
          {busca.trim() && (
            <button type="button" className="flashcards-btn-secondary" onClick={() => setBusca('')}>
              Limpar pesquisa
            </button>
          )}
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

          <div className="materia-section-heading">

            <h2 className="materia-section-title">

              <span className="materia-section-dot" aria-hidden="true" />
              {materia}

            </h2>

            <span className="materia-section-count">
              {Array.from(conteudos.values()).reduce((total, grupo) => total + grupo.length, 0)} cards
            </span>

          </div>

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
            Você revisou {totalRespondido} de {cardsDaSessao.length} flashcards nesta sessão.
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


          {erros > 0 && (
            <div className="flashcards-review-suggestion">
              <h2>Vale revisar</h2>
              <p>Você pode retomar estes temas na lista de flashcards:</p>
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
            {materiaSelecionada ? 'REVISÃO POR MATÉRIA' : 'REVISÃO RÁPIDA'}
          </span>
          <h1>{materiaSelecionada || 'Flash Cards'}</h1>
          <p>
            {materiaSelecionada
              ? `Revise ${materiaSelecionada} com os cartões disponíveis e revele as respostas no seu ritmo.`
              : 'Escolha uma matéria para revisar ou pratique com uma rodada de perguntas para o Vestibulinho.'}
          </p>
        </div>
        <div className="flashcards-hero-badge" aria-label={`${materiaSelecionada ? contarPorMateria(materiaSelecionada) : cards.length} cartões disponíveis`}>
          <span aria-hidden="true">✦</span>
          <strong>{materiaSelecionada ? contarPorMateria(materiaSelecionada) : cards.length}</strong>
          <small>cards disponíveis</small>
        </div>
      </section>

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
                <span className="flashcards-game-eyebrow">GAMIFICAÇÃO</span>
                <h2>Hora dos Flashcards!</h2>
                <p>
                  Uma rodada com 10 perguntas sorteadas de todas as matérias.
                  Revele cada resposta e marque se acertou para acompanhar seu resultado.
                </p>
              </div>
              <button
                type="button"
                className="flashcards-game-start"
                onClick={iniciarHoraDosFlashcards}
                disabled={iniciandoSessao || cards.length < TOTAL_CARDS_SESSAO}
              >
                {iniciandoSessao ? 'Iniciando...' : 'Começar'}
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
              {materiasDisponiveis.map((materia, indice) => {
                const cardsDaMateria = cards.filter((card) => card.subject === materia);
                const quantidade = cardsDaMateria.length;
                const temas = [...new Set(cardsDaMateria.map((card) => card.content?.trim() || 'Revisão geral'))];
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
                      <span className="flashcards-deck-kicker">BARALHO {String(indice + 1).padStart(2, '0')}</span>
                      <strong className="flashcards-deck-title">{materia}</strong>
                      <span className="flashcards-deck-meta">
                        {quantidade} {quantidade === 1 ? 'cartão' : 'cartões'}
                        <span className="flashcards-deck-meta-dot" aria-hidden="true">·</span>
                        {temas.length} {temas.length === 1 ? 'assunto' : 'assuntos'}
                      </span>
                      <span className="flashcards-deck-topics">
                        {temas.length > 0
                          ? temas.slice(0, 2).join(' · ')
                          : 'Em breve, novos cartões de revisão'}
                      </span>
                      <span className="flashcards-deck-action">
                        Abrir baralho <span aria-hidden="true">→</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="flashcards-detalhe-topo">
            <button type="button" className="flashcards-voltar-materias" onClick={() => selecionarMateria('Todas')}>
              ← Voltar para matérias
            </button>
          </div>
          <div className="flashcards-study-toolbar">
            <div>
              <span className="flashcards-toolbar-eyebrow">SEUS FLASHCARDS</span>
              <h2 className="flashcards-toolbar-title">Cartões de {materiaSelecionada}</h2>
              <p className="flashcards-toolbar-subtitle">Clique em um cartão para revelar a resposta.</p>
            </div>
            <div className="flashcards-toolbar-total">
              <strong>{cardsFiltrados.length}</strong>
              <span>de {contarPorMateria(materiaSelecionada)} cards</span>
            </div>
          </div>

          <div className="flashcards-filter-panel" aria-label="Pesquisar cartões nesta matéria">
            <div className="flashcards-search">
              <span className="flashcards-search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder={`Pesquisar em ${materiaSelecionada}...`}
                aria-label={`Pesquisar flashcards de ${materiaSelecionada}`}
              />
              {busca && (
                <button type="button" className="flashcards-search-clear" onClick={() => setBusca('')} aria-label="Limpar pesquisa">×</button>
              )}
            </div>
            <div className="flashcards-filter-footer">
              <span role="status">
                {cardsFiltrados.length} {cardsFiltrados.length === 1 ? 'cartão encontrado' : 'cartões encontrados'}
              </span>
              <div className="flashcards-filter-actions">
                {busca && (
                  <button type="button" className="flashcards-link-button" onClick={() => setBusca('')}>
                    Limpar pesquisa
                  </button>
                )}
                <button
                  type="button"
                  className="flashcards-reveal-button"
                  onClick={alternarRespostasExibidas}
                  disabled={cardsFiltrados.length === 0}
                >
                  {todosExibidosVirados ? 'Mostrar perguntas' : 'Revelar respostas'}
                </button>
              </div>
            </div>
          </div>

          {!erro && renderFlashcardsOrganizados(cardsFiltrados)}
        </>
      )}
    </div>
  );
}
