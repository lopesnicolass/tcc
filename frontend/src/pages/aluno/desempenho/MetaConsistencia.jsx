import { META } from './constants.js';

// Par de cards lado a lado: progresso em direção à meta e
// consistência dos resultados.
// Extraído de Desempenho.jsx (era a seção "META + CONSISTÊNCIA").

export function MetaConsistencia({
  porcentagem,
  mediaGeral,
  progressoMeta,
  faltamParaMeta,
  consistencia,
  mediaRecente,
  mensagemConsistencia
}) {
  return (
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
  );
}
