export default function Desempenho() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desempenho</h1>
          <p>Acompanhe sua evolução e identifique pontos de melhoria</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">73%</div>
          <div className="stat-label">Média Geral</div>
          <span className="stat-delta">↑ 5%</span>
        </div>
        <div className="stat-card">
          <div className="stat-value">Português</div>
          <div className="stat-label">Melhor desempenho</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Ciências</div>
          <div className="stat-label">Pior desempenho</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">124h</div>
          <div className="stat-label">Horas estudadas</div>
          <span className="stat-delta">↑ 25%</span>
        </div>
      </div>

      <div className="home-grid" style={{ marginBottom: '20px' }}>
        <div className="panel-card">
          <h3>Evolução das notas</h3>
          <div className="chart-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 20V10M11 20V4M18 20v-7" /></svg>
          </div>
        </div>
        <div className="panel-card">
          <h3>Desempenho por matéria</h3>
          <div className="chart-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7 4" /></svg>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel-card">
          <h3>Matérias - Detalhamento</h3>
          <div className="bar-row">
            <div className="bar-row-label"><span>Matemática</span><span>87%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '87%' }}></div></div>
          </div>
          <div className="bar-row">
            <div className="bar-row-label"><span>Português</span><span>100%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '100%' }}></div></div>
          </div>
          <div className="bar-row">
            <div className="bar-row-label"><span>História</span><span>54%</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '54%' }}></div></div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Conquistas recentes</h3>
          <div className="achievement-list">
            <div className="achievement-item">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-text">
                <strong>Nota Máxima</strong>
                <span>Acertou 100% em um simulado</span>
              </div>
            </div>
            <div className="achievement-item">
              <div className="achievement-icon">🎯</div>
              <div className="achievement-text">
                <strong>Meta Semanal</strong>
                <span>Completou 20h de estudo em uma semana</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}