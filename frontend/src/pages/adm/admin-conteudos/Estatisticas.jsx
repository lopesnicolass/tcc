const CARDS = [
  ['Matérias cadastradas', 'blue', '▤'],
  ['Matérias ativas', 'green', '✓'],
  ['Conteúdos cadastrados', 'purple', '☷'],
  ['Conteúdos ativos', 'orange', '✓'],
];
export function Estatisticas({ totalMaterias, totalAtivas, totalTopicos, totalTopicosAtivos }) {
  const values = [totalMaterias, totalAtivas, totalTopicos, totalTopicosAtivos];
  return <section className="admin-content-stats" aria-label="Resumo dos conteúdos">
    {CARDS.map(([label, tone, icon], index) => <article className={`admin-content-stat-modern tone-${tone}`} key={label}>
      <div className="admin-content-stat-icon-modern" aria-hidden="true">{icon}</div>
      <strong>{values[index]}</strong><span>{label}</span>
    </article>)}
  </section>;
}
