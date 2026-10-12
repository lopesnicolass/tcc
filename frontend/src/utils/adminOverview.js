/** Extrai apenas listas com formato esperado. Dados inválidos não viram estatística zero. */
export function extrairListaAdministrativa(payload, chave) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[chave])) return payload[chave];
  return null;
}

export function resumirFontesAdministrativas(respostas, chaves = ['usuarios', 'simulados', 'questoes', 'provas']) {
  const dados = {};
  const status = {};
  for (const chave of chaves) {
    const resposta = respostas.find((item) => item.chave === chave);
    const lista = resposta?.ok ? extrairListaAdministrativa(resposta.payload, chave) : null;
    status[chave] = Array.isArray(lista);
    dados[chave] = lista || [];
  }
  return { dados, status };
}

export function contarSeDisponivel(lista, disponivel) {
  return disponivel ? lista.length : null;
}
