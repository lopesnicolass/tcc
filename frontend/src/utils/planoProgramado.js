// Uma sessão publicada pelo ADM deve aparecer exatamente no mês, semana e dia
// para os quais foi cadastrada. Não aplica prioridades nem cria revisões extras.
const DIAS_POR_SEMANA = {
  1: ['Quarta'],
  2: ['Terça', 'Quinta'],
  3: ['Segunda', 'Quarta', 'Sexta'],
  4: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
  5: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  6: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  7: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
};

export function gerarPlanoProgramado(cronograma) {
  const meses = Number(cronograma?.meses);
  const dias = Number(cronograma?.frequencia_dias);
  const sessoes = cronograma?.sessoes;
  if (!Number.isInteger(meses) || meses < 1 || meses > 12 ||
      !DIAS_POR_SEMANA[dias] || !Array.isArray(sessoes) || !sessoes.length) return [];

  const dataInicial = new Date();
  const diasDaSemana = DIAS_POR_SEMANA[dias];
  return Array.from({ length: meses }, (_, indiceMes) => {
    const data = new Date(dataInicial.getFullYear(), dataInicial.getMonth() + indiceMes, 1);
    return {
      numero: indiceMes + 1,
      nome: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      semanas: Array.from({ length: 4 }, (_, indiceSemana) => ({
        number: indiceSemana + 1,
        days: diasDaSemana.map((nomeDia, indiceDia) => ({
          day: nomeDia,
          items: sessoes
            .filter((s) => Number(s.mes) === indiceMes + 1 &&
              Number(s.semana) === indiceSemana + 1 &&
              Number(s.dia_estudo) === indiceDia + 1)
            .sort((a, b) => Number(a.sessao) - Number(b.sessao))
            .map((s) => ({
              materia: s.materia,
              materiaId: Number(s.materia_id),
              topico: s.topico,
              topicoId: Number(s.topico_id),
              descricao: s.topico_descricao || '',
              prioridade: 2,
              prioridadeLabel: 'Programado pelo ADM',
              tempoEstimado: 45,
              key: `programado:${cronograma.id}:${s.id}`,
              tipo: 'conteudo',
            })),
        })),
      })),
    };
  });
}
