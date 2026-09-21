// Lista com o histórico completo de resultados registrados.
// Extraído de Desempenho.jsx (era a seção "HISTÓRICO").

export function Historico({
  resultados,
  mediaGeral,
  limitar,
  obterNomeSimulado,
  formatarData,
  porcentagem
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '26px',
        padding: '30px',
        boxShadow:
          '0 10px 32px rgba(21,72,125,0.08)'
      }}
    >
      <div
        style={{
          marginBottom:
            '20px'
        }}
      >
        <h3
          style={{
            margin: 0,
            color:
              '#173f70',
            fontSize:
              '19px'
          }}
        >
          Histórico de desempenho
        </h3>

        <p
          style={{
            margin:
              '5px 0 0',
            fontSize:
              '13px',
            color:
              '#8191a6'
          }}
        >
          Confira todos os resultados registrados
        </p>
      </div>

      {resultados.length ===
      0 ? (
        <div
          style={{
            padding:
              '35px 0',
            textAlign:
              'center',
            color:
              '#8191a6'
          }}
        >
          Nenhum resultado registrado ainda.
        </div>
      ) : (
        <div
          style={{
            display:
              'grid',
            gap: '12px'
          }}
        >
          {resultados.map(
            (
              resultado,
              index
            ) => {
              const valor =
                limitar(
                  resultado.porcentagem
                );

              const acimaDaMedia =
                valor >=
                mediaGeral;

              return (
                <div
                  key={
                    resultado.id ||
                    index
                  }
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '180px 1fr 70px',
                    gap: '18px',
                    alignItems:
                      'center',
                    padding:
                      '15px 0',
                    borderBottom:
                      index ===
                      resultados.length -
                        1
                        ? 'none'
                        : '1px solid #edf1f6'
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display:
                          'block',
                        fontSize:
                          '13px',
                        color:
                          '#304966'
                      }}
                    >
                      {obterNomeSimulado(
                        resultado,
                        resultados.length -
                          index -
                          1
                      )}
                    </strong>

                    <span
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#93a0b1'
                      }}
                    >
                      {formatarData(
                        resultado.data_realizacao
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      height:
                        '10px',
                      background:
                        '#e8eef5',
                      borderRadius:
                        '999px',
                      overflow:
                        'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${valor}%`,
                        height:
                          '100%',
                        background:
                          acimaDaMedia
                            ? '#2689f5'
                            : '#9aa9bb',
                        borderRadius:
                          '999px'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      textAlign:
                        'right'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          acimaDaMedia
                            ? '#0d52b8'
                            : '#62748b',
                        fontSize:
                          '15px'
                      }}
                    >
                      {porcentagem(
                        valor
                      )}
                    </strong>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
