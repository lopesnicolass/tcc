import { META } from './constants.js';

// Gráfico de linha com a evolução dos simulados ao longo do tempo.
// Extraído de Desempenho.jsx (era a seção "GRÁFICO PRINCIPAL").

export function GraficoEvolucao({
  resultadosCronologicos,
  pontosGrafico,
  obterNomeSimulado,
  formatarData
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '26px',
        padding: '30px',
        boxShadow:
          '0 10px 32px rgba(21,72,125,0.08)',
        marginBottom: '22px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'flex-start',
          marginBottom: '25px'
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: '#173f70',
              fontSize: '19px'
            }}
          >
            Evolução dos simulados
          </h3>

          <p
            style={{
              margin:
                '5px 0 0',
              fontSize: '13px',
              color: '#8191a6'
            }}
          >
            Acompanhe cada tentativa e veja a evolução das suas notas
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#2689f5'
            }}
          />

          <span
            style={{
              fontSize: '12px',
              color: '#8191a6'
            }}
          >
            Resultado
          </span>
        </div>
      </div>

      {resultadosCronologicos.length === 0 ? (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            color: '#8191a6',
            textAlign: 'center'
          }}
        >
          Realize um simulado para começar a acompanhar sua evolução.
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            height: '350px',
            marginTop: '5px'
          }}
        >
          {/* ÁREA DO GRÁFICO */}

          <div
            style={{
              position: 'absolute',
              left: '55px',
              right: '20px',
              top: '15px',
              bottom: '70px'
            }}
          >
            {/* GRADE */}

            {[0, 25, 50, 75, 100].map(
              (valor) => {
                const bottom =
                  `${valor}%`;

                return (
                  <div
                    key={valor}
                    style={{
                      position:
                        'absolute',
                      left: 0,
                      right: 0,
                      bottom,
                      borderTop:
                        '1px dashed #dfe8f2'
                    }}
                  />
                );
              }
            )}

            {/* META */}

            <div
              style={{
                position:
                  'absolute',
                left: 0,
                right: 0,
                bottom:
                  `${META}%`,
                borderTop:
                  '2px dashed #d6a51c'
              }}
            />

            {/* CAMADA SVG SOMENTE PARA A LINHA */}

            <svg
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              style={{
                position:
                  'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow:
                  'visible'
              }}
            >
              {pontosGrafico.length >
                1 && (
                <polygon
                  points={
                    pontosGrafico
                      .map(
                        (ponto, index) => {
                          const x =
                            pontosGrafico.length ===
                            1
                              ? 500
                              : (index /
                                  (pontosGrafico.length -
                                    1)) *
                                1000;

                          const y =
                            100 -
                            ponto.valor;

                          return `${x},${y}`;
                        }
                      )
                      .join(' ') +
                    ` 1000,100 0,100`
                  }
                  fill="#2689f5"
                  opacity="0.08"
                />
              )}

              {pontosGrafico.length >
                1 && (
                <polyline
                  points={pontosGrafico
                    .map(
                      (
                        ponto,
                        index
                      ) => {
                        const x =
                          pontosGrafico.length ===
                          1
                            ? 500
                            : (index /
                                (pontosGrafico.length -
                                  1)) *
                              1000;

                        const y =
                          100 -
                          ponto.valor;

                        return `${x},${y}`;
                      }
                    )
                    .join(' ')}
                  fill="none"
                  stroke="#2689f5"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* PONTOS */}

            {pontosGrafico.map(
              (ponto, index) => {
                const esquerda =
                  pontosGrafico.length ===
                  1
                    ? 50
                    : (index /
                        (pontosGrafico.length -
                          1)) *
                      100;

                const baixo =
                  ponto.valor;

                return (
                  <div
                    key={
                      ponto.resultado
                        ?.id ||
                      index
                    }
                    style={{
                      position:
                        'absolute',
                      left: `${esquerda}%`,
                      bottom: `${baixo}%`,
                      transform:
                        'translate(-50%, 50%)'
                    }}
                  >
                    {/* PORCENTAGEM */}

                    <div
                      style={{
                        position:
                          'absolute',
                        left: '50%',
                        bottom:
                          '25px',
                        transform:
                          'translateX(-50%)',
                        background:
                          '#0d52b8',
                        color: '#ffffff',
                        fontSize:
                          '11px',
                        fontWeight:
                          '800',
                        padding:
                          '5px 8px',
                        borderRadius:
                          '7px',
                        whiteSpace:
                          'nowrap',
                        boxShadow:
                          '0 4px 12px rgba(13,82,184,0.18)',
                        zIndex: 4
                      }}
                    >
                      {Math.round(
                        ponto.valor
                      )}%
                    </div>

                    {/* PONTO */}

                    <div
                      style={{
                        width: '15px',
                        height: '15px',
                        borderRadius:
                          '50%',
                        background:
                          '#ffffff',
                        border:
                          '4px solid #2689f5',
                        boxShadow:
                          '0 3px 10px rgba(38,137,245,0.22)',
                        position:
                          'relative',
                        zIndex: 5
                      }}
                    />
                  </div>
                );
              }
            )}

            {/* EIXO Y */}

            <div
              style={{
                position:
                  'absolute',
                left: '-38px',
                top: 0,
                bottom: 0,
                width: '30px'
              }}
            >
              {[0, 25, 50, 75, 100].map(
                (valor) => (
                  <div
                    key={valor}
                    style={{
                      position:
                        'absolute',
                      left: 0,
                      bottom:
                        `${valor}%`,
                      transform:
                        'translateY(50%)',
                      fontSize: '11px',
                      color:
                        '#8191a6',
                      fontWeight:
                        '500'
                    }}
                  >
                    {valor}%
                  </div>
                )
              )}
            </div>

            {/* TEXTO DA META */}

            <div
              style={{
                position:
                  'absolute',
                right: '-3px',
                bottom:
                  `${META}%`,
                transform:
                  'translateY(-8px)',
                color: '#aa8114',
                fontSize: '10px',
                fontWeight: '800',
                background:
                  '#fffdf3',
                padding:
                  '3px 6px',
                borderRadius:
                  '5px'
              }}
            >
              META {META}%
            </div>
          </div>

          {/* NOMES DOS SIMULADOS */}

          <div
            style={{
              position:
                'absolute',
              left: '55px',
              right: '20px',
              bottom: 0,
              height: '65px'
            }}
          >
            {pontosGrafico.map(
              (ponto, index) => {
                const esquerda =
                  pontosGrafico.length ===
                  1
                    ? 50
                    : (index /
                        (pontosGrafico.length -
                          1)) *
                      100;

                const nome =
                  obterNomeSimulado(
                    ponto.resultado,
                    index
                  );

                return (
                  <div
                    key={
                      ponto.resultado
                        ?.id ||
                      index
                    }
                    style={{
                      position:
                        'absolute',
                      left: `${esquerda}%`,
                      top: 0,
                      transform:
                        'translateX(-50%)',
                      textAlign:
                        'center',
                      minWidth:
                        '80px'
                    }}
                  >
                    <strong
                      style={{
                        display:
                          'block',
                        fontSize:
                          '11px',
                        color:
                          '#173f70',
                        whiteSpace:
                          'nowrap'
                      }}
                    >
                      {nome.length > 16
                        ? `${nome.slice(
                            0,
                            16
                          )}...`
                        : nome}
                    </strong>

                    <span
                      style={{
                        display:
                          'block',
                        marginTop:
                          '4px',
                        fontSize:
                          '10px',
                        color:
                          '#8191a6',
                        whiteSpace:
                          'nowrap'
                      }}
                    >
                      {formatarData(
                        ponto
                          .resultado
                          ?.data_realizacao
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
