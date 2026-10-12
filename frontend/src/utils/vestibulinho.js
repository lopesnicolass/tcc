// A data da prova vem do calendário administrado no backend (formato YYYY-MM-DD).
// Usa datas civis para não perder/ganhar um dia por horário ou mudança de fuso.
export function diasAteVestibulinho(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ''))) {
    return null;
  }

  const [ano, mes, dia] = data.split('-').map(Number);
  const alvo = Date.UTC(ano, mes - 1, dia);
  const dataValida = new Date(alvo);

  if (dataValida.getUTCFullYear() !== ano ||
      dataValida.getUTCMonth() !== mes - 1 ||
      dataValida.getUTCDate() !== dia) {
    return null;
  }

  const hoje = new Date();
  const dataHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.max(0, Math.round((alvo - dataHoje) / 86400000));
}
