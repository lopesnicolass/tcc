import { ComparisonBar, LegendItem } from './UI.jsx';
import { META } from './constants.js';

// Par de cards lado a lado: comparação das principais marcas e
// donut de aproveitamento (acertos x erros).
// Extraído de Desempenho.jsx (era a seção "COMPARAÇÃO + DONUT").

export function ComparacaoAproveitamento({
  mediaGeral,
  melhorResultado,
  menorResultado,
  totalQuestoes,
  percentualAcertos,
  totalAcertos,
  totalErros
}) {
  return (
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
  );
}
