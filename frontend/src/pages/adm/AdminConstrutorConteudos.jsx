import { useEffect, useMemo, useState } from 'react';
import EditorConteudo from './EditorConteudo.jsx';
import '../../styles/adm/AdminConstrutorConteudos.css';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

function obterToken() {
  return localStorage.getItem('etecamp_token');
}

async function request(url, options = {}) {
  const token = obterToken();

  const resposta = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const texto = await resposta.text();

  let dados = {};

  try {
    dados = texto ? JSON.parse(texto) : {};
  } catch {
    dados = {};
  }

  if (!resposta.ok) {
    throw new Error(
      dados.erro ||
        dados.message ||
        'Não foi possível realizar a operação.'
    );
  }

  return dados;
}

function Icon({ name, size = 20 }) {
  const paths = {
    search: (
      <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
    ),

    book: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),

    arrow: (
      <path d="M19 12H5m7-7-7 7 7 7" />
    ),

    edit: (
      <path d="m4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function AdminConstrutorConteudos() {
  const [materias, setMaterias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const [topicoSelecionado, setTopicoSelecionado] =
    useState(null);

  async function carregarConteudos() {
    try {
      setCarregando(true);
      setErro('');

      const dados = await request('/conteudos');

      setMaterias(
        Array.isArray(dados.materias)
          ? dados.materias
          : []
      );
    } catch (error) {
      console.error(error);

      setErro(
        error.message ||
          'Não foi possível carregar os conteúdos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarConteudos();
  }, []);

  const materiasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return materias;
    }

    return materias
      .map((materia) => {
        const nomeMateria =
          String(materia.nome || '').toLowerCase();

        const descricaoMateria =
          String(
            materia.descricao || ''
          ).toLowerCase();

        const materiaCombina =
          nomeMateria.includes(termo) ||
          descricaoMateria.includes(termo);

        const topicosFiltrados =
          (materia.topicos || []).filter(
            (topico) =>
              String(topico.nome || '')
                .toLowerCase()
                .includes(termo) ||
              String(topico.descricao || '')
                .toLowerCase()
                .includes(termo)
          );

        if (
          materiaCombina ||
          topicosFiltrados.length > 0
        ) {
          return {
            ...materia,
            topicos: materiaCombina
              ? materia.topicos || []
              : topicosFiltrados,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [materias, busca]);

  const totalTopicos = materias.reduce(
    (total, materia) =>
      total + (materia.topicos?.length || 0),
    0
  );

  if (topicoSelecionado) {
    return (
      <EditorConteudo
        topicoId={topicoSelecionado.id}
        topicoNome={topicoSelecionado.nome}
        aoVoltar={() =>
          setTopicoSelecionado(null)
        }
      />
    );
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <span className="admin-section-kicker">
            CMS / CONTEÚDO
          </span>

          <h1>Construir conteúdos</h1>

          <p>
            Escolha um tópico para montar a página
            de conteúdo que será exibida aos alunos.
          </p>
        </div>
      </header>

      {erro && (
        <div
          style={{
            marginBottom: '18px',
            padding: '13px 15px',
            borderRadius: '12px',
            background: '#fff1f0',
            border: '1px solid #ffc9c5',
            color: '#b42318',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {erro}
        </div>
      )}

      <section className="admin-content-stats">
        <article className="stat-card">
          <div className="stat-value">
            {materias.length}
          </div>

          <div className="stat-label">
            Matérias
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-value">
            {totalTopicos}
          </div>

          <div className="stat-label">
            Tópicos disponíveis
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-value">
            {materias.reduce(
              (total, materia) =>
                total +
                (materia.topicos || []).filter(
                  (topico) =>
                    Boolean(topico.ativo)
                ).length,
              0
            )}
          </div>

          <div className="stat-label">
            Tópicos ativos
          </div>
        </article>
      </section>

      <section
        className="panel-card"
        style={{
          marginTop: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Icon
            name="search"
            size={19}
          />

          <input
            type="text"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Buscar matéria ou tópico..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              font: 'inherit',
              color: 'var(--ink)',
            }}
          />
        </div>
      </section>

      {carregando ? (
        <div
          className="admin-content-empty large"
          style={{
            marginTop: '18px',
          }}
        >
          <strong>
            Carregando tópicos...
          </strong>

          <span>
            Buscando os conteúdos cadastrados.
          </span>
        </div>
      ) : materiasFiltradas.length === 0 ? (
        <div
          className="admin-content-empty large"
          style={{
            marginTop: '18px',
          }}
        >
          <strong>
            Nenhum tópico encontrado
          </strong>

          <span>
            Tente pesquisar por outro nome.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '18px',
          }}
        >
          {materiasFiltradas.map((materia) => (
            <section
              key={materia.id}
              className="panel-card"
              style={{
                padding: '0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                  padding: '18px 20px',
                  borderBottom:
                    '1px solid var(--line)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      materia.cor ||
                      'var(--accent)',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name="book"
                    size={20}
                  />
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: 'var(--ink)',
                    }}
                  >
                    {materia.nome}
                  </h3>

                  <p
                    style={{
                      margin: '4px 0 0',
                      color: 'var(--muted)',
                      fontSize: '12px',
                    }}
                  >
                    {materia.topicos?.length || 0}{' '}
                    tópico(s)
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px',
                }}
              >
                {(materia.topicos || []).map(
                  (topico, index) => (
                    <button
                      key={topico.id}
                      type="button"
                      onClick={() =>
                        setTopicoSelecionado(
                          topico
                        )
                      }
                      disabled={
                        !Boolean(
                          topico.ativo
                        )
                      }
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding:
                          '13px 14px',
                        border:
                          '1px solid var(--line)',
                        borderRadius: '11px',
                        background:
                          '#fff',
                        cursor:
                          topico.ativo
                            ? 'pointer'
                            : 'not-allowed',
                        textAlign: 'left',
                        opacity:
                          topico.ativo
                            ? 1
                            : 0.55,
                      }}
                    >
                      <span
                        style={{
                          minWidth: '30px',
                          height: '30px',
                          borderRadius:
                            '9px',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          background:
                            '#f1f3f2',
                          color:
                            'var(--muted)',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {String(
                          topico.ordem ||
                            index + 1
                        ).padStart(
                          2,
                          '0'
                        )}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            color:
                              'var(--ink)',
                            fontSize:
                              '13px',
                          }}
                        >
                          {topico.nome}
                        </strong>

                        {topico.descricao && (
                          <small
                            style={{
                              display:
                                'block',
                              marginTop:
                                '3px',
                              color:
                                'var(--muted)',
                              fontSize:
                                '11px',
                            }}
                          >
                            {
                              topico.descricao
                            }
                          </small>
                        )}
                      </span>

                      <span
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '8px',
                          color:
                            'var(--accent-dark)',
                          fontSize:
                            '11px',
                          fontWeight:
                            800,
                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        <Icon
                          name="edit"
                          size={15}
                        />

                        Construir

                        <Icon
                          name="chevron"
                          size={16}
                        />
                      </span>
                    </button>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}