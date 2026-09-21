// Pecinhas pequenas e reutilizáveis da página de Desempenho.
// Extraído de Desempenho.jsx (estava tudo junto no mesmo arquivo).

export const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '22px',
  boxShadow:
    '0 8px 28px rgba(21,72,125,0.07)'
};

export function CardLabel({
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

export function CardValue({
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

export function CardDescription({
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

export function ComparisonBar({
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

export function LegendItem({
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
