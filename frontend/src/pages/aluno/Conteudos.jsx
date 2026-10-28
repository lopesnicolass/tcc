import '../../styles/aluno/Conteudos.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { API_URL, obterToken } from '../../services/api.js';

const imagensMaterias = import.meta.glob(
  '../../assets/conteudos/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, query: '?url', import: 'default' }
);

const ALIAS_IMAGEM_MATERIA = {
  portugues: 'tenna_portugues_novo',
  'lingua-portuguesa': 'tenna_portugues_novo',
  matematica: 'tenna_matematica_novo',
  historia: 'tenna_historia_novo',
  geografia: 'tenna_geografia_novo',
  ciencias: 'tenna_ciencias_novo',
  'ciencias-da-natureza': 'tenna_ciencias_novo',
  biologia: 'biologia',
  quimica: 'quimica',
  fisica: 'fisica',
  'raciocinio-e-interpretacao': 'raciocinio-e-interpretacao',
};

function slugMateria(nome = '') {
  return String(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMateriaCor(materia = '') {
  const slug = slugMateria(materia);

  const cores = {
    portugues: { color: '#5DADE2', bg: '#EAF5FF' },
    'lingua-portuguesa': { color: '#5DADE2', bg: '#EAF5FF' },
    matematica: { color: '#D95C5C', bg: '#FFF0EF' },
    historia: { color: '#A97745', bg: '#F7F0E8' },
    geografia: { color: '#62A85E', bg: '#EFF8EE' },
    ciencias: { color: '#8D68C9', bg: '#F3EEFB' },
    'ciencias-da-natureza': { color: '#8D68C9', bg: '#F3EEFB' },
    biologia: { color: '#62A85E', bg: '#EFF8EE' },
    quimica: { color: '#8D68C9', bg: '#F3EEFB' },
    fisica: { color: '#8D68C9', bg: '#F3EEFB' },
  };

  return cores[slug] || { color: '#5DADE2', bg: '#EAF5FF' };
}

function getMateriaImagem(materia) {
  const slug = slugMateria(materia);
  const nomeArquivo = ALIAS_IMAGEM_MATERIA[slug] || slug;

  const encontrada = Object.entries(imagensMaterias).find(([caminho]) => {
    const nome = caminho
      .split('/')
      .pop()
      ?.replace(/\.(png|jpe?g|webp|avif)$/i, '')
      .toLowerCase();

    return nome === nomeArquivo;
  });

  return encontrada?.[1] || null;
}

export default function Conteudos() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [materiasData, setMateriasData] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertos, setAbertos] = useState(new Set());
  const [estudados, setEstudados] = useState({});
  const [salvandoTopico, setSalvandoTopico] = useState(null);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const [limpandoProgresso, setLimpandoProgresso] = useState(false);

  async function carregarProgresso(tokenAtual = obterToken()) {
    if (!tokenAtual) {
      setEstudados({});
      return;
    }

    const resposta = await fetch(
      `${API_URL}/conteudos/progresso`,
      {
        headers: {
          Authorization: `Bearer ${tokenAtual}`
        }
      }
    );

    const dados = await resposta
      .json()
      .catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.erro ||
        dados.mensagem ||
        'Não foi possível carregar seu progresso.'
      );
    }

    const mapa = {};

    (Array.isArray(dados.topicos)
      ? dados.topicos
      : []
    ).forEach((item) => {
      mapa[String(item.topico_id)] =
        Boolean(item.estudado);
    });

    setEstudados(mapa);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarConteudos() {
      try {
        setCarregando(true);
        setErro('');

        const respostaConteudos = await fetch(
          `${API_URL}/conteudos/publico`
        );

        const dadosConteudos =
          await respostaConteudos
            .json()
            .catch(() => ({}));

        if (!respostaConteudos.ok) {
          throw new Error(
            dadosConteudos.erro ||
            dadosConteudos.mensagem ||
            'Não foi possível carregar os conteúdos.'
          );
        }

        const materias =
          Array.isArray(dadosConteudos)
            ? dadosConteudos
            : (dadosConteudos.materias || []);

        if (!ativo) {
          return;
        }

        setMateriasData(materias);

        setAbertos((prev) => {
          const nomesAtuais = new Set(
            materias.map(
              (materia) => materia.nome
            )
          );

          return new Set(
            [...prev].filter(
              (nome) =>
                nomesAtuais.has(nome)
            )
          );
        });

        const token = obterToken();

        await carregarProgresso(token);

      } catch (error) {
        console.error(
          'Erro ao carregar conteúdos:',
          error
        );

        if (ativo) {
          setErro(
            error.message ||
            'Não foi possível carregar os conteúdos.'
          );
        }

      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarConteudos();

    return () => {
      ativo = false;
    };
  }, []);

  const total = materiasData.reduce(
    (sum, materia) =>
      sum +
      (
        Array.isArray(materia.topicos)
          ? materia.topicos.length
          : 0
      ),
    0
  );

  const totalEstudados =
    Object.values(estudados)
      .filter(Boolean)
      .length;

  const progresso =
    total
      ? Math.round(
          (totalEstudados / total) * 100
        )
      : 0;


  const conteudosFiltrados =
    useMemo(() => {
      const termo =
        busca.trim().toLowerCase();

      return materiasData.map((materia) => materia.nome).reduce(
        (acc, nomeMateria) => {
          const materia =
            materiasData.find(
              (item) =>
                item.nome === nomeMateria
            );

          if (!materia) {
            return acc;
          }

          const topics =
            (materia.topicos || [])
              .filter(
                (topico) =>
                  topico &&
                  topico.nome
              )
              .filter(
                (topico) =>
                  !termo ||
                  topico.nome
                    .toLowerCase()
                    .includes(termo)
              );

          if (topics.length) {
            acc[nomeMateria] = topics;
          }

          return acc;
        },
        {}
      );
    }, [busca, materiasData]);

  const totalResultados = useMemo(
    () =>
      Object.values(conteudosFiltrados).reduce(
        (sum, topics) => sum + topics.length,
        0
      ),
    [conteudosFiltrados]
  );

  const filtrosAtivos = Boolean(busca.trim());

  function limparFiltros() {
    setBusca('');
  }

  function toggleMateria(materia) {
    setAbertos((prev) => {
      const next = new Set(prev);

      if (next.has(materia)) {
        next.delete(materia);
      } else {
        next.add(materia);
      }

      return next;
    });
  }

  useEffect(() => {
    const nomesComResultado = Object.keys(conteudosFiltrados);

    if (busca.trim()) {
      const atualizar = setTimeout(() => setAbertos(new Set(nomesComResultado)), 0);
      return () => clearTimeout(atualizar);
    }

  }, [busca, conteudosFiltrados]);

  function limparBusca() {
    setBusca('');
  }

  async function toggleEstudado(topico) {
    if (!topico?.id) {
      return;
    }

    const token = obterToken();

    if (!token) {
      setErro(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    const topicoId =
      Number(topico.id);

    const novoStatus =
      !estudados[String(topicoId)];

    setSalvandoTopico(topicoId);
    setErro('');

    try {
      const resposta =
        await fetch(
          `${API_URL}/conteudos/progresso/${topicoId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              estudado: novoStatus
            })
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
          'Não foi possível salvar o progresso.'
        );
      }

      await carregarProgresso(token);

    } catch (error) {
      console.error(
        'Erro ao salvar progresso:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível salvar o progresso.'
      );

    } finally {
      setSalvandoTopico(null);
    }
  }

  async function marcarTodosComoNaoEstudados() {
    const token = obterToken();

    if (!token) {
      setErro(
        'Sua sessão não foi encontrada. Faça login novamente.'
      );
      return;
    }

    setErro('');
    setLimpandoProgresso(true);

    try {
      const resposta =
        await fetch(
          `${API_URL}/conteudos/progresso`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`
            }
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
          'Não foi possível limpar o progresso.'
        );
      }

      setEstudados({});
      setConfirmarLimpeza(false);

    } catch (error) {
      console.error(
        'Erro ao limpar progresso:',
        error
      );

      setErro(
        error.message ||
        'Não foi possível limpar o progresso.'
      );
      setConfirmarLimpeza(false);
    } finally {
      setLimpandoProgresso(false);
    }
  }


  useEffect(() => {
    if (!confirmarLimpeza || limpandoProgresso) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setConfirmarLimpeza(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmarLimpeza, limpandoProgresso]);

  return (
    <div className="conteudos-page page-shell">

      <section className="tenna-auto-intro">

        <div className="tenna-auto-intro-copy">

          <span className="tenna-auto-kicker">
            BASE DE CONTEÚDOS
          </span>

          <h2>
            Tudo que cai no{' '}
            <span>Vestibulinho</span>
          </h2>

          <p>
            Consulte o que estudar em cada
            matéria e marque o que você já revisou.
          </p>

        </div>


      </section>

      <section className="content-progress-card">

        <div className="content-progress-main">

          <div
            className="content-progress-icon"
            style={{
              color:
                'var(--accent-dark)'
            }}
          >
            <Icon
              name="book"
              size={24}
            />
          </div>

          <div>

            <span className="content-eyebrow">
              Seu progresso
            </span>

            <h2>
              {totalEstudados} de {total}{' '}
              conteúdos estudados
            </h2>

            <p>
              Use esta lista como um guia
              para saber o que procurar e estudar.
            </p>

          </div>

        </div>

        <div className="content-progress-value">
          {progresso}%
        </div>

        <div className="content-progress-track">

          <div
            style={{
              width:
                `${progresso}%`
            }}
          />

        </div>

      </section>

      <div className="content-toolbar">

        <div className="content-search-wrap">

          <span className="content-search-icon" aria-hidden="true"><Icon name="search" size={18} /></span>

          <input
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            placeholder="Buscar conteúdo..."
            aria-label="Buscar conteúdo"
          />

          {busca && (
            <button
              type="button"
              className="content-search-clear"
              onClick={limparBusca}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              ×
            </button>
          )}

        </div>



        <button
          className="content-reset-btn ui-btn ui-btn--ghost"
          type="button"
          onClick={() => setConfirmarLimpeza(true)}
        >
          Limpar progresso
        </button>

      </div>

      {filtrosAtivos && (
        <div className="content-filter-summary" aria-live="polite">
          <div className="content-filter-result-count">
            <strong>{totalResultados}</strong>
            {totalResultados === 1
              ? ' conteúdo encontrado'
              : ' conteúdos encontrados'}
          </div>

          <div className="content-filter-chips">
            {busca.trim() && (
              <span className="content-filter-chip">
                Busca: <strong>"{busca.trim()}"</strong>
              </span>
            )}


          </div>

          <button
            type="button"
            className="content-clear-filters"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {erro && (

        <div className="content-empty">

          <strong>
            Ocorreu um erro.
          </strong>

          <span>
            {erro}
          </span>

        </div>

      )}

      {!erro && carregando && (

        <div className="content-empty">

          <strong>
            Carregando conteúdos...
          </strong>

          <span>
            Buscando a lista atualizada no sistema.
          </span>

        </div>

      )}

      {!erro &&
        !carregando && (
          Object.keys(conteudosFiltrados).length === 0 ? (
            <div className="content-search-empty">
              <div className="content-search-empty-icon" aria-hidden="true"><Icon name="search" size={26} /></div>
              <strong>Nenhum conteúdo encontrado</strong>
              <span>
                Não encontramos nenhum tópico para <b>"{busca}"</b>.
              </span>
              {busca.trim() && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="ui-btn ui-btn--secondary"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
          <div className="content-subject-list">

            {Object.entries(
              conteudosFiltrados
            ).map(
              ([materia, topics]) => {

                const studiedCount =
                  topics.filter(
                    (topic) =>
                      estudados[String(topic.id)]
                  ).length;

                const aberto =
                  abertos.has(materia);

                const style = getMateriaCor(materia);

                const materiaProgresso =
                  topics.length
                    ? Math.round(
                        (
                          studiedCount /
                          topics.length
                        ) * 100
                      )
                    : 0;

                return (
                  <section
                    className="content-subject-card"
                    key={materia}
                    style={{
                      borderLeftColor:
                        style.color,
                      '--subject-color':
                        style.color,
                      '--subject-bg':
                        style.bg
                    }}
                  >

                    <button
                      type="button"
                      className="content-subject-header"
                      onClick={() =>
                        toggleMateria(
                          materia
                        )
                      }
                      aria-expanded={aberto}
                      aria-controls={`conteudos-${String(materia).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
                    >

                      <div className="content-subject-title">

                        <span
                          className="content-subject-icon"
                          style={{
                            background:
                              style.bg,
                            color:
                              style.color
                          }}
                        >

                          {getMateriaImagem(materia) ? (
                            <img
                              src={getMateriaImagem(materia)}
                              alt=""
                              className="content-subject-image"
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className="content-subject-image-fallback"
                              aria-hidden="true"
                            >
                              {String(materia).charAt(0).toUpperCase()}
                            </span>
                          )}

                        </span>

                        <div>

                          <h2>
                            {materia}
                          </h2>

                          <span>
                            {topics.length}{' '}
                            conteúdos •{' '}
                            {studiedCount}{' '}
                            estudados
                          </span>

                        </div>

                      </div>

                      <div className="content-subject-progress">

                        <span
                          style={{
                            color:
                              style.color
                          }}
                        >
                          {materiaProgresso}%
                        </span>

                        <span
                          className={
                            `content-chevron ${
                              aberto
                                ? 'open'
                                : ''
                            }`
                          }
                        >
                          ›
                        </span>

                      </div>

                    </button>

                    <div className="content-subject-track">
                      <div
                        style={{
                          width: `${materiaProgresso}%`,
                          background: style.color
                        }}
                      />
                    </div>

                    {aberto && (

                      <div
                        id={`conteudos-${String(materia).replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
                        className="content-topic-list"
                      >

                        {topics.map((topic, index) => {
                          const done = Boolean(estudados[String(topic.id)]);
                          const salvando = salvandoTopico === Number(topic.id);

                          return (
                            <div
                              className={`content-topic ${done ? 'studied' : ''}`}
                              key={topic.id}
                              style={{
                                '--topic-color': style.color,
                                '--topic-bg': style.bg
                              }}
                            >
                              <button
                                type="button"
                                className="content-topic-open"
                                onClick={() => navigate(`/conteudos/${topic.id}`)}
                                aria-label={`Abrir conteúdo: ${topic.nome}`}
                              >
                                <span className="content-topic-index">
                                  CONTEÚDO {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="content-topic-name">
                                  {topic.nome}
                                </span>
                                <span className="content-topic-footer">
                                  <span className="content-topic-status">
                                    <span className="content-topic-status-dot" aria-hidden="true" />
                                    {salvando ? 'Salvando...' : done ? 'Estudado' : 'Não iniciado'}
                                  </span>
                                  <span className="content-topic-action">
                                    Ver conteúdo
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                className="content-topic-check"
                                onClick={(evento) => {
                                  evento.stopPropagation();
                                  toggleEstudado(topic);
                                }}
                                disabled={salvando}
                                aria-label={done
                                  ? `Marcar ${topic.nome} como não estudado`
                                  : `Marcar ${topic.nome} como estudado`}
                                aria-pressed={done}
                                title={done ? 'Marcar como não estudado' : 'Marcar como estudado'}
                              >
                                {done && <span aria-hidden="true">✓</span>}
                              </button>
                            </div>
                          );
                        })}

                      </div>

                    )}

                  </section>
                );
              }
            )}

          </div>
          ))}

      {confirmarLimpeza && (
        <div
          className="content-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !limpandoProgresso) {
              setConfirmarLimpeza(false);
            }
          }}
        >
          <div
            className="content-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="content-confirm-title"
            aria-describedby="content-confirm-description"
          >
            <h2 id="content-confirm-title">Limpar todo o progresso?</h2>
            <p id="content-confirm-description">
              Todos os conteúdos marcados como estudados voltarão para
              “Não iniciado”. Essa ação não pode ser desfeita.
            </p>
            <div className="content-confirm-actions">
              <button
                type="button"
                className="content-confirm-cancel"
                disabled={limpandoProgresso}
                onClick={() => setConfirmarLimpeza(false)}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="content-confirm-danger"
                disabled={limpandoProgresso}
                onClick={marcarTodosComoNaoEstudados}
              >
                {limpandoProgresso ? 'Limpando...' : 'Limpar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}