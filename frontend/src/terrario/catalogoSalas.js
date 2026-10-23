// Identidade visual: a Sala 1 é o ninho de descanso, a Sala 2 é o refúgio de estudos.
// Não altera o banco: IDs, preços, propriedade e localizações originais são preservados.
export const MOVEIS_ESTUDO_ANTIGOS = Object.freeze([
  'mesa', 'banquinho', 'prateleira', 'quadro', 'estante',
]);
const estudoAntigo = new Set(MOVEIS_ESTUDO_ANTIGOS);

export function ehMovelDeEstudoAntigo(id) {
  return estudoAntigo.has(id);
}

// Não vender novamente os móveis antigos no catálogo de aconchego.
// Quem já os comprou pode continuar usando-os na Sala 1 até liberar a Sala 2;
// então eles aparecem na Sala 2 junto aos novos, sem perder propriedade,
// posição, tamanho ou gasto com sementes.
export function distribuirMoveis(itensOriginais, itensNovosSala2, inventario = [], sala2Liberada = false) {
  const adquiridos = new Set(inventario.map((item) => item.id));
  const legados = itensOriginais.filter((item) => estudoAntigo.has(item.id) && adquiridos.has(item.id));
  const aconchego = itensOriginais.filter((item) => !estudoAntigo.has(item.id));
  const sala1 = sala2Liberada ? aconchego : [...aconchego, ...legados];
  const sala2 = sala2Liberada ? [...itensNovosSala2, ...legados] : [...itensNovosSala2];
  const salaPorId = Object.fromEntries([
    ...sala1.map(({ id }) => [id, 1]),
    ...sala2.map(({ id }) => [id, 2]),
  ]);
  return { sala1, sala2, salaPorId };
}
