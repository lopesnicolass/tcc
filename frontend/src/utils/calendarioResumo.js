/** Resumos e eventos do calendário sem depender do navegador ou da API. */
export function resumirMes(atividades = [], prefixo = '') {
  const mes = atividades.filter((atividade) =>
    typeof atividade?.data === 'string' && atividade.data.startsWith(prefixo)
  );
  return {
    atividades: mes.length,
    concluidas: mes.filter((atividade) => Boolean(atividade.done)).length,
    diasPlanejados: new Set(mes.map((atividade) => atividade.data)).size,
  };
}

export function resumirDia(atividades = []) {
  return {
    total: atividades.length,
    concluidas: atividades.filter((atividade) => Boolean(atividade.done)).length,
  };
}

/** Exibe até limite eventos, incluindo datas importantes na contagem. */
export function eventosVisiveisDia(atividades = [], datasImportantes = [], limite = 2) {
  const eventos = [
    ...datasImportantes.map((item) => ({ tipo: 'importante', item })),
    ...[...atividades].sort((a, b) =>
      String(a.horario || '').localeCompare(String(b.horario || ''))
    ).map((item) => ({ tipo: 'atividade', item })),
  ];
  return {
    visiveis: eventos.slice(0, Math.max(0, limite)),
    restantes: Math.max(0, eventos.length - limite),
    total: eventos.length,
  };
}
