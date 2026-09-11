import { useEffect, useMemo, useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const META = 70;

export default function Desempenho() {
  const [desempenho, setDesempenho] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  function obterUsuarioId() {
    const usuarioSalvo = localStorage.getItem('etecamp_usuario');

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
      console.error('Erro ao ler usuário:', error);
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

        const [
          respostaDesempenho,
          respostaResultados
        ] = await Promise.all([
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
          Array.isArray(
            dadosResultados.resultados
          )
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

  function numero(valor) {
    return Number(valor || 0);
  }

  function limitar(
    valor,
    minimo = 0,
    maximo = 100
  ) {
    return Math.min(
      maximo,
      Math.max(minimo, numero(valor))
    );
  }

  function porcentagem(valor) {
    return `${numero(valor).toFixed(0)}%`;
  }

  function formatarData(data) {
    if (!data) {
      return '';
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return '';
    }

    return dataObj.toLocaleDateString(
      'pt-BR'
    );
  }

  function obterNomeSimulado(
    resultado,
    index
  ) {
    const nome =
      resultado?.simulado_nome ||
      resultado?.nome_simulado ||
      resultado?.simulado ||
      resultado?.titulo_simulado ||
      resultado?.titulo ||
      resultado?.nome;

    if (
      typeof nome === 'string' &&
      nome.trim()
    ) {
      return nome.trim();
    }

    return `Simulado ${index + 1}`;
  }

  const mediaGeral = numero(
    desempenho?.mediaPorcentagem
  );

  const totalQuestoes = numero(
    desempenho?.totalQuestoes
  );

  const totalAcertos = numero(
    desempenho?.totalAcertos
  );

  const totalErros = numero(
    desempenho?.totalErros
  );

  const totalSimulados = numero(
    desempenho?.totalSimulados
  );

  const melhorResultado = useMemo(() => {
    if (!resultados.length) {
      return 0;
    }

    return Math.max(
      ...resultados.map((resultado) =>
        numero(resultado.porcentagem)
      )
    );
  }, [resultados]);

  const menorResultado = useMemo(() => {
    if (!resultados.length) {
      return 0;
    }

    return Math.min(
      ...resultados.map((resultado) =>
        numero(resultado.porcentagem)
      )
    );
  }, [resultados]);

  const percentualAcertos =
    totalQuestoes > 0
      ? (totalAcertos / totalQuestoes) * 100
      : 0;

  const percentualErros =
    totalQuestoes > 0
      ? (totalErros / totalQuestoes) * 100
      : 0;

  const faltamParaMeta = Math.max(
    0,
    META - mediaGeral
  );

  const progressoMeta = Math.min(
    100,
    (mediaGeral / META) * 100
  );

  const resultadosCronologicos = useMemo(() => {
    return resultados
      .slice()
      .reverse();
  }, [resultados]);

  const mediaRecente = useMemo(() => {
    if (!resultadosCronologicos.length) {
      return 0;
    }

    const ultimos =
      resultadosCronologicos.slice(-3);

    return (
      ultimos.reduce(
        (soma, resultado) =>
          soma +
          numero(resultado.porcentagem),
        0
      ) / ultimos.length
    );
  }, [resultadosCronologicos]);

  const tendencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 'neutra';
    }

    const ultimo =
      numero(
        resultadosCronologicos[
          resultadosCronologicos.length - 1
        ]?.porcentagem
      );

    const anterior =
      numero(
        resultadosCronologicos[
          resultadosCronologicos.length - 2
        ]?.porcentagem
      );

    if (ultimo > anterior) {
      return 'alta';
    }

    if (ultimo < anterior) {
      return 'baixa';
    }

    return 'neutra';
  }, [resultadosCronologicos]);

  const desvioMedio = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 0;
    }

    const media =
      resultadosCronologicos.reduce(
        (soma, resultado) =>
          soma +
          numero(resultado.porcentagem),
        0
      ) /
      resultadosCronologicos.length;

    const variancia =
      resultadosCronologicos.reduce(
        (soma, resultado) => {
          const diferenca =
            numero(
              resultado.porcentagem
            ) - media;

          return (
            soma +
            diferenca * diferenca
          );
        },
        0
      ) /
      resultadosCronologicos.length;

    return Math.sqrt(variancia);
  }, [resultadosCronologicos]);

  const consistencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 100;
    }

    return limitar(
      100 - desvioMedio * 2
    );
  }, [
    resultadosCronologicos,
    desvioMedio
  ]);

  const mensagemConsistencia = useMemo(() => {
    if (
      resultadosCronologicos.length < 2
    ) {
      return 'Faça mais simulados para medir sua consistência.';
    }

    if (consistencia >= 80) {
      return 'Seu desempenho está bem consistente.';
    }

    if (consistencia >= 60) {
      return 'Seu desempenho apresenta uma variação moderada.';
    }

    return 'Seus resultados estão variando bastante entre os simulados.';
  }, [
    resultadosCronologicos,
    consistencia
  ]);

  /*
   * PONTOS DO GRÁFICO
   */

  const pontosGrafico = useMemo(() => {
    if (!resultadosCronologicos.length) {
      return [];
    }

    return resultadosCronologicos.map(
      (resultado, index) => {
        const valor = limitar(
          resultado.porcentagem
        );

        return {
          valor,
          index,
          resultado
        };
      }
    );
  }, [resultadosCronologicos]);

  if (carregando) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Desempenho</h1>

            <p>
              Acompanhe sua evolução e identifique
              pontos de melhoria
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '50px',
            textAlign: 'center',
            color: '#70829a'
          }}
        >
          Carregando seu desempenho...
        </div>
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
              Acompanhe sua evolução e identifique
              pontos de melhoria
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '30px',
            color: '#d54545'
          }}
        >
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        paddingBottom: '40px'
      }}
    >
      {/* CABEÇALHO */}

      <div className="page-header">
        <div>
          <h1>Desempenho</h1>

          <p>
            Visualize sua evolução, entenda seus
            resultados e descubra onde melhorar.
          </p>
        </div>
      </div>

      {/* HERO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1.45fr 0.55fr',
          gap: '22px',
          marginBottom: '22px'
        }}
      >
        <div
          style={{
            background:
              'linear-gradient(135deg, #0d52b8 0%, #247edb 60%, #46a5f5 100%)',
            borderRadius: '26px',
            padding: '32px',
            color: '#fff',
            minHeight: '245px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow:
              '0 14px 40px rgba(13,82,184,0.20)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '230px',
              height: '230px',
              borderRadius: '50%',
              border:
                '1px solid rgba(255,255,255,0.14)',
              right: '-60px',
              top: '-80px'
            }}
          />

          <div
            style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border:
                '1px solid rgba(255,255,255,0.10)',
              right: '55px',
              bottom: '-90px'
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '13px',
                  opacity: 0.75,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.08em'
                }}
              >
                Seu desempenho atual
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'baseline',
                  gap: '10px',
                  marginTop: '8px'
                }}
              >
                <strong
                  style={{
                    fontSize: '64px',
                    lineHeight: 1
                  }}
                >
                  {porcentagem(
                    mediaGeral
                  )}
                </strong>

                <span
                  style={{
                    fontSize: '14px',
                    opacity: 0.8
                  }}
                >
                  média geral
                </span>
              </div>

              <p
                style={{
                  marginTop: '18px',
                  maxWidth: '470px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  opacity: 0.86
                }}
              >
                {tendencia === 'alta'
                  ? 'Seu último resultado foi melhor que o anterior. Você está avançando!'
                  : tendencia === 'baixa'
                  ? 'Seu último resultado caiu em relação ao anterior. Hora de ajustar os estudos.'
                  : 'Continue praticando para construir uma evolução constante.'}
              </p>
            </div>

            <div
              style={{
                width: '145px',
                height: '145px',
                borderRadius: '50%',
                background:
                  `conic-gradient(
                    #ffffff 0 ${progressoMeta}%,
                    rgba(255,255,255,0.16) ${progressoMeta}% 100%
                  )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '112px',
                  height: '112px',
                  borderRadius: '50%',
                  background:
                    'rgba(13,82,184,0.88)',
                  display: 'flex',
                  flexDirection:
                    'column',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  textAlign: 'center'
                }}
              >
                <strong
                  style={{
                    fontSize: '25px'
                  }}
                >
                  {Math.round(
                    progressoMeta
                  )}%
                </strong>

                <span
                  style={{
                    fontSize: '10px',
                    opacity: 0.8
                  }}
                >
                  da meta
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '26px',
            padding: '28px',
            boxShadow:
              '0 10px 32px rgba(21,72,125,0.08)',
            display: 'flex',
            flexDirection:
              'column',
            justifyContent:
              'space-between'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '12px',
                color: '#8191a6',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.08em'
              }}
            >
              Melhor marca
            </span>

            <div
              style={{
                fontSize: '50px',
                fontWeight: '800',
                color: '#0d52b8',
                marginTop: '8px'
              }}
            >
              {porcentagem(
                melhorResultado
              )}
            </div>
          </div>

          <div
            style={{
              paddingTop: '20px',
              borderTop:
                '1px solid #edf1f6'
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#8191a6'
              }}
            >
              Tendência
            </span>

            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color:
                    tendencia === 'alta'
                      ? '#18834b'
                      : tendencia === 'baixa'
                      ? '#d45151'
                      : '#75869c'
                }}
              >
                {tendencia === 'alta'
                  ? '↗'
                  : tendencia === 'baixa'
                  ? '↘'
                  : '→'}
              </span>

              <strong
                style={{
                  fontSize: '14px',
                  color: '#304966'
                }}
              >
                {tendencia === 'alta'
                  ? 'Em evolução'
                  : tendencia === 'baixa'
                  ? 'Precisa de atenção'
                  : 'Estável'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '22px'
        }}
      >
        <div style={cardStyle}>
          <CardLabel>
            Simulados realizados
          </CardLabel>

          <CardValue>
            {totalSimulados}
          </CardValue>

          <CardDescription>
            Tentativas registradas
          </CardDescription>
        </div>

        <div style={cardStyle}>
          <CardLabel>
            Questões respondidas
          </CardLabel>

          <CardValue>
            {totalQuestoes}
          </CardValue>

          <CardDescription>
            Total de questões
          </CardDescription>
        </div>

        <div style={cardStyle}>
          <CardLabel>
            Acertos
          </CardLabel>

          <CardValue
            style={{
              color: '#18834b'
            }}
          >
            {totalAcertos}
          </CardValue>

          <CardDescription>
            {Math.round(
              percentualAcertos
            )}% das questões
          </CardDescription>
        </div>

        <div style={cardStyle}>
          <CardLabel>
            Erros
          </CardLabel>

          <CardValue
            style={{
              color: '#d45151'
            }}
          >
            {totalErros}
          </CardValue>

          <CardDescription>
            {Math.round(
              percentualErros
            )}% das questões
          </CardDescription>
        </div>
      </div>

      {/* =========================================================
          GRÁFICO PRINCIPAL
      ========================================================= */}

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

      {/* COMPARAÇÃO + DONUT */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1.15fr 0.85fr',
          gap: '22px',
          marginBottom: '22px'
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '26px',
            padding: '30px',
            boxShadow:
              '0 10px 32px rgba(21,72,125,0.08)'
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#173f70',
              fontSize: '19px'
            }}
          >
            Comparação dos resultados
          </h3>

          <p
            style={{
              margin:
                '5px 0 26px',
              fontSize: '13px',
              color: '#8191a6'
            }}
          >
            Veja suas principais marcas lado a lado
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '23px'
            }}
          >
            <ComparisonBar
              label="Média geral"
              value={mediaGeral}
              background="#2689f5"
            />

            <ComparisonBar
              label="Melhor resultado"
              value={melhorResultado}
              background="#18834b"
            />

            <ComparisonBar
              label="Menor resultado"
              value={menorResultado}
              background="#9eabc0"
            />

            <ComparisonBar
              label="Meta"
              value={META}
              background="#d7a31a"
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '26px',
            padding: '30px',
            boxShadow:
              '0 10px 32px rgba(21,72,125,0.08)'
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#173f70',
              fontSize: '19px'
            }}
          >
            Aproveitamento
          </h3>

          <p
            style={{
              margin:
                '5px 0 20px',
              fontSize: '13px',
              color: '#8191a6'
            }}
          >
            Acertos x erros
          </p>

          {totalQuestoes === 0 ? (
            <div
              style={{
                minHeight: '250px',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color: '#8191a6'
              }}
            >
              Ainda não há questões respondidas.
            </div>
          ) : (
            <>
              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'center'
                }}
              >
                <div
                  style={{
                    width: '205px',
                    height: '205px',
                    borderRadius:
                      '50%',
                    background:
                      `conic-gradient(
                        #2689f5 0 ${percentualAcertos}%,
                        #e5ebf2 ${percentualAcertos}% 100%
                      )`,
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center'
                  }}
                >
                  <div
                    style={{
                      width: '137px',
                      height: '137px',
                      borderRadius:
                        '50%',
                      background:
                        '#fff',
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      alignItems:
                        'center',
                      justifyContent:
                        'center'
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          '32px',
                        color:
                          '#0d52b8'
                      }}
                    >
                      {Math.round(
                        percentualAcertos
                      )}%
                    </strong>

                    <span
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#8191a6'
                      }}
                    >
                      aproveitamento
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '12px',
                  marginTop:
                    '25px'
                }}
              >
                <LegendItem
                  value={
                    totalAcertos
                  }
                  label="Acertos"
                  color="#2689f5"
                />

                <LegendItem
                  value={
                    totalErros
                  }
                  label="Erros"
                  color="#e5ebf2"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* META + CONSISTÊNCIA */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 1fr',
          gap: '22px',
          marginBottom: '22px'
        }}
      >
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
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center'
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    '#173f70',
                  fontSize:
                    '19px'
                }}
              >
                Meta de desempenho
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
                Objetivo recomendado: {META}%
              </p>
            </div>

            <strong
              style={{
                fontSize:
                  '25px',
                color:
                  '#0d52b8'
              }}
            >
              {porcentagem(
                mediaGeral
              )}
            </strong>
          </div>

          <div
            style={{
              marginTop:
                '25px'
            }}
          >
            <div
              style={{
                height:
                  '16px',
                background:
                  '#e9eff6',
                borderRadius:
                  '999px',
                overflow:
                  'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressoMeta}%`,
                  height:
                    '100%',
                  background:
                    'linear-gradient(90deg, #54aefa, #0d52b8)',
                  borderRadius:
                    '999px'
                }}
              />
            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                marginTop:
                  '9px',
                fontSize:
                  '12px',
                color:
                  '#8191a6'
              }}
            >
              <span>0%</span>

              <span>
                Meta 70%
              </span>

              <span>100%</span>
            </div>
          </div>

          <div
            style={{
              marginTop:
                '22px',
              padding:
                '16px',
              borderRadius:
                '15px',
              background:
                '#f4f8fd'
            }}
          >
            {faltamParaMeta >
            0 ? (
              <>
                <strong
                  style={{
                    color:
                      '#173f70',
                    fontSize:
                      '15px'
                  }}
                >
                  Faltam{' '}
                  {faltamParaMeta.toFixed(
                    0
                  )}{' '}
                  pontos percentuais
                </strong>

                <span
                  style={{
                    display:
                      'block',
                    marginTop:
                      '4px',
                    color:
                      '#8191a6',
                    fontSize:
                      '12px'
                  }}
                >
                  Continue praticando para alcançar sua meta.
                </span>
              </>
            ) : (
              <>
                <strong
                  style={{
                    color:
                      '#18834b',
                    fontSize:
                      '15px'
                  }}
                >
                  Meta alcançada!
                </strong>

                <span
                  style={{
                    display:
                      'block',
                    marginTop:
                      '4px',
                    color:
                      '#8191a6',
                    fontSize:
                      '12px'
                  }}
                >
                  Você já está acima dos 70%.
                </span>
              </>
            )}
          </div>
        </div>

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
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center'
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color:
                    '#173f70',
                  fontSize:
                    '19px'
                }}
              >
                Consistência
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
                Quanto seus resultados se mantêm próximos
              </p>
            </div>

            <strong
              style={{
                fontSize:
                  '26px',
                color:
                  consistencia >=
                  80
                    ? '#18834b'
                    : consistencia >=
                      60
                    ? '#b18410'
                    : '#d45151'
              }}
            >
              {Math.round(
                consistencia
              )}%
            </strong>
          </div>

          <div
            style={{
              marginTop:
                '25px',
              display:
                'grid',
              gridTemplateColumns:
                'repeat(10, 1fr)',
              gap: '5px'
            }}
          >
            {Array.from({
              length: 10
            }).map(
              (_, index) => {
                const ativo =
                  consistencia >=
                  (index + 1) *
                    10;

                return (
                  <div
                    key={index}
                    style={{
                      height:
                        '32px',
                      borderRadius:
                        '8px',
                      background:
                        ativo
                          ? '#2689f5'
                          : '#e8eef5'
                    }}
                  />
                );
              }
            )}
          </div>

          <div
            style={{
              marginTop:
                '20px',
              padding:
                '16px',
              borderRadius:
                '15px',
              background:
                '#f8fafc'
            }}
          >
            <strong
              style={{
                display:
                  'block',
                fontSize:
                  '14px',
                color:
                  '#173f70',
                marginBottom:
                  '5px'
              }}
            >
              Últimas 3 tentativas
            </strong>

            <span
              style={{
                fontSize:
                  '13px',
                color:
                  '#8191a6'
              }}
            >
              Média recente:{' '}
              <strong
                style={{
                  color:
                    '#0d52b8'
                }}
              >
                {porcentagem(
                  mediaRecente
                )}
              </strong>
            </span>

            <span
              style={{
                display:
                  'block',
                marginTop:
                  '4px',
                fontSize:
                  '12px',
                color:
                  '#8191a6'
              }}
            >
              {
                mensagemConsistencia
              }
            </span>
          </div>
        </div>
      </div>

      {/* HISTÓRICO */}

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
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '22px',
  boxShadow:
    '0 8px 28px rgba(21,72,125,0.07)'
};

