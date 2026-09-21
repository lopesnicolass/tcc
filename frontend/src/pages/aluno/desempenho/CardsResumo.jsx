import { CardLabel, CardValue, CardDescription, cardStyle } from './UI.jsx';

// Os 4 cards de resumo logo abaixo do hero.
// Extraído de Desempenho.jsx.

export function CardsResumo({
  totalSimulados,
  totalQuestoes,
  totalAcertos,
  totalErros,
  percentualAcertos,
  percentualErros
}) {
  return (
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
  );
}
