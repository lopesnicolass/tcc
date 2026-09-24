import { Icon } from './icons.jsx';
import { ICONES } from './helpers.js';

// Lista de matérias (com os tópicos expansíveis dentro de cada uma).
// Extraído de AdminConteudos.jsx (era a seção "LISTA").

export function ListaMaterias({
  carregando,
  materiasFiltradas,
  materiaAberta,
  setMateriaAberta,
  abrirEditarMateria,
  alternarMateria,
  excluirMateria,
  abrirNovoTopico,
  abrirEditarTopico,
  abrirConstrutor,
  alternarTopico,
  excluirTopico,
}) {
  if (carregando) {
    return (
      <div
        className="admin-content-empty large"
        style={{
          marginTop:
            '18px',
        }}
      >
        <strong>
          Carregando conteúdos...
        </strong>

        <span>
          Buscando matérias e tópicos no banco.
        </span>
      </div>
    );
  }

  if (materiasFiltradas.length === 0) {
    return (
      <div
        className="admin-content-empty large"
        style={{
          marginTop:
            '18px',
        }}
      >
        <strong>
          Nenhuma matéria encontrada
        </strong>

        <span>
          Tente alterar sua busca ou
          cadastre uma nova matéria.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display:
          'flex',
        flexDirection:
          'column',
        gap:
          '12px',
        marginTop:
          '18px',
      }}
    >
      {materiasFiltradas.map(
        (materia) => {
          const aberta =
            materiaAberta ===
            materia.id;

          const topicosAtivos =
            materia.topicos?.filter(
              (topico) =>
                Boolean(
                  topico.ativo
                )
            ).length || 0;

          return (
            <article
              className="content-subject-card"
              key={
                materia.id
              }
            >

              <div
                className="content-subject-header"
                style={{
                  cursor:
                    'pointer',
                }}
                onClick={() =>
                  setMateriaAberta(
                    aberta
                      ? null
                      : materia.id
                  )
                }
              >

                <div
                  style={{
                    width:
                      '44px',
                    height:
                      '44px',
                    borderRadius:
                      '13px',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    background:
                      materia.cor ||
                      'var(--accent)',
                    color:
                      '#fff',
                    flexShrink:
                      0,
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
                    minWidth:
                      0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap:
                        '8px',
                      flexWrap:
                        'wrap',
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
                        fontWeight:
                          800,
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
                      display:
                        'flex',
                      gap:
                        '14px',
                      marginTop:
                        '6px',
                      color:
                        'var(--muted)',
                      fontSize:
                        '11px',
                      fontWeight:
                        700,
                    }}
                  >
                    <span>
                      {materia.topicos
                        ?.length ||
                        0}{' '}
                      tópicos
                    </span>

                    <span>
                      {topicosAtivos}{' '}
                      ativos
                    </span>

                    <span>
                      Ordem{' '}
                      {materia.ordem}
                    </span>
                  </div>
                </div>

                <div
                  className="admin-subject-actions"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  style={{
                    display:
                      'flex',
                    gap:
                      '6px',
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
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    transition:
                      'transform .2s ease',
                    transform:
                      aberta
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
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      gap:
                        '12px',
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
                        utilizados pelo
                        sistema.
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
                        gap:
                          '7px',
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
                              gap:
                                '10px',
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
                                  index + 1
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
                                gap:
                                  '6px',
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
                                className="mural-btn admin-topic-build"
                                onClick={() =>
                                  abrirConstrutor(
                                    topico
                                  )
                                }
                              >
                                <Icon
                                  name="edit"
                                  size={14}
                                />
                                Construir
                              </button>

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
                                  size={14}
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
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="admin-content-empty">
                      <strong>
                        Nenhum tópico cadastrado.
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
        }
      )}
    </div>
  );
}
