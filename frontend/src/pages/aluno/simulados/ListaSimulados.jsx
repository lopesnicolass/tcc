import { STATUS_LABEL, BTN_LABEL } from './constants.js';

// Tela principal: lista de simulados disponíveis, com abas de
// matéria e estatísticas gerais.
// Extraído de Simulados.jsx (era o bloco "LISTAGEM").

export function ListaSimulados({
  materias,
  filtro,
  setFiltro,
  simulados,
  erro,
  concluidos,
  simuladosVisiveis,
  abrirSimulado,
  carregandoQuestoes
}) {
  const gruposPorMateria = Array.from(
    simuladosVisiveis.reduce(
      (mapa, simulado) => {
        const materia =
          simulado.materia ||
          'Sem matéria';

        if (!mapa.has(materia)) {
          mapa.set(materia, []);
        }

        mapa.get(materia).push(simulado);

        return mapa;
      },
      new Map()
    )
  );

  return (
    <div>

      <div className="simulados-hero">
        <h1>Simulados</h1>
        <p>Pratique seus conhecimentos, acompanhe seus resultados e avance na sua preparação para o Vestibulinho.</p>
      </div>

      <div className="materia-tabs">

        {materias.map((materia) => (
          <button
            key={materia}
            className={`materia-tab ${filtro === materia ? 'active' : ''}`}
            onClick={() => setFiltro(materia)}
          >
            <span className="materia-tab-icon" aria-hidden="true" />
            {materia}
            <span className="materia-tab-count">
              {materia === 'Todas'
                ? simulados.length
                : simulados.filter((s) => s.materia === materia).length}
            </span>
          </button>
        ))}

      </div>

      {erro && (
        <div
          className="stat-card"
          style={{
            marginBottom: '20px'
          }}
        >
          <p>{erro}</p>
        </div>
      )}

      <div className="stats-row">

        <div className="stat-card">

          <div className="stat-value">
            {String(
              concluidos
            ).padStart(2, '0')}
          </div>

          <div className="stat-label">
            Simulados concluídos
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-value">
            {simulados.length}
          </div>

          <div className="stat-label">
            Simulados disponíveis
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-value">
            {simulados.reduce(
              (
                total,
                simulado
              ) =>
                total +
                Number(
                  simulado.quantidade_questoes ||
                    0
                ),
              0
            )}
          </div>

          <div className="stat-label">
            Questões disponíveis
          </div>

        </div>

      </div>

      {simuladosVisiveis.length === 0 ? (

        <div
          className="stat-card"
          style={{
            marginTop: '25px'
          }}
        >

          <h2>
            Nenhum simulado encontrado.
          </h2>

          <p>
            Os simulados cadastrados
            pelo administrador
            aparecerão aqui.
          </p>

        </div>

      ) : (

        <div
          style={{
            marginTop: '25px'
          }}
        >
          {gruposPorMateria.map(
            ([materia, listaMateria]) => {
              const gruposPorConteudo =
                Array.from(
                  listaMateria.reduce(
                    (mapa, simulado) => {
                      const chave =
                        simulado.topico_id != null
                          ? `topico-${simulado.topico_id}`
                          : 'sem-conteudo';

                      if (!mapa.has(chave)) {
                        mapa.set(chave, {
                          nome:
                            simulado.topico ||
                            'Conteúdo não definido',
                          simulados: []
                        });
                      }

                      mapa
                        .get(chave)
                        .simulados.push(
                          simulado
                        );

                      return mapa;
                    },
                    new Map()
                  )
                );

              return (
                <section
                  key={materia}
                  style={{
                    marginBottom: '35px'
                  }}
                >
                  <h2
                    style={{
                      marginBottom: '8px'
                    }}
                  >
                    {materia}
                  </h2>

                  {gruposPorConteudo.map(
                    ([
                      chave,
                      grupo
                    ]) => (
                      <div
                        key={chave}
                        style={{
                          marginTop: '20px'
                        }}
                      >
                        <h3
                          style={{
                            marginBottom: '15px'
                          }}
                        >
                          {grupo.nome}
                        </h3>

                        <div className="simulado-grid">
                          {grupo.simulados.map(
                            (simulado) => (
                              <div
                                className="simulado-card"
                                key={
                                  simulado.id
                                }
                              >
                                <div className="simulado-top">
                                  <span className="simulado-subject">
                                    {
                                      simulado.materia ||
                                      'Simulado'
                                    }
                                  </span>

                                  <span
                                    className={`status-badge ${simulado.status}`}
                                  >
                                    {
                                      STATUS_LABEL[
                                        simulado.status
                                      ]
                                    }
                                  </span>
                                </div>

                                <h2
                                  style={{
                                    marginTop: '15px',
                                    marginBottom:
                                      '10px'
                                  }}
                                >
                                  {
                                    simulado.titulo
                                  }
                                </h2>

                                {simulado.descricao && (
                                  <p
                                    style={{
                                      marginBottom:
                                        '20px'
                                    }}
                                  >
                                    {
                                      simulado.descricao
                                    }
                                  </p>
                                )}

                                <div className="simulado-meta">
                                  <span>
                                    📝{' '}
                                    {
                                      simulado.quantidade_questoes
                                    }{' '}
                                    questões
                                  </span>

                                  <span>
                                    ⏱{' '}
                                    {
                                      simulado.tempo_limite
                                    }{' '}
                                    minutos
                                  </span>
                                </div>

                                <button
                                  className="simulado-btn"
                                  onClick={() =>
                                    abrirSimulado(
                                      simulado
                                    )
                                  }
                                  disabled={
                                    carregandoQuestoes
                                  }
                                  style={{
                                    marginTop:
                                      '20px'
                                  }}
                                >
                                  {carregandoQuestoes
                                    ? 'Carregando...'
                                    : BTN_LABEL[
                                        simulado.status
                                      ]}
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </section>
              );
            }
          )}
        </div>

      )}

    </div>
  );
}
