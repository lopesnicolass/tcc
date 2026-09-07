import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EMPTY_MATERIA = {
  nome: '',
  slug: '',
  icone: 'book',
  cor: '#2196F3',
  descricao: '',
  ativa: true,
  ordem: 0,
};

const EMPTY_TOPICO = {
  nome: '',
  descricao: '',
  ordem: 0,
  ativo: true,
};

const ICONES = [
  'book',
  'calculator',
  'globe',
  'flask',
  'target',
];

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

function gerarSlug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function Icon({ name, size = 20 }) {
  const paths = {
    book: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm0 0V22m4-15h8m-8 4h8" />
    ),

    calculator: (
      <path d="M6 3h12v18H6V3Zm3 4h6M9 11h1m4 0h1M9 15h1m4 0h1M9 19h6" />
    ),

    globe: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.2-2.3 3.3-5.3 3.3-9S14.2 5.3 12 3m0 18c-2.2-2.3-3.3-5.3-3.3-9S9.8 5.3 12 3M3 12h18" />
    ),

    flask: (
      <path d="M9 3h6m-5 0v6l-5.2 8.7A2.2 2.2 0 0 0 6.7 21h10.6a2.2 2.2 0 0 0 1.9-3.3L14 9V3m-5 10h6" />
    ),

    target: (
      <path d="M12 21a9 9 0 1 0-9-9m9 5a5 5 0 1 0-5-5m5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 0 6-6" />
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    edit: (
      <path d="m4 20 4-.9L19 8.1a2.1 2.1 0 0 0-3-3L5 16.1 4 20Zm10.5-13.5 3 3" />
    ),

    trash: (
      <path d="M4 7h16M10 11v5m4-5v5M9 7V4h6v3m-9 0 1 14h10l1-14" />
    ),

    chevron: (
      <path d="m6 9 6 6 6-6" />
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    close: (
      <path d="M6 6l12 12M18 6 6 18" />
    ),

    refresh: (
      <path d="M20 11a8 8 0 0 0-14.8-3L3 11m0-5v5h5M4 13a8 8 0 0 0 14.8 3L21 13m0 5v-5h-5" />
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

function Modal({
  titulo,
  children,
  onClose,
  onSave,
  salvando,
}) {
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <div className="admin-modal-head">
          <div>
            <span className="admin-section-kicker">
              ADMINISTRAÇÃO
            </span>

            <h2>{titulo}</h2>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            disabled={salvando}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {children}

        <div className="admin-modal-actions">
          <button
            type="button"
            className="mural-btn secondary"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="mural-btn"
            onClick={onSave}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminConteudos() {
  const [materias, setMaterias] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');

  const [materiaAberta, setMateriaAberta] =
    useState(null);

  const [modalMateria, setModalMateria] =
    useState(null);

  const [modalTopico, setModalTopico] =
    useState(null);

  const [formMateria, setFormMateria] =
    useState(EMPTY_MATERIA);

  const [formTopico, setFormTopico] =
    useState(EMPTY_TOPICO);

  async function carregarMaterias() {
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
    carregarMaterias();
  }, []);

  function mostrarSucesso(mensagem) {
    setSucesso(mensagem);

    window.setTimeout(() => {
      setSucesso('');
    }, 3500);
  }

  function abrirNovaMateria() {
    setFormMateria({
      ...EMPTY_MATERIA,
      ordem: materias.length + 1,
    });

    setModalMateria({
      modo: 'criar',
    });
  }

  function abrirEditarMateria(materia) {
    setFormMateria({
      nome: materia.nome || '',
      slug: materia.slug || '',
      icone: materia.icone || 'book',
      cor: materia.cor || '#2196F3',
      descricao: materia.descricao || '',
      ativa: Boolean(materia.ativa),
      ordem: materia.ordem || 0,
    });

    setModalMateria({
      modo: 'editar',
      id: materia.id,
    });
  }

  function abrirNovoTopico(materia) {
    setFormTopico({
      ...EMPTY_TOPICO,
      ordem: (materia.topicos?.length || 0) + 1,
    });

    setModalTopico({
      modo: 'criar',
      materiaId: materia.id,
    });
  }

  function abrirEditarTopico(topico) {
    setFormTopico({
      nome: topico.nome || '',
      descricao: topico.descricao || '',
      ordem: topico.ordem || 0,
      ativo: Boolean(topico.ativo),
    });

    setModalTopico({
      modo: 'editar',
      id: topico.id,
      materiaId: topico.materia_id,
    });
  }

  async function salvarMateria() {
    if (!formMateria.nome.trim()) {
      setErro('Informe o nome da matéria.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const payload = {
        ...formMateria,
        nome: formMateria.nome.trim(),
        slug: formMateria.slug
          ? gerarSlug(formMateria.slug)
          : gerarSlug(formMateria.nome),
        ordem: Number(formMateria.ordem) || 0,
      };

      if (modalMateria.modo === 'criar') {
        await request('/conteudos/materias', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        mostrarSucesso(
          'Matéria criada com sucesso.'
        );
      } else {
        await request(
          `/conteudos/materias/${modalMateria.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );

        mostrarSucesso(
          'Matéria atualizada com sucesso.'
        );
      }

      setModalMateria(null);

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTopico() {
    if (!formTopico.nome.trim()) {
      setErro('Informe o nome do tópico.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      const payload = {
        ...formTopico,
        nome: formTopico.nome.trim(),
        ordem: Number(formTopico.ordem) || 0,
      };

      if (modalTopico.modo === 'criar') {
        await request(
          `/conteudos/materias/${modalTopico.materiaId}/topicos`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );

        mostrarSucesso(
          'Tópico criado com sucesso.'
        );
      } else {
        await request(
          `/conteudos/topicos/${modalTopico.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );

        mostrarSucesso(
          'Tópico atualizado com sucesso.'
        );
      }

      setModalTopico(null);

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMateria(materia) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir "${materia.nome}"?\n\nTodos os tópicos dessa matéria também serão excluídos.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro('');

      await request(
        `/conteudos/materias/${materia.id}`,
        {
          method: 'DELETE',
        }
      );

      if (materiaAberta === materia.id) {
        setMateriaAberta(null);
      }

      mostrarSucesso(
        'Matéria excluída com sucesso.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    }
  }

  async function excluirTopico(topico) {
    const confirmar = window.confirm(
      `Excluir o tópico "${topico.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro('');

      await request(
        `/conteudos/topicos/${topico.id}`,
        {
          method: 'DELETE',
        }
      );

      mostrarSucesso(
        'Tópico excluído com sucesso.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    }
  }

  async function alternarMateria(materia) {
    try {
      setErro('');

      await request(
        `/conteudos/materias/${materia.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ativa: !Boolean(materia.ativa),
          }),
        }
      );

      mostrarSucesso(
        materia.ativa
          ? 'Matéria desativada.'
          : 'Matéria ativada.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    }
  }

  async function alternarTopico(topico) {
    try {
      setErro('');

      await request(
        `/conteudos/topicos/${topico.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ativo: !Boolean(topico.ativo),
          }),
        }
      );

      mostrarSucesso(
        topico.ativo
          ? 'Tópico desativado.'
          : 'Tópico ativado.'
      );

      await carregarMaterias();
    } catch (error) {
      console.error(error);
      setErro(error.message);
    }
  }

  const materiasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return materias.filter((materia) => {
      const correspondeBusca =
        !termo ||
        materia.nome
          ?.toLowerCase()
          .includes(termo) ||
        materia.descricao
          ?.toLowerCase()
          .includes(termo) ||
        materia.topicos?.some((topico) =>
          topico.nome
            ?.toLowerCase()
            .includes(termo)
        );

      const correspondeFiltro =
        filtro === 'todas' ||
        (filtro === 'ativas' &&
          Boolean(materia.ativa)) ||
        (filtro === 'inativas' &&
          !Boolean(materia.ativa));

      return (
        correspondeBusca &&
        correspondeFiltro
      );
    });
  }, [materias, busca, filtro]);

  const totalTopicos = materias.reduce(
    (total, materia) =>
      total + (materia.topicos?.length || 0),
    0
  );

  const totalAtivas = materias.filter(
    (materia) => Boolean(materia.ativa)
  ).length;

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <span className="admin-section-kicker">
            CMS / CONTEÚDO
          </span>

          <h1>Conteúdos</h1>

          <p>
            Gerencie as matérias e os tópicos
            disponíveis para os alunos.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="mural-btn secondary"
            onClick={carregarMaterias}
            disabled={carregando}
          >
            <Icon name="refresh" size={17} />
            Atualizar
          </button>

          <button
            type="button"
            className="mural-btn"
            onClick={abrirNovaMateria}
          >
            <Icon name="plus" size={17} />
            Nova matéria
          </button>
        </div>
      </header>

      {erro && (
        <div
          className="admin-alert"
          style={{
            marginBottom: '16px',
            padding: '12px 15px',
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

      {sucesso && (
        <div
          className="admin-alert"
          style={{
            marginBottom: '16px',
            padding: '12px 15px',
            borderRadius: '12px',
            background: '#edf9f1',
            border: '1px solid #b8e6c5',
            color: '#16733a',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {sucesso}
        </div>
      )}

      <section className="admin-content-stats">
        <article className="stat-card">
          <div className="stat-value">
            {materias.length}
          </div>

          <div className="stat-label">
            Matérias cadastradas
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-value">
            {totalAtivas}
          </div>

          <div className="stat-label">
            Matérias ativas
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-value">
            {totalTopicos}
          </div>

          <div className="stat-label">
            Tópicos cadastrados
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

      <section className="panel-card">
        <div
          className="admin-content-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: '1 1 280px',
            }}
          >
            <input
              type="text"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="Buscar matéria ou tópico..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid var(--line)',
                borderRadius: '11px',
                padding: '11px 13px',
                font: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={filtro}
            onChange={(event) =>
              setFiltro(event.target.value)
            }
            style={{
              minWidth: '150px',
              border: '1px solid var(--line)',
              borderRadius: '11px',
              padding: '11px 13px',
              background: '#fff',
              color: 'var(--ink)',
              font: 'inherit',
            }}
          >
            <option value="todas">
              Todas
            </option>

            <option value="ativas">
              Ativas
            </option>

            <option value="inativas">
              Inativas
            </option>
          </select>
        </div>
      </section>

      {carregando ? (
        <div className="admin-content-empty large">
          <strong>
            Carregando conteúdos...
          </strong>

          <span>
            Buscando matérias e tópicos no banco.
          </span>
        </div>
      ) : materiasFiltradas.length === 0 ? (
        <div className="admin-content-empty large">
          <strong>
            Nenhuma matéria encontrada
          </strong>

          <span>
            Tente alterar sua busca ou cadastre
            uma nova matéria.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          {materiasFiltradas.map((materia) => {
            const aberta =
              materiaAberta === materia.id;

            const topicosAtivos =
              materia.topicos?.filter(
                (topico) =>
                  Boolean(topico.ativo)
              ).length || 0;

            return (
              <article
                className="content-subject-card"
                key={materia.id}
              >
                <div
                  className="content-subject-header"
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setMateriaAberta(
                      aberta ? null : materia.id
                    )
                  }
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '13px',
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
                      name={
                        ICONES.includes(
                          materia.icone
                        )
                          ? materia.icone
                          : 'book'
                      }
                      size={21}
                    />
                  </div>

                  <div
                    className="admin-subject-main"
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3>
                        {materia.nome}
                      </h3>

                      <span
                        className="admin-status"
                        style={{
                          padding:
                            '4px 8px',
                          borderRadius:
                            '999px',
                          background:
                            materia.ativa
                              ? '#e9f8ed'
                              : '#f1f3f2',
                          color:
                            materia.ativa
                              ? 'var(--accent-dark)'
                              : 'var(--muted)',
                          fontSize:
                            '10px',
                          fontWeight: 800,
                        }}
                      >
                        {materia.ativa
                          ? 'ATIVA'
                          : 'INATIVA'}
                      </span>
                    </div>

                    <p>
                      {materia.descricao ||
                        'Sem descrição cadastrada.'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: '14px',
                        marginTop: '6px',
                        color: 'var(--muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <span>
                        {materia.topicos
                          ?.length || 0}{' '}
                        tópicos
                      </span>

                      <span>
                        {topicosAtivos}{' '}
                        ativos
                      </span>

                      <span>
                        Ordem {materia.ordem}
                      </span>
                    </div>
                  </div>

                  <div
                    className="admin-subject-actions"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                    style={{
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      className="mural-btn secondary"
                      onClick={() =>
                        abrirEditarMateria(
                          materia
                        )
                      }
                    >
                      <Icon
                        name="edit"
                        size={15}
                      />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="mural-btn secondary"
                      onClick={() =>
                        alternarMateria(
                          materia
                        )
                      }
                    >
                      {materia.ativa
                        ? 'Desativar'
                        : 'Ativar'}
                    </button>

                    <button
                      type="button"
                      className="mural-btn danger"
                      onClick={() =>
                        excluirMateria(
                          materia
                        )
                      }
                    >
                      <Icon
                        name="trash"
                        size={15}
                      />
                    </button>
                  </div>

                  <div
                    className="admin-chevron"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'center',
                      transition:
                        'transform .2s ease',
                      transform: aberta
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                    }}
                  >
                    <Icon
                      name="chevron"
                      size={18}
                    />
                  </div>
                </div>

                {aberta && (
                  <div
                    className="admin-topic-area"
                    style={{
                      borderTop:
                        '1px solid var(--line)',
                      padding:
                        '18px 20px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'space-between',
                        gap: '12px',
                        marginBottom:
                          '12px',
                      }}
                    >
                      <div>
                        <strong>
                          Tópicos da matéria
                        </strong>

                        <p
                          style={{
                            margin:
                              '4px 0 0',
                            color:
                              'var(--muted)',
                            fontSize:
                              '11px',
                          }}
                        >
                          Organize os assuntos
                          que serão utilizados
                          pelo sistema.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="mural-btn"
                        onClick={() =>
                          abrirNovoTopico(
                            materia
                          )
                        }
                      >
                        <Icon
                          name="plus"
                          size={15}
                        />
                        Novo tópico
                      </button>
                    </div>

                    {materia.topicos?.length ? (
                      <div
                        style={{
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          gap: '7px',
                        }}
                      >
                        {materia.topicos.map(
                          (
                            topico,
                            index
                          ) => (
                            <div
                              className="admin-topic-row"
                              key={
                                topico.id
                              }
                              style={{
                                display:
                                  'grid',
                                gridTemplateColumns:
                                  '35px 1fr auto',
                                alignItems:
                                  'center',
                                gap: '10px',
                                padding:
                                  '10px 11px',
                                border:
                                  '1px solid var(--line)',
                                borderRadius:
                                  '11px',
                              }}
                            >
                              <span
                                style={{
                                  color:
                                    'var(--muted)',
                                  fontSize:
                                    '11px',
                                  fontWeight:
                                    800,
                                }}
                              >
                                {String(
                                  topico.ordem ||
                                    index +
                                      1
                                ).padStart(
                                  2,
                                  '0'
                                )}
                              </span>

                              <div>
                                <strong
                                  style={{
                                    color:
                                      'var(--ink)',
                                    fontSize:
                                      '13px',
                                  }}
                                >
                                  {
                                    topico.nome
                                  }
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
                                    }}
                                  >
                                    {
                                      topico.descricao
                                    }
                                  </small>
                                )}
                              </div>

                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '6px',
                                }}
                              >
                                <span
                                  className="admin-status"
                                  style={{
                                    padding:
                                      '4px 7px',
                                    borderRadius:
                                      '999px',
                                    background:
                                      topico.ativo
                                        ? '#e9f8ed'
                                        : '#f1f3f2',
                                    color:
                                      topico.ativo
                                        ? 'var(--accent-dark)'
                                        : 'var(--muted)',
                                    fontSize:
                                      '9px',
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {topico.ativo
                                    ? 'ATIVO'
                                    : 'INATIVO'}
                                </span>

                                <button
                                  type="button"
                                  className="mural-btn secondary"
                                  onClick={() =>
                                    abrirEditarTopico(
                                      topico
                                    )
                                  }
                                >
                                  <Icon
                                    name="edit"
                                    size={
                                      14
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="mural-btn secondary"
                                  onClick={() =>
                                    alternarTopico(
                                      topico
                                    )
                                  }
                                >
                                  {topico.ativo
                                    ? 'Desativar'
                                    : 'Ativar'}
                                </button>

                                <button
                                  type="button"
                                  className="mural-btn danger"
                                  onClick={() =>
                                    excluirTopico(
                                      topico
                                    )
                                  }
                                >
                                  <Icon
                                    name="trash"
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        className="admin-content-empty"
                      >
                        <strong>
                          Nenhum tópico
                          cadastrado.
                        </strong>

                        <span>
                          Adicione o primeiro
                          tópico desta matéria.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {modalMateria && (
        <Modal
          titulo={
            modalMateria.modo === 'criar'
              ? 'Nova matéria'
              : 'Editar matéria'
          }
          onClose={() =>
            setModalMateria(null)
          }
          onSave={salvarMateria}
          salvando={salvando}
        >
          <label className="admin-field">
            <span>Nome da matéria</span>

            <input
              value={formMateria.nome}
              onChange={(event) =>
                setFormMateria(
                  (atual) => ({
                    ...atual,
                    nome: event.target
                      .value,
                  })
                )
              }
              placeholder="Ex.: Língua Portuguesa"
            />
          </label>

          <label className="admin-field">
            <span>Slug</span>

            <input
              value={formMateria.slug}
              onChange={(event) =>
                setFormMateria(
                  (atual) => ({
                    ...atual,
                    slug: event.target
                      .value,
                  })
                )
              }
              placeholder="lingua-portuguesa"
            />

            <small>
              Pode deixar vazio para o sistema
              gerar automaticamente.
            </small>
          </label>

          <div className="admin-field-row">
            <label className="admin-field">
              <span>Ícone</span>

              <select
                value={formMateria.icone}
                onChange={(event) =>
                  setFormMateria(
                    (atual) => ({
                      ...atual,
                      icone:
                        event.target.value,
                    })
                  )
                }
              >
                {ICONES.map((icone) => (
                  <option
                    key={icone}
                    value={icone}
                  >
                    {icone}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Cor</span>

              <input
                type="text"
                value={formMateria.cor}
                onChange={(event) =>
                  setFormMateria(
                    (atual) => ({
                      ...atual,
                      cor: event.target
                        .value,
                    })
                  )
                }
                placeholder="#2196F3"
              />
            </label>
          </div>

          <div className="admin-field-row">
            <label className="admin-field">
              <span>Ordem</span>

              <input
                type="number"
                min="0"
                value={formMateria.ordem}
                onChange={(event) =>
                  setFormMateria(
                    (atual) => ({
                      ...atual,
                      ordem:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(
                  formMateria.ativa
                )}
                onChange={(event) =>
                  setFormMateria(
                    (atual) => ({
                      ...atual,
                      ativa:
                        event.target
                          .checked,
                    })
                  )
                }
              />

              Matéria ativa
            </label>
          </div>

          <label className="admin-field">
            <span>Descrição</span>

            <textarea
              rows="4"
              value={formMateria.descricao}
              onChange={(event) =>
                setFormMateria(
                  (atual) => ({
                    ...atual,
                    descricao:
                      event.target.value,
                  })
                )
              }
              placeholder="Explique brevemente o conteúdo desta matéria."
            />
          </label>
        </Modal>
      )}

      {modalTopico && (
        <Modal
          titulo={
            modalTopico.modo === 'criar'
              ? 'Novo tópico'
              : 'Editar tópico'
          }
          onClose={() =>
            setModalTopico(null)
          }
          onSave={salvarTopico}
          salvando={salvando}
        >
          <label className="admin-field">
            <span>Nome do tópico</span>

            <input
              value={formTopico.nome}
              onChange={(event) =>
                setFormTopico(
                  (atual) => ({
                    ...atual,
                    nome: event.target
                      .value,
                  })
                )
              }
              placeholder="Ex.: Interpretação de texto"
            />
          </label>

          <div className="admin-field-row">
            <label className="admin-field">
              <span>Ordem</span>

              <input
                type="number"
                min="0"
                value={formTopico.ordem}
                onChange={(event) =>
                  setFormTopico(
                    (atual) => ({
                      ...atual,
                      ordem:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(
                  formTopico.ativo
                )}
                onChange={(event) =>
                  setFormTopico(
                    (atual) => ({
                      ...atual,
                      ativo:
                        event.target
                          .checked,
                    })
                  )
                }
              />

              Tópico ativo
            </label>
          </div>

          <label className="admin-field">
            <span>Descrição</span>

            <textarea
              rows="4"
              value={formTopico.descricao}
              onChange={(event) =>
                setFormTopico(
                  (atual) => ({
                    ...atual,
                    descricao:
                      event.target.value,
                  })
                )
              }
              placeholder="Descrição opcional do tópico."
            />
          </label>
        </Modal>
      )}
    </div>
  );
}