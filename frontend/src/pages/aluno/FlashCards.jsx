import '../../styles/aluno/FlashCards.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

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
            subjectId: card.materia_id || null,
            contentId: card.topico_id || null,
            content: card.conteudo || '',
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

 const texto = await resposta.text();

let dados = {};

try {
  dados = texto
    ? JSON.parse(texto)
    : {};
} catch {
  throw new Error(
    `O servidor não retornou JSON. Status: ${resposta.status}. Verifique se a rota de resultados dos flashcards existe no backend.`
  );
}

if (!resposta.ok) {
  throw new Error(
    dados.erro ||
    dados.mensagem ||
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

   const texto = await resposta.text();

let dados = {};

try {
  dados = texto
    ? JSON.parse(texto)
    : {};
} catch {
  throw new Error(
    `O servidor não retornou JSON. Status: ${resposta.status}.`
  );
}

if (!resposta.ok) {
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

const texto = await resposta.text();

let dados = {};

try {
  dados = texto
    ? JSON.parse(texto)
    : {};
} catch {
  throw new Error(
    `O servidor não retornou JSON. Status: ${resposta.status}.`
  );
}

if (!resposta.ok) {
  throw new Error(
    dados.erro ||
    dados.mensagem ||
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
  // MATÉRIAS DISPONÍVEIS
  // =====================================================

  const materiasDisponiveis =
    useMemo(() => {
      const nomes = [];
      const vistos = new Set();

      cards.forEach((card) => {
        if (
          card.subject &&
          !vistos.has(card.subject)
        ) {
          vistos.add(card.subject);
          nomes.push(card.subject);
        }
      });

      return nomes;
    }, [cards]);


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

      const termo =
        busca.trim().toLowerCase();

      return cards.filter((card) => {

        const correspondeMateria =
          filtro === 'Todas' ||
          card.subject === filtro;

        const correspondeBusca =
          !termo ||
          card.front.toLowerCase().includes(termo) ||
          card.back.toLowerCase().includes(termo) ||
          card.subject.toLowerCase().includes(termo) ||
          card.content.toLowerCase().includes(termo);

        return correspondeMateria && correspondeBusca;
      });

    }, [
      cards,
      filtro,
      busca,
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
  // LISTAGEM POR MATÉRIA E CONTEÚDO
  // =====================================================

  function renderFlashcardsOrganizados(
    cardsParaExibir
  ) {
    if (!cardsParaExibir.length) {
      return (
        <p className="flashcards-vazio">
          Nenhum flashcard encontrado.
        </p>
      );
    }

    const grupos = new Map();

    cardsParaExibir.forEach((card) => {
      const materia =
        card.subject || 'Sem matéria';
      const conteudo =
        card.content || 'Conteúdo não definido';

      if (!grupos.has(materia)) {
        grupos.set(materia, new Map());
      }

      const gruposConteudo =
        grupos.get(materia);

      if (!gruposConteudo.has(conteudo)) {
        gruposConteudo.set(conteudo, []);
      }

      gruposConteudo
        .get(conteudo)
        .push(card);
    });

    return Array.from(grupos.entries()).map(
      ([materia, conteudos]) => (
        <section
          className="materia-section"
          key={materia}
        >
          <h2 className="materia-section-title">
            {materia}
          </h2>

          {Array.from(
            conteudos.entries()
          ).map(([conteudo, cardsDoConteudo]) => (
            <div
              className="flashcards-content-section"
              key={`${materia}-${conteudo}`}
            >
              <h3 className="flashcards-content-title">
                {conteudo}
              </h3>

              {renderGrid(cardsDoConteudo)}
            </div>
          ))}
        </section>
      )
    );
  }


  // =====================================================
  // TELA NORMAL
  // =====================================================

  return (
    <div>

      <section className="flashcards-hero">

        <div className="flashcards-hero-content">
          <span className="flashcards-hero-eyebrow">REVISÃO RÁPIDA</span>
          <h1>Flash Cards</h1>
          <p>Revise os conteúdos de forma rápida e teste seus conhecimentos para o Vestibulinho.</p>
        </div>

        <div className="flashcards-hero-badge" aria-hidden="true">
          <span>✦</span>
          <strong>{cards.length}</strong>
          <small>cards disponíveis</small>
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
          PESQUISA E FILTROS
      ================================================= */}

      <div className="flashcards-search">

        <span className="flashcards-search-icon" aria-hidden="true">
          ⌕
        </span>

        <input
          type="search"
          value={busca}
          onChange={(event) =>
            setBusca(event.target.value)
          }
          placeholder="Pesquisar flashcards..."
          aria-label="Pesquisar flashcards"
        />

        {busca && (
          <button
            type="button"
            className="flashcards-search-clear"
            onClick={() => setBusca('')}
            aria-label="Limpar pesquisa"
          >
            ×
          </button>
        )}

      </div>

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


        {materiasDisponiveis.map(
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

      {filtro === 'Todas' && !busca.trim()
        ? renderFlashcardsOrganizados(cardsFiltrados)
        : renderFlashcardsOrganizados(cardsFiltrados)}

    </div>
  );
}