import { createPortal } from 'react-dom';

// Tela de questões do simulado (em tela cheia, via portal),
// onde o aluno responde e finaliza.
// Extraído de Simulados.jsx (era o bloco "TELA DAS QUESTÕES").

export function TelaSimulado({
  simuladoSelecionado,
  questoes,
  tempoRestante,
  respostas,
  salvandoResultado,
  voltarParaSimulados,
  formatarTempo,
  selecionarResposta,
  proximaQuestao,
  finalizarSimulado
}) {
  return createPortal(
    <div className="simulado-fullscreen">

      <div className="page-header">
        <div>

          <button
            className="simulado-btn"
            onClick={
              voltarParaSimulados
            }
            disabled={
              salvandoResultado
            }
            style={{
              marginBottom: '15px'
            }}
          >
            ← Voltar para simulados
          </button>

          <h1>
            {simuladoSelecionado.titulo}
          </h1>

          {simuladoSelecionado.descricao && (
            <p>
              {simuladoSelecionado.descricao}
            </p>
          )}

        </div>
      </div>

      <div className="stats-row">

        <div className="stat-card">
          <div className="stat-value">
            {questoes.length}
          </div>

          <div className="stat-label">
            Questões
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {simuladoSelecionado.tempo_limite}
          </div>

          <div className="stat-label">
            Minutos
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            border: tempoRestante !== null && tempoRestante <= 60
              ? '2px solid #dc2626'
              : '2px solid #90CAF9',
            background: tempoRestante !== null && tempoRestante <= 60
              ? '#fef2f2'
              : '#ffffff'
          }}
        >
          <div
            className="stat-value"
            style={{
              color: tempoRestante !== null && tempoRestante <= 60
                ? '#dc2626'
                : '#0D47A1',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            ⏱ {formatarTempo(tempoRestante)}
          </div>

          <div className="stat-label">
            Tempo restante
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {Object.keys(respostas).length}
          </div>

          <div className="stat-label">
            Respondidas
          </div>
        </div>

      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '25px',
          marginTop: '30px'
        }}
      >

        {questoes.length === 0 ? (

          <div className="stat-card">
            <h2>
              Este simulado ainda
              não possui questões.
            </h2>

            <p>
              O administrador
              precisa adicionar
              questões antes de
              você poder realizar
              o simulado.
            </p>
          </div>

        ) : (

          questoes.map(
            (questao, index) => {

              const respostaSelecionada =
                respostas[questao.id];

              const respondeu =
                Boolean(
                  respostaSelecionada
                );

              return (
                <div
                  className="simulado-card"
                  id={`questao-${index}`}
                  key={questao.id}
                  style={{
                    padding: '25px'
                  }}
                >

                  <div className="simulado-top">

                    <span className="simulado-subject">
                      Questão {index + 1}
                    </span>

                    {questao.materia && (
                      <span className="status-badge concluido">
                        {questao.materia}
                      </span>
                    )}

                  </div>

                  <h2
                    style={{
                      marginTop: '20px',
                      marginBottom: '25px'
                    }}
                  >
                    {questao.pergunta}
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
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

                        const selecionada =
                          respostaSelecionada ===
                          letra;

                        return (
                          <button
                            key={letra}
                            type="button"
                            disabled={
                              salvandoResultado
                            }
                            onClick={() =>
                              selecionarResposta(
                                questao.id,
                                letra
                              )
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                              width: '100%',
                              textAlign: 'left',
                              padding: '16px 18px',
                              borderRadius: '10px',

                              border:
                                selecionada
                                  ? '2px solid #2563eb'
                                  : '1px solid #d1d5db',

                              background:
                                selecionada
                                  ? '#eff6ff'
                                  : '#ffffff',

                              cursor:
                                salvandoResultado
                                  ? 'default'
                                  : 'pointer',

                              fontSize: '16px'
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
                                  selecionada
                                    ? '#2563eb'
                                    : '#e5e7eb',

                                color:
                                  selecionada
                                    ? '#ffffff'
                                    : '#111827'
                              }}
                            >
                              {letra}
                            </strong>

                            <span>
                              {texto}
                            </span>

                          </button>
                        );
                      }
                    )}

                  </div>

                  {respondeu && (
                    <p
                      style={{
                        marginTop: '12px',
                        fontSize: '14px',
                        opacity: 0.7
                      }}
                    >
                      Você pode alterar sua
                      resposta antes de
                      finalizar o simulado.
                    </p>
                  )}

                  {index <
                    questoes.length - 1 && (

                    <button
                      className="simulado-btn"
                      onClick={() =>
                        proximaQuestao(
                          index
                        )
                      }
                      style={{
                        marginTop: '25px'
                      }}
                    >
                      Próxima questão →
                    </button>

                  )}

                </div>
              );
            }
          )

        )}

      </div>

      {questoes.length > 0 && (

        <div
          style={{
            marginTop: '35px',
            marginBottom: '50px',
            padding: '25px',
            textAlign: 'center'
          }}
        >

          <button
            className="simulado-btn"
            onClick={
              finalizarSimulado
            }
            disabled={
              salvandoResultado
            }
            style={{
              padding: '14px 35px',
              fontSize: '16px'
            }}
          >
            {salvandoResultado
              ? 'Salvando resultado...'
              : 'Finalizar simulado'}
          </button>

        </div>

      )}

    </div>,
    document.body
  );
}
