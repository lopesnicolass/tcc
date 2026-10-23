// A vitrine do formigueiro é diferente do progresso salvo: salas bloqueadas
// só aparecem na navegação quando o jogador entra no modo de decoração.
export function salasVisiveisNoMapa(salas, decorando) {
  return salas.filter((sala) => decorando || sala.conquistada);
}

// Mantém a mesma disposição de três salas: 1 e 2 na base, 3 no topo.
// Com somente uma sala desbloqueada, a área navegável não exibe espaços vazios.
export function formatoMapa(salasVisiveis) {
  if (salasVisiveis.length === 1) return 'individual';
  return salasVisiveis.some((sala) => sala.numero === 3) ? 'piramide' : 'base';
}
