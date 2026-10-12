// Cada mês do cronograma do Tenna corresponde a 4 semanas de estudos.
// A duração real precisa respeitar essa organização, inclusive no Calendário.
export function lerDataCivil(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return null;
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  data.setHours(0, 0, 0, 0);
  return data;
}

export function fimDoPlanoQuatroSemanas(hoje, meses) {
  if (!(hoje instanceof Date) || Number.isNaN(hoje.getTime()) || !Number.isInteger(meses) || meses < 1) return null;
  // Início da semana (domingo) e último sábado do último bloco de 4 semanas.
  const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const fim = new Date(inicioSemana);
  fim.setDate(inicioSemana.getDate() + meses * 28 - 1);
  return fim;
}

export function avaliarPrazo(meses, dataProva, hoje = new Date()) {
  const prova = lerDataCivil(dataProva);
  const termino = fimDoPlanoQuatroSemanas(hoje, meses);
  if (!prova || !termino) return { ultrapassa: false, conhecido: false };
  return { ultrapassa: termino.getTime() > prova.getTime(), conhecido: true };
}

export function mesesAntesDaProva(maxMeses, dataProva, hoje = new Date()) {
  if (!lerDataCivil(dataProva)) return null;
  let total = 0;
  for (let mes = 1; mes <= maxMeses; mes++) {
    if (!avaliarPrazo(mes, dataProva, hoje).ultrapassa) total = mes;
  }
  return total;
}

export function dataFormatadaPtBr(valor) {
  const data = lerDataCivil(valor);
  return data ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(data) : null;
}
