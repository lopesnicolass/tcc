import { createPortal } from 'react-dom';

// Tela de resultado final (em tela cheia, via portal) mostrada
// depois que o aluno termina um simulado.
// Extraído de Simulados.jsx (era o bloco "RESULTADO FINAL").

export function TelaResultado({
  simuladoSelecionado,
  resultadoFinal,
  tempoGasto,
  mostrarErros,
  setMostrarErros,
  refazerSimulado,
  voltarParaSimulados,
  formatarTempo
}) {
  return createPortal(
    <div className="simulado-fullscreen">

      <div className="page-header">
        <div>
          <h1>
            Resultado do simulado
          </h1>

          <p>
            {simuladoSelecionado.titulo}
          </p>
        </div>
      </div>

      <div
        className="stat-card"
        style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '40px'
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            marginBottom: '10px'
          }}
        >
          🎉 Simulado concluído!
        </h2>

        <p
          style={{
            fontSize: '18px',
            marginBottom: '35px'
          }}
        >
          Confira seu desempenho:
        </p>

        <div
          className="stats-row"
          style={{
            marginBottom: '30px'
          }}
        >
          <div className="stat-card">
            <div
              className="stat-value"
              style={{
                color: '#16a34a'
              }}
            >
              {resultadoFinal.acertos}
            </div>

            <div className="stat-label">
              Acertos
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-value"
              style={{
                color: '#dc2626'
              }}
            >
              {resultadoFinal.erros}
            </div>

            <div className="stat-label">
              Erros
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              {Number(
                resultadoFinal.porcentagem
              ).toFixed(2)}
              %
            </div>

            <div className="stat-label">
              Aproveitamento
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-value"
              style={{
                color: '#0D47A1',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              ⏱ {formatarTempo(tempoGasto)}
            </div>

            <div className="stat-label">
              Tempo gasto
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '16px',
            marginBottom: '30px'
          }}
        >
          Você acertou{' '}
          <strong>
            {resultadoFinal.acertos}
          </strong>{' '}
          de{' '}
          <strong>
            {resultadoFinal.totalQuestoes}
          </strong>{' '}
          questões.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}
        >
          <button
            className="simulado-btn"
            onClick={() =>
              setMostrarErros(
                !mostrarErros
              )
            }
          >
            {mostrarErros
              ? 'Ocultar questões'
              : 'Ver questões'}
          </button>

          <button
            className="simulado-btn"
            onClick={
              refazerSimulado
            }
          >
            Refazer simulado
          </button>

          <button
            className="simulado-btn"
            onClick={
              voltarParaSimulados
            }
          >
            Voltar para simulados
          </button>
        </div>
      </div>

      {mostrarErros && (
        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '50px'
          }}
        >
          <div className="stat-card">
            <h2>
              Correção das questões
            </h2>

            <p>
              Confira quais questões
              você acertou e quais
              errou.
            </p>
          </div>

          {resultadoFinal.detalhes.map(
            (item) => {
              const {
                questao,
                index,
                respostaUsuario,
                respostaCorreta,
                acertou
              } = item;

              return (
                <div
                  key={questao.id}
                  className="simulado-card"
                  style={{
                    padding: '25px',
                    border:
                      acertou
                        ? '2px solid #16a34a'
                        : '2px solid #dc2626'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span className="simulado-subject">
                      Questão {index + 1}
                    </span>

                    <span
                      style={{
                        padding: '7px 14px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        color: acertou
                          ? '#166534'
                          : '#991b1b',
                        background: acertou
                          ? '#dcfce7'
                          : '#fee2e2'
                      }}
                    >
                      {acertou
                        ? '✓ Acertou'
                        : '✕ Errou'}
                    </span>
                  </div>

                  <h2
                    style={{
                      marginBottom: '25px'
                    }}
                  >
                    {questao.pergunta}
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {[
                      ['A', questao.alternativa_a],
                      ['B', questao.alternativa_b],
                      ['C', questao.alternativa_c],
                      ['D', questao.alternativa_d],
                      ['E', questao.alternativa_e]
                    ].map(
                      ([letra, texto]) => {
                        const ehCorreta =
                          letra ===
                          respostaCorreta;

                        const foiSelecionada =
                          letra ===
                          respostaUsuario;

                        let background =
                          '#ffffff';

                        let border =
                          '1px solid #d1d5db';

                        if (ehCorreta) {
                          background =
                            '#dcfce7';

                          border =
                            '2px solid #16a34a';
                        }

                        if (
                          foiSelecionada &&
                          !ehCorreta
                        ) {
                          background =
                            '#fee2e2';

                          border =
                            '2px solid #dc2626';
                        }

                        return (
                          <div
                            key={letra}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 16px',
                              borderRadius: '10px',
                              border,
                              background
                            }}
                          >
                            <strong
                              style={{
                                minWidth: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background:
                                  ehCorreta
                                    ? '#16a34a'
                                    : foiSelecionada
                                    ? '#dc2626'
                                    : '#e5e7eb',
                                color:
                                  ehCorreta ||
                                  foiSelecionada
                                    ? '#ffffff'
                                    : '#111827'
                              }}
                            >
                              {letra}
                            </strong>

                            <span
                              style={{
                                flex: 1
                              }}
                            >
                              {texto}
                            </span>

                            {ehCorreta && (
                              <strong
                                style={{
                                  color: '#166534'
                                }}
                              >
                                ✓ Correta
                              </strong>
                            )}

                            {foiSelecionada &&
                              !ehCorreta && (
                                <strong
                                  style={{
                                    color: '#991b1b'
                                  }}
                                >
                                  Sua resposta
                                </strong>
                              )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '20px',
                      padding: '15px',
                      borderRadius: '10px',
                      background:
                        acertou
                          ? '#f0fdf4'
                          : '#fef2f2'
                    }}
                  >
                    {acertou ? (
                      <p
                        style={{
                          margin: 0,
                          color: '#166534'
                        }}
                      >
                        <strong>
                          Você acertou!
                        </strong>{' '}
                        A alternativa{' '}
                        <strong>
                          {respostaCorreta}
                        </strong>{' '}
                        é a correta.
                      </p>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          color: '#991b1b'
                        }}
                      >
                        <strong>
                          Você errou.
                        </strong>{' '}
                        Sua resposta:{' '}
                        <strong>
                          {respostaUsuario ||
                            'Não respondida'}
                        </strong>
                        {' | '}
                        Resposta correta:{' '}
                        <strong>
                          {respostaCorreta}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