function CardLabel({
  children
}) {
  return (
    <span
      style={{
        display: 'block',
        color: '#8191a6',
        fontSize: '12px',
        textTransform:
          'uppercase',
        letterSpacing:
          '0.05em',
        marginBottom:
          '8px'
      }}
    >
      {children}
    </span>
  );
}

function CardValue({
  children,
  style = {}
}) {
  return (
    <strong
      style={{
        display:
          'block',
        color:
          '#173f70',
        fontSize:
          '32px',
        lineHeight: 1,
        ...style
      }}
    >
      {children}
    </strong>
  );
}

function CardDescription({
  children
}) {
  return (
    <span
      style={{
        display:
          'block',
        marginTop:
          '9px',
        color:
          '#8b99aa',
        fontSize:
          '11px'
      }}
    >
      {children}
    </span>
  );
}

function ComparisonBar({
  label,
  value,
  background
}) {
  const valor =
    Math.min(
      100,
      Math.max(
        0,
        Number(value || 0)
      )
    );

  return (
    <div>
      <div
        style={{
          display:
            'flex',
          justifyContent:
            'space-between',
          alignItems:
            'center',
          marginBottom:
            '8px'
        }}
      >
        <span
          style={{
            fontSize:
              '13px',
            color:
              '#45617f'
          }}
        >
          {label}
        </span>

        <strong
          style={{
            fontSize:
              '13px',
            color:
              '#173f70'
          }}
        >
          {valor.toFixed(0)}%
        </strong>
      </div>

      <div
        style={{
          height:
            '12px',
          background:
            '#e9eff6',
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
            background,
            borderRadius:
              '999px',
            transition:
              'width 0.5s ease'
          }}
        />
      </div>
    </div>
  );
}

function LegendItem({
  value,
  label,
  color
}) {
  return (
    <div
      style={{
        padding:
          '14px',
        borderRadius:
          '14px',
        background:
          '#f8fafc',
        display:
          'flex',
        alignItems:
          'center',
        gap:
          '10px'
      }}
    >
      <div
        style={{
          width:
            '10px',
          height:
            '10px',
          borderRadius:
            '50%',
          background:
            color,
          flexShrink:
            0
        }}
      />

      <div>
        <strong
          style={{
            display:
              'block',
            color:
              '#173f70',
            fontSize:
              '20px',
            lineHeight:
              1
          }}
        >
          {value}
        </strong>

        <span
          style={{
            display:
              'block',
            marginTop:
              '4px',
            color:
              '#8191a6',
            fontSize:
              '11px'
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}