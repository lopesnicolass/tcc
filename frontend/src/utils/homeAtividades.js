// Funções sem dependência de React para o resumo de atividades da Home.
export function criarDataAtividade(atividade) {
  if (!atividade?.data) {
    return null;
  }

  const texto = String(atividade.data).trim();

  let ano;
  let mes;
  let dia;

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    [ano, mes, dia] = texto.split('-').map(Number);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    [dia, mes, ano] = texto.split('/').map(Number);
  } else {
    return null;
  }

  const [horaTexto, minutoTexto] = String(
    atividade.horario || '23:59'
  ).split(':');

  const horas = Number(horaTexto);
  const minutos = Number(minutoTexto);
  if (!Number.isInteger(horas) || horas < 0 || horas > 23 ||
      !Number.isInteger(minutos) || minutos < 0 || minutos > 59) {
    return null;
  }

  const resultado = new Date(ano, mes - 1, dia, horas, minutos, 0, 0);
  const valida = resultado.getFullYear() === ano &&
    resultado.getMonth() === mes - 1 && resultado.getDate() === dia;
  return valida ? resultado : null;
}

export function formatarData(data) {
  if (!data) {
    return '';
  }

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  return texto;
}

export function obterStatusData(atividade) {
  const data = criarDataAtividade(atividade);

  if (!data) {
    return '';
  }

  const agora = new Date();
  const hoje = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const dataSemHorario = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  const diferenca = Math.round(
    (dataSemHorario.getTime() - hoje.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diferenca === 0) {
    return 'Hoje';
  }

  if (diferenca === 1) {
    return 'Amanhã';
  }

  return '';
}

/** Retorna até `limite` atividades futuras, sem as que já foram concluídas. */
export function selecionarProximasAtividades(atividades, agora = new Date(), limite = 4) {
  if (!Array.isArray(atividades)) return [];

  return atividades
    .filter((atividade) => {
      const concluida =
        atividade?.concluida === true ||
        atividade?.concluida === 1 ||
        atividade?.concluida === '1' ||
        atividade?.done === true ||
        atividade?.done === 1 ||
        atividade?.done === '1';
      const data = criarDataAtividade(atividade);
      return !concluida && data !== null && data >= agora;
    })
    .sort((a, b) => criarDataAtividade(a).getTime() - criarDataAtividade(b).getTime())
    .slice(0, Math.max(0, limite));
}
