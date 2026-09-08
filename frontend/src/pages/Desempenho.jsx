import { useEffect, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Desempenho() {
  const [desempenho, setDesempenho] = useState(null);
  const [resultados, setResultados] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  function obterUsuarioId() {
    const usuarioSalvo =
      localStorage.getItem('etecamp_usuario');

    if (!usuarioSalvo) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioSalvo);

      if (usuario.id) {
        return Number(usuario.id);
      }

      if (usuario.usuarioId) {
        return Number(usuario.usuarioId);
      }

      return null;
    } catch (error) {
      console.error(
        'Erro ao ler usuário:',
        error
      );

      return null;
    }
  }

  useEffect(() => {
    async function carregarDesempenho() {
      try {
        setCarregando(true);
        setErro('');

        const usuarioId = obterUsuarioId();

        if (!usuarioId) {
          throw new Error(
            'Não foi possível identificar o usuário logado.'
          );
        }

        const [respostaDesempenho, respostaResultados] =
          await Promise.all([
            fetch(
              `${API_URL}/resultados/${usuarioId}/desempenho`
            ),
            fetch(
              `${API_URL}/resultados/${usuarioId}`
            )
          ]);

        const dadosDesempenho =
          await respostaDesempenho.json();

        const dadosResultados =
          await respostaResultados.json();

        if (!respostaDesempenho.ok) {
          throw new Error(
            dadosDesempenho.mensagem ||
            'Não foi possível carregar o desempenho.'
          );
        }

        if (!respostaResultados.ok) {
          throw new Error(
            dadosResultados.mensagem ||
            'Não foi possível carregar o histórico.'
          );
        }

        setDesempenho(
          dadosDesempenho.desempenho || null
        );

        setResultados(
          Array.isArray(dadosResultados.resultados)
            ? dadosResultados.resultados
            : []
        );

      } catch (error) {
        console.error(
          'Erro ao carregar desempenho:',
          error
        );

        setErro(
          error.message ||
          'Não foi possível carregar seu desempenho.'
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDesempenho();
  }, []);

  function formatarNumero(valor) {
    return Number(valor || 0);
  }

  function formatarPorcentagem(valor) {
    return `${formatarNumero(valor).toFixed(0)}%`;
  }

  function obterPiorResultado() {
    if (!resultados.length) {
      return 0;
    }

    return Math.min(
      ...resultados.map((resultado) =>
        Number(resultado.porcentagem || 0)
      )
    );
  }

  function obterMelhorResultado() {
    if (!resultados.length) {
      return 0;
    }

    return Math.max(
      ...resultados.map((resultado) =>
        Number(resultado.porcentagem || 0)
      )
    );
  }

  function formatarData(data) {
    if (!data) {
      return '';
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return '';
    }

    return dataObj.toLocaleDateString('pt-BR');
  }

  if (carregando) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Desempenho</h1>
            <p>
              Acompanhe sua evolução e identifique pontos de melhoria
            </p>
          </div>
        </div>

        <p>Carregando seu desempenho...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Desempenho</h1>
            <p>
              Acompanhe sua evolução e identifique pontos de melhoria
            </p>
          </div>
        </div>

        <p>{erro}</p>
      </div>
    );
  }

  const mediaGeral =
    formatarNumero(
      desempenho?.mediaPorcentagem
    );

  const melhorResultado =
    obterMelhorResultado();

  const piorResultado =
    obterPiorResultado();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desempenho</h1>
          <p>
            Acompanhe sua evolução e identifique pontos de melhoria
          </p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">
            {formatarPorcentagem(mediaGeral)}
          </div>

          <div className="stat-label">
            Média Geral
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {formatarPorcentagem(melhorResultado)}
          </div>

          <div className="stat-label">
            Melhor resultado
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {formatarPorcentagem(piorResultado)}
          </div>

          <div className="stat-label">
            Menor resultado
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {formatarNumero(
              desempenho?.totalSimulados
            )}
          </div>

          <div className="stat-label">
            Simulados realizados
          </div>
        </div>
      </div>

      <div className="home-grid" style={{ marginBottom: '20px' }}>
        <div className="panel-card">
          <h3>Evolução das notas</h3>

          {resultados.length === 0 ? (
            <div className="chart-placeholder">
              <span>
                Ainda não há resultados de simulados.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '20px 0'
              }}
            >
              {resultados
                .slice()
                .reverse()
                .map((resultado, index) => (
                  <div
                    key={resultado.id}
                    style={{
                      marginBottom: '16px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <span>
                        Simulado {index + 1}
                      </span>

                      <strong>
                        {formatarPorcentagem(
                          resultado.porcentagem
                        )}
                      </strong>
                    </div>

                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                resultado.porcentagem || 0
                              )
                            )
                          )}%`
                        }}
                      />
                    </div>

                    <small>
                      {formatarData(
                        resultado.data_realizacao
                      )}
                    </small>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <h3>Resumo dos estudos</h3>

          <div
            style={{
              display: 'grid',
              gap: '14px',
              marginTop: '20px'
            }}
          >
            <div>
              <strong>
                {formatarNumero(
                  desempenho?.totalQuestoes
                )}
              </strong>

              <span
                style={{
                  display: 'block',
                  fontSize: '14px',
                  opacity: 0.7
                }}
              >
                Questões respondidas
              </span>
            </div>

            <div>
              <strong>
                {formatarNumero(
                  desempenho?.totalAcertos
                )}
              </strong>

              <span
                style={{
                  display: 'block',
                  fontSize: '14px',
                  opacity: 0.7
                }}
              >
                Questões acertadas
              </span>
            </div>

            <div>
              <strong>
                {formatarNumero(
                  desempenho?.totalErros
                )}
              </strong>

              <span
                style={{
                  display: 'block',
                  fontSize: '14px',
                  opacity: 0.7
                }}
              >
                Questões erradas
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel-card">
          <h3>Histórico de simulados</h3>

          {resultados.length === 0 ? (
            <p>
              Você ainda não realizou nenhum simulado.
            </p>
          ) : (
            resultados.map((resultado, index) => (
              <div
                className="bar-row"
                key={resultado.id}
              >
                <div className="bar-row-label">
                  <span>
                    Simulado {resultados.length - index}
                  </span>

                  <span>
                    {formatarPorcentagem(
                      resultado.porcentagem
                    )}
                  </span>
                </div>

                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            resultado.porcentagem || 0
                          )
                        )
                      )}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="panel-card">
          <h3>Resumo do desempenho</h3>

          <div className="achievement-list">
            {desempenho?.totalSimulados > 0 && (
              <div className="achievement-item">
                <div className="achievement-icon">
                  📝
                </div>

                <div className="achievement-text">
                  <strong>
                    Primeiro passo dado
                  </strong>

                  <span>
                    Você já realizou{' '}
                    {desempenho.totalSimulados}{' '}
                    simulado(s).
                  </span>
                </div>
              </div>
            )}

            {mediaGeral >= 70 && (
              <div className="achievement-item">
                <div className="achievement-icon">
                  🎯
                </div>

                <div className="achievement-text">
                  <strong>
                    Bom aproveitamento
                  </strong>

                  <span>
                    Sua média geral está em{' '}
                    {formatarPorcentagem(
                      mediaGeral
                    )}.
                  </span>
                </div>
              </div>
            )}

            {mediaGeral < 70 &&
              desempenho?.totalSimulados > 0 && (
                <div className="achievement-item">
                  <div className="achievement-icon">
                    📚
                  </div>

                  <div className="achievement-text">
                    <strong>
                      Continue estudando
                    </strong>

                    <span>
                      Continue praticando para
                      aumentar sua média.
                    </span>
                  </div>
                </div>
              )}

            {desempenho?.totalSimulados === 0 && (
              <div className="achievement-item">
                <div className="achievement-icon">
                  🚀
                </div>

                <div className="achievement-text">
                  <strong>
                    Comece agora
                  </strong>

                  <span>
                    Realize seu primeiro simulado
                    para acompanhar seu desempenho.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}