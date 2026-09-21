// Cards de estatísticas do topo da tela de Conteúdos do admin.
// Extraído de AdminConteudos.jsx (era a seção "ESTATÍSTICAS").

export function Estatisticas({
  totalMaterias,
  totalAtivas,
  totalTopicos,
  totalTopicosAtivos,
}) {
  return (
    <section className="admin-content-stats">

      <article className="stat-card">
        <div className="stat-value">
          {totalMaterias}
        </div>

        <div className="stat-label">
          Matérias cadastradas
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-value">
          {totalAtivas}
        </div>

        <div className="stat-label">
          Matérias ativas
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-value">
          {totalTopicos}
        </div>

        <div className="stat-label">
          Tópicos cadastrados
        </div>
      </article>

      <article className="stat-card">
        <div className="stat-value">
          {totalTopicosAtivos}
        </div>

        <div className="stat-label">
          Tópicos ativos
        </div>
      </article>

    </section>
  );
}
