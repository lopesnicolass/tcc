export function CardsResumo({ totalSimulados, totalQuestoes, totalAcertos, totalErros, percentualAcertos, percentualErros }) {
  const itens = [
    { titulo: 'Tentativas', valor: totalSimulados, descricao: 'Simulados finalizados', variante: 'azul' },
    { titulo: 'Questões', valor: totalQuestoes, descricao: 'Questões avaliadas', variante: 'azul' },
    { titulo: 'Acertos', valor: totalAcertos, descricao: `${Math.round(percentualAcertos)}% das questões`, variante: 'verde' },
    { titulo: 'Erros', valor: totalErros, descricao: `${Math.round(percentualErros)}% das questões`, variante: 'vermelho' }
  ];
  return (
    <section className="desempenho-cards-grid" aria-label="Indicadores dos simulados">
      {itens.map((item) => (
        <div className={`desempenho-kpi desempenho-kpi--${item.variante}`}>
          <span className="desempenho-kpi-rotulo">{item.titulo}</span>
          <strong className="desempenho-kpi-numero">{item.valor}</strong>
          <span className="desempenho-kpi-descricao">{item.descricao}</span>
        </div>
        
      ))}
    </section>
  );
}
