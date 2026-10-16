/** O localStorage retorna null para chave inexistente; Number(null) seria 0. */
export function lerPrazoSalvo(storage, chave) {
  if (!chave) return NaN;
  const valor = storage.getItem(chave);
  if (valor === null || valor === '') return NaN;
  const prazo = Number(valor);
  return Number.isFinite(prazo) && prazo >= 0 ? prazo : NaN;
}


/** Segundos restantes só são persistidos quando o simulado está pausado. */
export function lerSegundosSalvos(storage, chave) {
  if (!chave) return NaN;
  const valor = storage.getItem(chave);
  if (valor === null || valor === '') return NaN;
  const segundos = Number(valor);
  return Number.isFinite(segundos) && segundos >= 0 ? Math.floor(segundos) : NaN;
}

export function calcularSegundosRestantes(prazo, agora = Date.now()) {
  return Math.max(0, Math.ceil((prazo - agora) / 1000));
}

/** Congela a contagem para voltar à lista, mudar de rota ou fechar a aba. */
export function pausarPrazo(storage, chavePrazo, chaveRestante, agora = Date.now()) {
  if (!chavePrazo || !chaveRestante) return NaN;
  const prazo = lerPrazoSalvo(storage, chavePrazo);
  if (Number.isFinite(prazo)) {
    const restante = calcularSegundosRestantes(prazo, agora);
    storage.setItem(chaveRestante, String(restante));
    storage.removeItem(chavePrazo);
    return restante;
  }
  // Já pausado: nunca descongelar ou zerar na limpeza de outro effect.
  return lerSegundosSalvos(storage, chaveRestante);
}

/** Retoma o prazo a partir do saldo congelado, não de um prazo antigo. */
export function retomarPrazo(storage, chavePrazo, chaveRestante, limite, agora = Date.now()) {
  const pausado = lerSegundosSalvos(storage, chaveRestante);
  const prazoAtivo = lerPrazoSalvo(storage, chavePrazo);
  if (Number.isFinite(pausado)) {
    const restante = Math.min(limite, pausado);
    storage.setItem(chavePrazo, String(agora + restante * 1000));
    storage.removeItem(chaveRestante);
    return restante;
  }
  if (Number.isFinite(prazoAtivo)) {
    return calcularSegundosRestantes(prazoAtivo, agora);
  }
  storage.setItem(chavePrazo, String(agora + limite * 1000));
  return limite;
}
