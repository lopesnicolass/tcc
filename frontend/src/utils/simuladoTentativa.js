// A mesma tentativa mantém seu identificador mesmo após reabrir o navegador.
// Uma repetição intencional do simulado recebe um identificador novo.
export function prepararTentativaPersistida(
  armazenamento, chave, nova = false, gerarId = () => crypto.randomUUID()
) {
  if (!chave) throw new Error('Chave da tentativa ausente.');
  const anterior = nova ? null : armazenamento.getItem(chave);
  if (anterior) return anterior;
  const identificador = gerarId();
  armazenamento.setItem(chave, identificador);
  return identificador;
}
