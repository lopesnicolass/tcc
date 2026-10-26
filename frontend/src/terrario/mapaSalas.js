// Em modo foco mostramos somente a câmara escolhida. No modo decorar,
// o mapa completo aparece para navegar entre salas (inclusive bloqueadas).
export function salasVisiveisNoMapa(salas, decorando, salaSelecionada = 1) {
  if (decorando) return salas;
  const atual = salas.find((sala) => sala.numero === salaSelecionada && sala.conquistada);
  const primeiraLiberada = salas.find((sala) => sala.conquistada);
  return atual ? [atual] : primeiraLiberada ? [primeiraLiberada] : [];
}

// Com uma só sala, o cenário ocupa a área sem rolagem horizontal.
// Durante a decoração, as duas salas inferiores e a superior formam a pirâmide.
export function formatoMapa(salasVisiveis) {
  if (salasVisiveis.length <= 1) return 'individual';
  return salasVisiveis.some((sala) => sala.numero === 3) ? 'piramide' : 'base';
}
