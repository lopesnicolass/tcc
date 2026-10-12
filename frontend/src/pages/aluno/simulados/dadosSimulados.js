// Regras compartilhadas pela listagem e pela navegação dos simulados.
// Mantidas fora dos componentes para evitar filtros diferentes entre telas.
export const MATERIAS_SIMULADOS = [
  'Português', 'Matemática', 'História', 'Geografia', 'Ciências', 'Simulados Gerais'
];

const ALIASES = {
  'Língua Portuguesa': 'Português',
  'Ciências da Natureza': 'Ciências',
  Geral: 'Simulados Gerais',
  'Simulado Geral': 'Simulados Gerais',
  'Simulados Gerais': 'Simulados Gerais',
  'Geral/Misto': 'Simulados Gerais',
  Misto: 'Simulados Gerais'
};

export function normalizarMateria(materia) {
  return ALIASES[materia] || materia || 'Sem matéria';
}

export function normalizarMateriaSimulado(simulado) {
  if (!simulado) return 'Sem matéria';
  if (
    simulado.tipo === 'geral' || simulado.tipo === 'misto' ||
    simulado.is_geral === true || simulado.simulado_geral === true ||
    (Array.isArray(simulado.materias) && simulado.materias.length > 1)
  ) return 'Simulados Gerais';
  return normalizarMateria(simulado.materia);
}

export function filtrarPorMateria(simulados, materia) {
  if (materia === 'Todas') return simulados;
  return simulados.filter((item) => normalizarMateriaSimulado(item) === normalizarMateria(materia));
}

export function integrarStatusComHistorico(simulados, historico) {
  const idsConcluidos = new Set(historico.map((item) => Number(item.simulado_id)));
  return simulados.map((item) => {
    // Uma tentativa em andamento no navegador tem prioridade: não a apagamos.
    if (item.status === 'em-progresso') return item;
    const statusOficial = idsConcluidos.has(Number(item.id)) ? 'concluido' : 'nao-iniciado';
    return item.status === statusOficial ? item : { ...item, status: statusOficial };
  });
}

export function calcularIndicadores(historico) {
  const resultados = Array.isArray(historico) ? historico : [];
  const validos = resultados.filter((r) => Number(r.totalQuestoes ?? r.total_questoes) > 0);
  const porMateria = new Map();
  for (const item of validos) {
    const materia = normalizarMateriaSimulado({ materia: item.materia });
    if (materia === 'Simulados Gerais' || materia === 'Sem matéria') continue;
    const anterior = porMateria.get(materia) || { materia, acertos: 0, total: 0 };
    anterior.acertos += Number(item.acertos) || 0;
    anterior.total += Number(item.totalQuestoes ?? item.total_questoes) || 0;
    porMateria.set(materia, anterior);
  }
  const materias = Array.from(porMateria.values()).map((item) => ({
    materia: item.materia,
    percentual: Math.round(100 * item.acertos / item.total),
    tentadas: item.total
  }));
  const media = validos.length
    ? Math.round(validos.reduce((soma, item) =>
      soma + Number(item.porcentagem ?? (100 * item.acertos / (item.totalQuestoes ?? item.total_questoes))), 0
    ) / validos.length)
    : null;
  const ordenadas = [...materias].sort((a, b) => a.percentual - b.percentual);
  return {
    tentativas: resultados.length,
    media,
    materias,
    // Sem duas matérias distintas não há comparação significativa.
    foco: ordenadas.length >= 2 && ordenadas[0].percentual < ordenadas.at(-1).percentual
      ? ordenadas[0] : null
  };
}
