import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubjectStyle } from '../../utils/subjects.js';
import { normalizarAparencia, obterPaletaMateria } from '../../utils/aparenciaConteudo.js';
import Icon from '../../components/Icon.jsx';
import { TextoFormatado } from '../../components/conteudos/TextoFormatado.jsx';
import { BlocoDidatico } from '../../components/conteudos/BlocosDidaticos.jsx';

import BlocoQuestoes from './conteudos/BlocoQuestoes.jsx';
import BlocoChecklist from './conteudos/BlocoChecklist.jsx';

import '../../styles/aluno/PaginaConteudo.css';
import '../../styles/aluno/PaginaConteudoExtra.css';
import '../../styles/aluno/PaginaConteudoRefinado.css';
import { API_URL, obterToken } from '../../services/api.js';

function GradeFlashcards({ flashcards }) {
  const [virados, setVirados] = useState({});

  return (
    <div className="pagina-flashcards-grade" aria-label="Flashcards para revisar">
      {flashcards.map((card, indice) => {
        const chave = String(card.id ?? indice);
        const virado = Boolean(virados[chave]);
        return (
          <button
            key={chave}
            type="button"
            className={`pagina-flashcard-grade-item${virado ? ' is-flipped' : ''}`}
            onClick={() => setVirados((atual) => ({ ...atual, [chave]: !atual[chave] }))}
            aria-pressed={virado}
            aria-label={`${virado ? 'Resposta' : 'Pergunta'}: ${virado ? card.resposta : card.pergunta}. Clique para ${virado ? 'ver a pergunta' : 'ver a resposta'}.`}
          >
            <span className="pagina-flashcard-grade-inner">
              <span className="pagina-flashcard-grade-face pagina-flashcard-grade-front" aria-hidden={virado}>
                {card.pergunta}
              </span>
              <span className="pagina-flashcard-grade-face pagina-flashcard-grade-back" aria-hidden={!virado}>
                {card.resposta}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
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

  if (Array.isArray(valor)) {
    return valor
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);
  }

  return String(valor)
    .split(',')
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function youtubeEmbed(url) {
  if (!url) {
    return '';
  }

  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes(
        'youtube.com'
      ) &&
      parsed.pathname === '/watch'
    ) {
      const id =
        parsed.searchParams.get(
          'v'
        );

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (
      parsed.hostname ===
      'youtu.be'
    ) {
      const id =
        parsed.pathname
          .replace('/', '')
          .trim();

      return id
        ? `https://www.youtube.com/embed/${id}`
        : '';
    }

    if (
      parsed.pathname.startsWith(
        '/embed/'
      )
    ) {
      return url;
    }

    return '';
  } catch {
    return '';
  }
}

export default function PaginaConteudo() {
  const {
    topicoId,
  } = useParams();

  const navigate =
    useNavigate();

  const topicoNumero =
    Number(topicoId);

  const [pagina, setPagina] =
    useState(null);

  const [blocos, setBlocos] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [estudado, setEstudado] =
    useState(false);

  const [
    salvandoEstudo,
    setSalvandoEstudo,
  ] = useState(false);

  /* ========================================================
     FLASHCARDS
     ======================================================== */

  const [
    flashcards,
    setFlashcards,
  ] = useState([]);

  const [
    flashcardAtual,
    setFlashcardAtual,
  ] = useState(0);

  const [
    ,
    setMostrarResposta,
  ] = useState(false);

  const [
    carregandoFlashcards,
    setCarregandoFlashcards,
  ] = useState(false);

  /* ========================================================
     CARREGAR PÁGINA
     ======================================================== */

  useEffect(() => {
    let ativo = true;

    async function carregarPagina() {
      try {
        setCarregando(true);
        setErro('');

        const token =
          obterToken();

        const resposta =
          await fetch(
            `${API_URL}/paginas-conteudo/topico/${topicoNumero}`,
            {
              headers: token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {},
            }
          );

        const dados =
          await resposta
            .json()
            .catch(
              () => ({})
            );

        if (!resposta.ok) {
          throw new Error(
            dados.erro ||
              dados.mensagem ||
              'Não foi possível carregar este conteúdo.'
          );
        }

        if (
          !dados ||
          !dados.pagina
        ) {
          if (!ativo) {
            return;
          }

          setPagina(null);
          setBlocos([]);
          setEstudado(false);

          return;
        }

        if (!ativo) {
          return;
        }

        setPagina(
          dados.pagina
        );

        setBlocos(
          Array.isArray(
            dados.blocos
          )
            ? [...dados.blocos].sort(
                (a, b) =>
                  Number(
                    a.ordem || 0
                  ) -
                  Number(
                    b.ordem || 0
                  )
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
              .catch(
                () => ({})
              );

          if (
            respostaProgresso.ok &&
            Array.isArray(
              dadosProgresso.topicos
            )
          ) {
            const registro =
              dadosProgresso.topicos.find(
                (item) =>
                  Number(
                    item.topico_id
                  ) ===
                  topicoNumero
              );

            if (ativo) {
              setEstudado(
                Boolean(
                  registro?.estudado
                )
              );
            }
          }
        }
      } catch (error) {
        console.error(
          'Erro ao carregar página de conteúdo:',
          error
        );

        if (ativo) {
          setErro(
            error.message ||
              'Não foi possível carregar este conteúdo.'
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    if (
      Number.isInteger(
        topicoNumero
      ) &&
      topicoNumero > 0
    ) {
      carregarPagina();
    } else {
      queueMicrotask(() => {
        if (ativo) { setErro('Tópico inválido.'); setCarregando(false); }
      });
    }

    return () => {
      ativo = false;
    };
  }, [topicoNumero]);

  /* ========================================================
     FLASHCARDS
     ======================================================== */

  async function carregarFlashcards(
    idsSelecionados = []
  ) {
    try {
      setCarregandoFlashcards(
        true
      );

      const token =
        obterToken();

      const resposta =
        await fetch(
          `${API_URL}/flashcards`,
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

      const dados =
        await resposta
          .json()
          .catch(
            () => ({})
          );

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
            dados.mensagem ||
            'Não foi possível carregar os flashcards.'
        );
      }

      const lista =
        Array.isArray(dados)
          ? dados
          : Array.isArray(
              dados.flashcards
            )
            ? dados.flashcards
            : [];

      let cardsAtivos =
        lista.filter(
          (card) =>
            card.ativo === 1 ||
            card.ativo === true ||
            card.ativo === undefined
        );

      if (
        idsSelecionados.length >
        0
      ) {
        const ids =
          new Set(
            idsSelecionados.map(
              (id) =>
                Number(id)
            )
          );

        cardsAtivos =
          cardsAtivos.filter(
            (card) =>
              ids.has(
                Number(card.id)
              )
          );
      }

      const cardsFormatados =
        cardsAtivos.map(
          (card) => ({
            id: card.id,

            materia:
              card.materia ||
              '',

            pergunta:
              card.primario ||
              card.pergunta ||
              '',

            resposta:
              card.secundario ||
              card.resposta ||
              '',
          })
        );

      setFlashcards(
        cardsFormatados
      );

      setFlashcardAtual(
        0
      );

      setMostrarResposta(
        false
      );
    } catch (error) {
      console.error(
        'Erro ao carregar flashcards:',
        error
      );

      queueMicrotask(() => {
        setFlashcards([]);
        setFlashcardAtual(0);
        setMostrarResposta(false);
      });
    } finally {
      setCarregandoFlashcards(
        false
      );
    }
  }

  useEffect(() => {
    if (
      !Array.isArray(
        blocos
      )
    ) {
      return;
    }

    const blocoFlashcards =
      blocos.find(
        (bloco) =>
          bloco.tipo ===
          'flashcards'
      );

    if (
      !blocoFlashcards
    ) {
      const limpar = setTimeout(() => {
        setFlashcards([]);
        setFlashcardAtual(0);
        setMostrarResposta(false);
      }, 0);

      return () => clearTimeout(limpar);
    }

    const dados =
      normalizarDados(
        blocoFlashcards
      );

    const ids =
      formatarIds(
        dados.flashcardIds ??
          dados.ids
      );

    // Dispara o carregamento fora da fase síncrona do efeito.
    const iniciar = setTimeout(() => {
      void carregarFlashcards(ids);
    }, 0);
    return () => clearTimeout(iniciar);
  }, [blocos]);

  useEffect(() => {
    const atualizar = setTimeout(() => setMostrarResposta(false), 0);
    return () => clearTimeout(atualizar);
  }, [flashcardAtual]);

  /* ========================================================
     PROGRESSO
     ======================================================== */

  async function alternarEstudado() {
    const token =
      obterToken();

    if (!token) {
      setErro(
        'Sua sessão expirou. Faça login novamente.'
      );

      return;
    }

    const novoStatus =
      !estudado;

    try {
      setSalvandoEstudo(
        true
      );

      setErro('');

      const resposta =
        await fetch(
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
          .catch(
            () => ({})
          );

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

      // Só fecha a aula depois da confirmação de que o progresso foi salvo.
      // Ao desmarcar uma aula já concluída, o estudante permanece na página.
      if (novoStatus) {
        navigate('/conteudos', { replace: true });
      }
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
      setSalvandoEstudo(
        false
      );
    }
  }

  /* ========================================================
     MATÉRIA
     ======================================================== */

  const materiaStyle =
    useMemo(
      () =>
        getSubjectStyle(
          pagina?.materia ||
            ''
        ),
      [pagina?.materia]
    );

  const aparencia = useMemo(
    () => normalizarAparencia(pagina?.aparencia),
    [pagina?.aparencia]
  );
  const paleta = obterPaletaMateria(pagina?.materia);
  const tituloBloco = (bloco, indice) => {
    const dados = normalizarDados(bloco);
    const nomes = {
      texto: 'Explicação', destaque: 'Para lembrar',
      video: 'Videoaula', imagem: 'Ilustração',
      pdf: 'Material complementar', lista: 'Resumo em tópicos',
      flashcards: 'Revisão ativa', questoes: 'Pratique',
      simulado: 'Simulado', checklist: 'Checklist',
      formula: 'Fórmula matemática', exemplo: 'Exemplo resolvido', exemplos: 'Certo ou errado', tabela: 'Tabela', pergunta: 'Questão',
      linha_tempo: 'Linha do tempo', glossario: 'Glossário', expansivel: 'Saiba mais',
    };
    return dados.titulo || `${nomes[bloco.tipo] || 'Atividade'} ${indice + 1}`;
  };

  /* ========================================================
     RENDERIZAR BLOCOS
     ======================================================== */

  function renderBloco(
    bloco
  ) {
    const dados =
      normalizarDados(
        bloco
      );

    if (['formula', 'exemplo', 'exemplos', 'tabela', 'pergunta', 'linha_tempo', 'glossario', 'expansivel'].includes(bloco.tipo)) {
      return <BlocoDidatico key={bloco.id} tipo={bloco.tipo} dados={dados} />;
    }
    switch (
      bloco.tipo
    ) {
      case 'texto':
        return (
          <section
            className="pagina-content-block pagina-text-block"
            data-estilo={['padrao', 'destaque', 'resumo'].includes(dados.estilo) ? dados.estilo : 'padrao'}
            data-tamanho={['maior', 'menor'].includes(dados.tamanho) ? dados.tamanho : 'padrao'}
            data-alinhamento={dados.alinhamento === 'centro' ? 'centro' : 'esquerda'}
            data-espacamento={['compacto', 'amplo'].includes(dados.espacamento) ? dados.espacamento : 'confortavel'}
            key={bloco.id}
          >
            {dados.titulo && (
              <h2>
                {dados.titulo}
              </h2>
            )}

            {dados.texto && (
              <TextoFormatado className="pagina-rich-text" texto={dados.texto} />
            )}
          </section>
        );

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

              <TextoFormatado className="pagina-highlight-message" texto={dados.texto || 'Confira esta informação importante.'} />
            </div>
          </section>
        );

      case 'video': {
        const videoUrl =
          youtubeEmbed(
            dados.url
          );

        return (
          <section
            className="pagina-content-block"
            data-largura={['compacta', 'total'].includes(dados.largura) ? dados.largura : 'padrao'}
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
                O vídeo deste conteúdo ainda não foi configurado.
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

      case 'imagem':
        return (
          <section
            className="pagina-content-block"
            data-largura={['compacta', 'total'].includes(dados.largura) ? dados.largura : 'padrao'}
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
                A imagem deste conteúdo ainda não foi configurada.
              </div>
            )}
          </section>
        );

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
                    O arquivo será aberto em uma nova aba.
                  </small>
                </span>

                <Icon
                  name="external"
                  size={17}
                />
              </a>
            ) : (
              <div className="pagina-block-placeholder">
                O PDF deste conteúdo ainda não foi configurado.
              </div>
            )}
          </section>
        );

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
                      String(
                        item
                      ).trim()
                  )
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        <span className="pagina-list-marker">
                          {index +
                            1}
                        </span>

                        <span>
                          <TextoFormatado texto={item} />
                        </span>
                      </li>
                    )
                  )}
              </ul>
            )}
          </section>
        );

      case 'flashcards':
        return (
          <section
            className="pagina-content-block pagina-resource-block pagina-flashcards-block"
            key={bloco.id}
          >
            <div className="pagina-resource-block-copy">
              <h2>
                {dados.titulo ||
                  'Flashcards para revisar'}
              </h2>

            </div>

            {carregandoFlashcards ? (
              <div className="pagina-flashcards-loading">
                Carregando flashcards...
              </div>
            ) : flashcards.length ===
              0 ? (
              <div className="pagina-block-placeholder">
                Nenhum flashcard relacionado foi encontrado.
              </div>
            ) : (
              <GradeFlashcards flashcards={flashcards} />
            )}
          </section>
        );

      case 'questoes':
        return (
          <BlocoQuestoes
            bloco={bloco}
          />
        );

      case 'simulado': {
        const simuladoId =
          Number(
            dados.simuladoId ??
              dados.id
          );

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

              {simuladoId >
                0 && (
                <div className="pagina-id-list">
                  <span>
                    Simulado #
                    {
                      simuladoId
                    }
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="pagina-secondary-button"
              onClick={() => {
                if (
                  simuladoId >
                  0
                ) {
                  navigate(
                    `/simulados?simuladoId=${simuladoId}`
                  );
                } else {
                  navigate(
                    '/simulados'
                  );
                }
              }}
            >
              {simuladoId >
              0
                ? 'Fazer simulado'
                : 'Ver simulados'}
            </button>
          </section>
        );
      }

      case 'checklist':
        return (
          <BlocoChecklist
            bloco={bloco}
          />
        );

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

  /* ========================================================
     CARREGANDO
     ======================================================== */

  if (carregando) {
    return (
      <div className="pagina-conteudo-page page-shell">
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

  /* ========================================================
     ERRO
     ======================================================== */

  if (erro) {
    return (
      <div className="pagina-conteudo-page page-shell">

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

  /* ========================================================
     SEM PÁGINA
     ======================================================== */

  if (!pagina) {
    return (
      <div className="pagina-conteudo-page page-shell">

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
            Este tópico ainda não possui uma página de estudo cadastrada.
          </span>
        </div>
      </div>
    );
  }

  const mostrarTopico =
    pagina.topico ||
    pagina.nome ||
    '';

  return (
    <div
      className={`pagina-conteudo-page page-shell pagina-experiencia pagina-leitura-refinada pagina-formato-${aparencia.formato}`}
      data-cabecalho={aparencia.cabecalho}
      data-tamanho-texto={aparencia.tamanhoTexto}
      data-largura-leitura={aparencia.larguraLeitura}
      data-mostrar-etapas={aparencia.mostrarEtapas ? 'sim' : 'nao'}
      style={{
        '--pagina-tema': paleta.cor,
        '--pagina-tema-escuro': paleta.escura,
        '--pagina-tema-claro': paleta.clara,
      }}
    >

      <header
        className="pagina-hero"
        style={{
          '--pagina-accent':
            paleta.cor,

          '--pagina-accent-bg':
            materiaStyle.bg,
        }}
      >
        <div className="pagina-hero-top">
          <nav className="pagina-breadcrumb" aria-label="Navegação da aula">
            <button
              type="button"
              className="pagina-breadcrumb-link"
              onClick={() => navigate('/conteudos')}
              aria-label="Voltar para Conteúdos"
            >
              Conteúdos
            </button>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span aria-current="page">{pagina.materia || 'Material de estudo'}</span>
          </nav>
        </div>

        <div className="pagina-hero-content">

          <div>
            <span className="pagina-kicker">
              {pagina.materia ? `${pagina.materia.toUpperCase()} · MATERIAL DE ESTUDO` : 'MATERIAL DE ESTUDO'}
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
        <main className="pagina-main" id="inicio-do-estudo">
          {blocos.length > 0 ? (
            blocos.map((bloco, indice) => (
              <div className="pagina-etapa" id={`etapa-${bloco.id}`} key={bloco.id}>
                <div className="pagina-etapa-marker" aria-hidden="true">
                  <span>{String(indice + 1).padStart(2, '0')}</span>
                </div>
                <div className="pagina-etapa-content">
                  <div className="pagina-etapa-eyebrow">
                    <span>SEÇÃO {String(indice + 1).padStart(2, '0')}</span>
                  </div>
                  {renderBloco(bloco)}
                </div>
              </div>
            ))
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
          {aparencia.mostrarIndice && blocos.length > 0 && (
            <nav className="pagina-indice-card" aria-label="Etapas desta página">
              <div className="pagina-indice-header">
                <span className="pagina-indice-symbol"><Icon name="book" size={17} /></span>
                <div><strong>Tópicos da aula</strong></div>
              </div>
              <div className="pagina-indice-items">
                {blocos.map((bloco, indice) => (
                  <a key={bloco.id} href={`#etapa-${bloco.id}`}>
                    <strong>{tituloBloco(bloco, indice)}</strong>
                  </a>
                ))}
              </div>
            </nav>
          )}
        <button
          type="button"
          className={`pagina-study-button ${
            estudado
              ? 'completed'
              : ''
          }`}
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

          {aparencia.mostrarMensagem && aparencia.mensagem && (
            <div className="pagina-mensagem-card">
              <span aria-hidden="true">✦</span>
              <strong>Um incentivo pra você</strong>
              <p>{aparencia.mensagem}</p>
            </div>
          )}
          {aparencia.mostrarDetalhes && <div className="pagina-aside-card">
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
                {mostrarTopico}
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
          </div>}
        </aside>
      </div>
    </div>
  );
}