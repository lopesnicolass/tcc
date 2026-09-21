import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubjectStyle } from '../../utils/subjects.js';
import SubjectIcon from '../../components/cu.jsx';
import Icon from '../../components/Icon.jsx';
import '../../styles/aluno/PaginaConteudo.css';
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obterToken() {
  return localStorage.getItem('etecamp_token');
}

function youtubeEmbed(url) {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes('youtube.com') &&
      parsed.pathname === '/watch'
    ) {
      const id = parsed.searchParams.get('v');

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname
        .replace('/', '')
        .trim();

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (parsed.pathname.startsWith('/embed/')) {
      return url;
    }

    return '';
  } catch {
    return '';
  }
}

function normalizarDados(bloco) {
  let dados = bloco?.dados;

  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados);
    } catch {
      dados = {};
    }
  }

  if (
    !dados ||
    typeof dados !== 'object' ||
    Array.isArray(dados)
  ) {
    return {};
  }

  return dados;
}

function formatarIds(valor) {
  if (!valor) {
    return [];
  }

  return String(valor)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PaginaConteudo() {
  const { topicoId } = useParams();
  const navigate = useNavigate();

  const [pagina, setPagina] = useState(null);
  const [blocos, setBlocos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [estudado, setEstudado] = useState(false);
  const [salvandoEstudo, setSalvandoEstudo] = useState(false);

  /*
   * =========================================================
   * FLASHCARDS
   * =========================================================
   */

  const [flashcards, setFlashcards] = useState([]);
  const [flashcardAtual, setFlashcardAtual] = useState(0);
  const [mostrarResposta, setMostrarResposta] =
    useState(false);
  const [carregandoFlashcards, setCarregandoFlashcards] =
    useState(false);

  const topicoNumero = Number(topicoId);

  /*
   * =========================================================
   * CARREGAR PÁGINA
   * =========================================================
   */

  useEffect(() => {
    async function carregarPagina() {
      try {
        setCarregando(true);
        setErro('');

        const token = obterToken();

        const resposta = await fetch(
          `${API_URL}/paginas-conteudo/topico/${topicoNumero}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        const dados = await resposta
          .json()
          .catch(() => ({}));

        if (!resposta.ok) {
          throw new Error(
            dados.erro ||
              dados.mensagem ||
              'Não foi possível carregar este conteúdo.'
          );
        }

        if (!dados?.pagina) {
          setPagina(null);
          setBlocos([]);
          setEstudado(false);
          return;
        }

        setPagina(dados.pagina);

        setBlocos(
          Array.isArray(dados.blocos)
            ? [...dados.blocos].sort(
                (a, b) =>
                  Number(a.ordem || 0) -
                  Number(b.ordem || 0)
              )
            : []
        );

        if (token) {
          const respostaProgresso =
            await fetch(
              `${API_URL}/conteudos/progresso`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const dadosProgresso =
            await respostaProgresso
              .json()
              .catch(() => ({}));

          if (
            respostaProgresso.ok &&
            Array.isArray(
              dadosProgresso.topicos
            )
          ) {
            const registro =
              dadosProgresso.topicos.find(
                (item) =>
                  Number(item.topico_id) ===
                  topicoNumero
              );

            setEstudado(
              Boolean(registro?.estudado)
            );
          }
        }
      } catch (error) {
        console.error(
          'Erro ao carregar página de conteúdo:',
          error
        );

        setErro(
          error.message ||
            'Não foi possível carregar este conteúdo.'
        );
      } finally {
        setCarregando(false);
      }
    }

    if (
      Number.isInteger(topicoNumero) &&
      topicoNumero > 0
    ) {
      carregarPagina();
    } else {
      setErro('Tópico inválido.');
      setCarregando(false);
    }
  }, [topicoNumero]);

  /*
   * =========================================================
   * CARREGAR FLASHCARDS
   * =========================================================
   */

  async function carregarFlashcards(idsSelecionados = []) {
    try {
      setCarregandoFlashcards(true);

      const token = obterToken();

      const resposta = await fetch(
        `${API_URL}/flashcards`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      const dados = await resposta
        .json()
        .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            dados.mensagem ||
            'Não foi possível carregar os flashcards.'
        );
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.flashcards)
          ? dados.flashcards
          : [];

      let cardsAtivos = lista.filter(
        (card) =>
          card.ativo === 1 ||
          card.ativo === true ||
          card.ativo === undefined
      );

      /*
       * Se o administrador informou IDs no bloco,
       * usamos somente aqueles flashcards.
       *
       * Se não informou IDs, usamos todos os
       * flashcards ativos.
       */
      if (idsSelecionados.length > 0) {
        const ids = new Set(
          idsSelecionados.map((id) =>
            Number(id)
          )
        );

        cardsAtivos = cardsAtivos.filter(
          (card) =>
            ids.has(Number(card.id))
        );
      }

      const cardsFormatados =
        cardsAtivos.map((card) => ({
          id: card.id,
          materia: card.materia || '',
          pergunta:
            card.primario ||
            card.pergunta ||
            '',
          resposta:
            card.secundario ||
            card.resposta ||
            '',
        }));

      setFlashcards(cardsFormatados);
      setFlashcardAtual(0);

      /*
       * IMPORTANTE:
       * sempre começa com a resposta escondida.
       */
      setMostrarResposta(false);
    } catch (error) {
      console.error(
        'Erro ao carregar flashcards:',
        error
      );

      setFlashcards([]);
    } finally {
      setCarregandoFlashcards(false);
    }
  }

  /*
   * Quando os blocos da página chegam,
   * verifica se existe algum bloco de flashcards
   * e carrega os cards relacionados.
   */
  useEffect(() => {
    if (!Array.isArray(blocos)) {
      return;
    }

    const blocoFlashcards =
      blocos.find(
        (bloco) =>
          bloco.tipo === 'flashcards'
      );

    if (!blocoFlashcards) {
      setFlashcards([]);
      setFlashcardAtual(0);
      setMostrarResposta(false);
      return;
    }

    const dados =
      normalizarDados(
        blocoFlashcards
      );

    const ids =
      formatarIds(dados.ids);

    carregarFlashcards(ids);
  }, [blocos]);

  /*
   * =========================================================
   * FLASHCARD ATUAL
   * =========================================================
   */

  const cardAtual =
    flashcards.length > 0
      ? flashcards[flashcardAtual]
      : null;

  /*
   * =========================================================
   * MOSTRAR / ESCONDER RESPOSTA
   * =========================================================
   */

  function alternarResposta() {
    setMostrarResposta(
      (atual) => !atual
    );
  }

  /*
   * =========================================================
   * PRÓXIMO FLASHCARD
   * =========================================================
   */

  function proximoFlashcard() {
    if (
      flashcards.length === 0
    ) {
      return;
    }

    setFlashcardAtual(
      (atual) =>
        Math.min(
          atual + 1,
          flashcards.length - 1
        )
    );

    /*
     * CORREÇÃO:
     * quando muda de card, a resposta
     * obrigatoriamente volta a ficar escondida.
     */
    setMostrarResposta(false);
  }

  /*
   * =========================================================
   * FLASHCARD ANTERIOR
   * =========================================================
   */

  function anteriorFlashcard() {
    if (
      flashcards.length === 0
    ) {
      return;
    }

    setFlashcardAtual(
      (atual) =>
        Math.max(
          atual - 1,
          0
        )
    );

    /*
     * CORREÇÃO:
     * quando volta de card, a resposta
     * também começa escondida.
     */
    setMostrarResposta(false);
  }

  /*
   * =========================================================
   * MARCAR COMO ESTUDADO
   * =========================================================
   */

  async function alternarEstudado() {
    const token = obterToken();

    if (!token) {
      setErro(
        'Sua sessão expirou. Faça login novamente.'
      );
      return;
    }

    const novoStatus =
      !estudado;

    try {
      setSalvandoEstudo(true);
      setErro('');

      const resposta = await fetch(
        `${API_URL}/conteudos/progresso/${topicoNumero}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            estudado:
              novoStatus,
          }),
        }
      );

      const dados =
        await resposta
          .json()
          .catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            dados.mensagem ||
            'Não foi possível atualizar seu progresso.'
        );
      }

      setEstudado(
        novoStatus
      );
    } catch (error) {
      console.error(
        'Erro ao atualizar progresso:',
        error
      );

      setErro(
        error.message ||
          'Não foi possível atualizar seu progresso.'
      );
    } finally {
      setSalvandoEstudo(false);
    }
  }

  /*
   * =========================================================
   * ESTILO DA MATÉRIA
   * =========================================================
   */

  const materiaStyle =
    useMemo(() => {
      return getSubjectStyle(
        pagina?.materia || ''
      );
    }, [pagina?.materia]);

  /*
   * =========================================================
   * RENDERIZAR BLOCO
   * =========================================================
   */

  function renderBloco(bloco) {
    const dados =
      normalizarDados(bloco);

    switch (bloco.tipo) {
      /*
       * =====================================================
       * TEXTO
       * =====================================================
       */

      case 'texto':
        return (
          <section
            className="pagina-content-block pagina-text-block"
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {dados.texto && (
              <div className="pagina-rich-text">
                {dados.texto}
              </div>
            )}
          </section>
        );

      /*
       * =====================================================
       * DESTAQUE
       * =====================================================
       */

      case 'destaque':
        return (
          <section
            className={`pagina-content-block pagina-highlight ${
              dados.variante ||
              'info'
            }`}
            key={bloco.id}
          >
            <div className="pagina-highlight-icon">
              <Icon
                name="highlight"
                size={21}
              />
            </div>

            <div className="pagina-highlight-content">
              <strong>
                {dados.titulo ||
                  'Destaque'}
              </strong>

              <span>
                {dados.texto ||
                  'Confira esta informação importante.'}
              </span>
            </div>
          </section>
        );

      /*
       * =====================================================
       * VÍDEO
       * =====================================================
       */

      case 'video': {
        const videoUrl =
          youtubeEmbed(
            dados.url
          );

        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {videoUrl ? (
              <div className="pagina-video">
                <iframe
                  src={videoUrl}
                  title={
                    dados.titulo ||
                    'Videoaula'
                  }
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="pagina-block-placeholder">
                O vídeo deste conteúdo ainda
                não foi configurado.
              </div>
            )}

            {dados.descricao && (
              <p className="pagina-muted">
                {dados.descricao}
              </p>
            )}
          </section>
        );
      }

      /*
       * =====================================================
       * IMAGEM
       * =====================================================
       */

      case 'imagem':
        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {dados.url ? (
              <figure className="pagina-image">
                <img
                  src={dados.url}
                  alt={
                    dados.alt ||
                    dados.titulo ||
                    ''
                  }
                  loading="lazy"
                />

                {dados.legenda && (
                  <figcaption>
                    {dados.legenda}
                  </figcaption>
                )}
              </figure>
            ) : (
              <div className="pagina-block-placeholder">
                A imagem deste conteúdo ainda
                não foi configurada.
              </div>
            )}
          </section>
        );

      /*
       * =====================================================
       * PDF
       * =====================================================
       */

      case 'pdf':
        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {dados.descricao && (
              <p className="pagina-muted">
                {dados.descricao}
              </p>
            )}

            {dados.url ? (
              <a
                href={dados.url}
                target="_blank"
                rel="noreferrer"
                className="pagina-resource"
              >
                <span className="pagina-resource-icon">
                  <Icon
                    name="file"
                    size={21}
                  />
                </span>

                <span className="pagina-resource-copy">
                  <strong>
                    Abrir material em PDF
                  </strong>

                  <small>
                    O arquivo será aberto em
                    uma nova aba.
                  </small>
                </span>

                <Icon
                  name="external"
                  size={17}
                />
              </a>
            ) : (
              <div className="pagina-block-placeholder">
                O PDF deste conteúdo ainda
                não foi configurado.
              </div>
            )}
          </section>
        );

      /*
       * =====================================================
       * LISTA
       * =====================================================
       */

      case 'lista':
        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {Array.isArray(
              dados.itens
            ) && (
              <ul className="pagina-list">
                {dados.itens
                  .filter(
                    (item) =>
                      String(item).trim()
                  )
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={index}
                      >
                        <span className="pagina-list-marker">
                          {index + 1}
                        </span>

                        <span>
                          {item}
                        </span>
                      </li>
                    )
                  )}
              </ul>
            )}
          </section>
        );

      /*
       * =====================================================
       * FLASHCARDS
       * =====================================================
       */

      case 'flashcards':
        return (
          <section
            className="pagina-content-block pagina-resource-block pagina-flashcards-block"
            key={bloco.id}
          >
            <div className="pagina-resource-block-icon">
              <Icon
                name="layers"
                size={23}
              />
            </div>

            <div className="pagina-resource-block-copy">
              <h2>
                {dados.titulo ||
                  'Flashcards para revisar'}
              </h2>

              <p>
                {dados.descricao ||
                  'Revise este assunto com flashcards interativos.'}
              </p>
            </div>

            {carregandoFlashcards ? (
              <div className="pagina-flashcards-loading">
                Carregando flashcards...
              </div>
            ) : flashcards.length === 0 ? (
              <div className="pagina-block-placeholder">
                Nenhum flashcard relacionado foi encontrado.
              </div>
            ) : (
              <div className="pagina-flashcards-player">

                <div className="pagina-flashcards-counter">
                  CARD {flashcardAtual + 1} DE{' '}
                  {flashcards.length}
                </div>

                <div
                  className={`pagina-flashcard ${
                    mostrarResposta
                      ? 'show-answer'
                      : ''
                  }`}
                >
                  <span className="pagina-flashcard-label">
                    {mostrarResposta
                      ? 'RESPOSTA'
                      : 'PERGUNTA'}
                  </span>

                  <div className="pagina-flashcard-content">
                    <strong>
                      {mostrarResposta
                        ? cardAtual?.resposta
                        : cardAtual?.pergunta}
                    </strong>
                  </div>
                </div>

                <div className="pagina-flashcard-actions">

                  <button
                    type="button"
                    className="pagina-secondary-button"
                    onClick={
                      alternarResposta
                    }
                  >
                    {mostrarResposta
                      ? 'Esconder resposta'
                      : 'Mostrar resposta'}
                  </button>

                  <div className="pagina-flashcard-navigation">

                    <button
                      type="button"
                      className="pagina-secondary-button"
                      onClick={
                        anteriorFlashcard
                      }
                      disabled={
                        flashcardAtual === 0
                      }
                    >
                      ← Anterior
                    </button>

                    <button
                      type="button"
                      className="pagina-secondary-button"
                      onClick={
                        proximoFlashcard
                      }
                      disabled={
                        flashcardAtual ===
                        flashcards.length - 1
                      }
                    >
                      Próximo →
                    </button>

                  </div>

                </div>

              </div>
            )}
          </section>
        );

      /*
       * =====================================================
       * QUESTÕES
       * =====================================================
       */

      case 'questoes': {
        const ids =
          formatarIds(
            dados.ids
          );

        return (
          <section
            className="pagina-content-block pagina-resource-block"
            key={bloco.id}
          >
            <div className="pagina-resource-block-icon">
              <Icon
                name="question"
                size={23}
              />
            </div>

            <div className="pagina-resource-block-copy">
              <h2>
                {dados.titulo ||
                  'Pratique'}
              </h2>

              <p>
                {dados.descricao ||
                  'Resolva questões para fixar o conteúdo estudado.'}
              </p>

              {ids.length > 0 && (
                <div className="pagina-id-list">
                  {ids.map(
                    (id) => (
                      <span
                        key={id}
                      >
                        #{id}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="pagina-secondary-button"
              onClick={() =>
                navigate(
                  '/simulados'
                )
              }
            >
              Praticar
            </button>
          </section>
        );
      }

      /*
       * =====================================================
       * SIMULADO
       * =====================================================
       */

      case 'simulado':
        return (
          <section
            className="pagina-content-block pagina-resource-block"
            key={bloco.id}
          >
            <div className="pagina-resource-block-icon">
              <Icon
                name="checkSquare"
                size={23}
              />
            </div>

            <div className="pagina-resource-block-copy">
              <h2>
                {dados.titulo ||
                  'Simulado recomendado'}
              </h2>

              <p>
                {dados.descricao ||
                  'Continue seus estudos realizando um simulado.'}
              </p>

              {dados.id && (
                <div className="pagina-id-list">
                  <span>
                    Simulado #
                    {dados.id}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="pagina-secondary-button"
              onClick={() =>
                navigate(
                  '/simulados'
                )
              }
            >
              Fazer simulado
            </button>
          </section>
        );

      /*
       * =====================================================
       * CHECKLIST
       * =====================================================
       */

      case 'checklist':
        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            <h2>
              {dados.titulo ||
                'Checklist de revisão'}
            </h2>

            <div className="pagina-checklist">
              {(
                Array.isArray(
                  dados.itens
                )
                  ? dados.itens
                  : []
              )
                .filter(
                  (item) =>
                    String(item).trim()
                )
                .map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="pagina-check-item"
                    >
                      <span className="pagina-check-icon">
                        <Icon
                          name="check"
                          size={14}
                        />
                      </span>

                      <span>
                        {item}
                      </span>
                    </div>
                  )
                )}
            </div>
          </section>
        );

      /*
       * =====================================================
       * TIPO DESCONHECIDO
       * =====================================================
       */

      default:
        return (
          <section
            className="pagina-content-block"
            key={bloco.id}
          >
            <pre className="pagina-json">
              {JSON.stringify(
                dados,
                null,
                2
              )}
            </pre>
          </section>
        );
    }
  }

  /*
   * =========================================================
   * CARREGANDO PÁGINA
   * =========================================================
   */

  if (carregando) {
    return (
      <div className="pagina-conteudo-page">
        <div className="pagina-state-card">
          <div className="pagina-state-icon">
            <Icon
              name="book"
              size={24}
            />
          </div>

          <strong>
            Carregando conteúdo...
          </strong>

          <span>
            Buscando a página deste tópico.
          </span>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ERRO
   * =========================================================
   */

  if (erro) {
    return (
      <div className="pagina-conteudo-page">
        <button
          type="button"
          className="pagina-back-button"
          onClick={() =>
            navigate(
              '/conteudos'
            )
          }
        >
          <Icon
            name="arrowLeft"
            size={17}
          />

          Voltar aos conteúdos
        </button>

        <div className="pagina-state-card error">
          <div className="pagina-state-icon">
            <Icon
              name="question"
              size={24}
            />
          </div>

          <strong>
            Não foi possível abrir este conteúdo.
          </strong>

          <span>
            {erro}
          </span>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * SEM PÁGINA
   * =========================================================
   */

  if (!pagina) {
    return (
      <div className="pagina-conteudo-page">
        <button
          type="button"
          className="pagina-back-button"
          onClick={() =>
            navigate(
              '/conteudos'
            )
          }
        >
          <Icon
            name="arrowLeft"
            size={17}
          />

          Voltar aos conteúdos
        </button>

        <div className="pagina-state-card">
          <div className="pagina-state-icon">
            <Icon
              name="book"
              size={24}
            />
          </div>

          <strong>
            Conteúdo ainda não disponível.
          </strong>

          <span>
            Este tópico ainda não possui uma
            página de estudo cadastrada.
          </span>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * PÁGINA
   * =========================================================
   */

  return (
    <div className="pagina-conteudo-page">

      <button
        type="button"
        className="pagina-back-button"
        onClick={() =>
          navigate(
            '/conteudos'
          )
        }
      >
        <Icon
          name="arrowLeft"
          size={17}
        />

        Voltar aos conteúdos
      </button>

      <header
        className="pagina-hero"
        style={{
          '--pagina-accent':
            materiaStyle.color,
          '--pagina-accent-bg':
            materiaStyle.bg,
        }}
      >
        <div className="pagina-hero-top">

          <div className="pagina-breadcrumb">
            <span>
              Conteúdos
            </span>

            <span>›</span>

            <span>
              {pagina.materia}
            </span>

            <span>›</span>

            <span>
              {pagina.topico}
            </span>
          </div>

          <div
            className="pagina-materia-badge"
            style={{
              background:
                materiaStyle.bg,
              color:
                materiaStyle.color,
            }}
          >
            <SubjectIcon
              materia={
                pagina.materia
              }
              size={17}
            />

            {pagina.materia}
          </div>

        </div>

        <div className="pagina-hero-content">

          <div className="pagina-hero-icon">
            <SubjectIcon
              materia={
                pagina.materia
              }
              size={28}
            />
          </div>

          <div>

            <span className="pagina-kicker">
              MATERIAL DE ESTUDO
            </span>

            <h1>
              {pagina.titulo}
            </h1>

            {pagina.descricao && (
              <p>
                {pagina.descricao}
              </p>
            )}

          </div>

        </div>
      </header>

      <div className="pagina-layout">

        <main className="pagina-main">

          {blocos.length > 0 ? (
            blocos.map(
              renderBloco
            )
          ) : (
            <div className="pagina-state-card">

              <div className="pagina-state-icon">
                <Icon
                  name="book"
                  size={24}
                />
              </div>

              <strong>
                Este conteúdo ainda está sendo preparado.
              </strong>

              <span>
                Volte mais tarde para conferir as explicações e materiais.
              </span>

            </div>
          )}

        </main>

        <aside className="pagina-aside">

          <div className="pagina-progress-card">

            <span className="pagina-aside-label">
              SEU PROGRESSO
            </span>

            <strong>
              {estudado
                ? 'Conteúdo estudado'
                : 'Ainda não estudado'}
            </strong>

            <p>
              {estudado
                ? 'Você já marcou este tópico como estudado.'
                : 'Depois de revisar o material, marque este tópico como estudado.'}
            </p>

            <button
              type="button"
              className={
                `pagina-study-button ${
                  estudado
                    ? 'completed'
                    : ''
                }`
              }
              onClick={
                alternarEstudado
              }
              disabled={
                salvandoEstudo
              }
            >
              <Icon
                name="check"
                size={17}
              />

              {salvandoEstudo
                ? 'Salvando...'
                : estudado
                  ? 'Marcar como não estudado'
                  : 'Marcar como estudado'}
            </button>

          </div>

          <div className="pagina-aside-card">

            <span className="pagina-aside-label">
              SOBRE ESTE TÓPICO
            </span>

            <div className="pagina-topic-info">
              <span>
                Matéria
              </span>

              <strong>
                {pagina.materia}
              </strong>
            </div>

            <div className="pagina-topic-info">
              <span>
                Tópico
              </span>

              <strong>
                {pagina.topico}
              </strong>
            </div>

            <div className="pagina-topic-info">
              <span>
                Blocos de estudo
              </span>

              <strong>
                {blocos.length}
              </strong>
            </div>

          </div>

        </aside>

      </div>
    </div>
  );
}