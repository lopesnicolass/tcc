// Bloco do topo da página de Desempenho: card grande com a média
// geral + card menor com melhor marca e tendência.
// Extraído de Desempenho.jsx.

export function Hero({
  mediaGeral,
  tendencia,
  progressoMeta,
  melhorResultado,
  porcentagem
}) {
  return (
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
            position: 'relative',
            zIndex: 3,
            marginBottom: '26px'
          }}
        >
          <h1
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '32px',
              lineHeight: 1.15,
              fontWeight: 700
            }}
          >
            Desempenho
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: 'rgba(255,255,255,0.82)',
              fontSize: '14px',
              lineHeight: 1.5
            }}
          >
            Visualize sua evolução, entenda seus resultados e descubra onde melhorar.
          </p>
        </div>

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
  );
}
