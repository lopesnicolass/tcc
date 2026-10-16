export function Filtros({ busca, setBusca, filtro, setFiltro }) {
  return <section className="admin-content-filter-panel" aria-label="Buscar e filtrar matérias">
    <label className="admin-content-search-modern">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
      <input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar matéria ou tópico..." aria-label="Buscar matéria ou tópico" />
    </label>
    <label className="admin-content-filter-modern"><span>Exibir</span><select value={filtro} onChange={event => setFiltro(event.target.value)} aria-label="Filtrar matérias por situação">
      <option value="todas">Todas</option><option value="ativas">Ativas</option><option value="inativas">Inativas</option>
    </select></label>
  </section>;
}
