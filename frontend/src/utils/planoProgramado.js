// Mantém os conteúdos e a ordem das sessões publicados pela administração.
// O estudante escolhe apenas em quais dias reais da semana deseja cumpri-los.
export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const DIAS_POR_SEMANA = {
  1: [3],
  2: [2, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const pad = (valor) => String(valor).padStart(2, '0');
export const dataCivil = (data) => `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
export function lerDataLocal(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return null;
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}
export function somarDias(data, quantidade) {
  const nova = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  nova.setDate(nova.getDate() + quantidade);
  return nova;
}
export function diasPadrao(quantidade) {
  return [...(DIAS_POR_SEMANA[Number(quantidade)] || [])];
}
export function validarDiasSemana(dias, quantidade) {
  return Array.isArray(dias) && dias.length === Number(quantidade) &&
    new Set(dias).size === dias.length &&
    dias.every((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6);
}

export function formatarPeriodo(inicio, fim) {
  const primeiro = lerDataLocal(inicio);
  const ultimo = lerDataLocal(fim);
  if (!primeiro || !ultimo) return '';
  const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  return `${formato.format(primeiro)} a ${formato.format(ultimo)}`;
}

// Cada modelo administrativo tem quatro semanas por mês civil. O mês 1 sempre
// começa no dia 1º do mês de criação (mesmo se o aluno criar o plano no dia 27).
// As semanas são os períodos 1–7, 8–14, 15–21 e 22–último dia do mês.
export function inicioDoMes(valor = new Date()) {
  const data = valor instanceof Date ? valor : lerDataLocal(valor);
  return data ? dataCivil(new Date(data.getFullYear(), data.getMonth(), 1)) : null;
}

const mesCivil = (inicio, indice) => new Date(inicio.getFullYear(), inicio.getMonth() + indice, 1);
const ultimoDiaMes = (inicio, indice) => new Date(inicio.getFullYear(), inicio.getMonth() + indice + 1, 0);
const nomeMes = (data) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data);
const ordemDias = (dias, inicio) => [...dias].sort((a, b) =>
  ((a - inicio.getDay() + 7) % 7) - ((b - inicio.getDay() + 7) % 7));

function periodoDaSemana(inicioMes, fimMes, indiceSemana) {
  const inicio = somarDias(inicioMes, indiceSemana * 7);
  return {
    inicio,
    fim: indiceSemana === 3 ? fimMes : somarDias(inicio, 6),
  };
}

export function gerarPlanoProgramado(cronograma, opcoes = {}) {
  const meses = Number(cronograma?.meses);
  const quantidadeDias = Number(cronograma?.frequencia_dias);
  const sessoes = cronograma?.sessoes;
  if (!Number.isInteger(meses) || meses < 1 || meses > 12 ||
    !diasPadrao(quantidadeDias).length || !Array.isArray(sessoes) || !sessoes.length) return [];

  const selecionados = opcoes.diasSemana ?? diasPadrao(quantidadeDias);
  if (!validarDiasSemana(selecionados, quantidadeDias)) return [];
  const referencia = lerDataLocal(opcoes.inicio) || new Date();

  return Array.from({ length: meses }, (_, indiceMes) => {
    const primeiro = mesCivil(referencia, indiceMes);
    const ultimo = ultimoDiaMes(referencia, indiceMes);
    return {
      numero: indiceMes + 1,
      nome: nomeMes(primeiro),
      inicio: dataCivil(primeiro),
      fim: dataCivil(ultimo),
      semanas: Array.from({ length: 4 }, (_, indiceSemana) => {
        const { inicio, fim } = periodoDaSemana(primeiro, ultimo, indiceSemana);
        const ordenados = ordemDias(selecionados, inicio);
        return {
          number: indiceSemana + 1,
          inicio: dataCivil(inicio),
          fim: dataCivil(fim),
          days: ordenados.map((indiceDiaSemana, indiceDia) => {
            const data = somarDias(inicio, (indiceDiaSemana - inicio.getDay() + 7) % 7);
            return {
              day: NOMES_DIAS[indiceDiaSemana],
              data: dataCivil(data),
              items: sessoes
                .filter((s) => Number(s.mes) === indiceMes + 1 &&
                  Number(s.semana) === indiceSemana + 1 && Number(s.dia_estudo) === indiceDia + 1)
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
            };
          }),
        };
      }),
    };
  });
}

// Ajusta os dias disponíveis sem trocar de meses e sem descartar itens concluídos.
export function reagendarDatasPlano(plano, opcoes = {}) {
  if (!Array.isArray(plano) || !plano.length) return [];
  const quantidadeDias = plano[0]?.semanas?.[0]?.days?.length;
  const selecionados = opcoes.diasSemana ?? diasPadrao(quantidadeDias);
  if (!validarDiasSemana(selecionados, quantidadeDias)) return [];
  const referencia = lerDataLocal(opcoes.inicio || plano[0].inicio) || new Date();

  return plano.map((mes, mesIndex) => {
    const primeiro = mesCivil(referencia, mesIndex);
    const ultimo = ultimoDiaMes(referencia, mesIndex);
    return {
      ...mes,
      nome: nomeMes(primeiro),
      inicio: dataCivil(primeiro), fim: dataCivil(ultimo),
      semanas: mes.semanas.map((semana, semanaIndex) => {
        const { inicio, fim } = periodoDaSemana(primeiro, ultimo, semanaIndex);
        const ordenados = ordemDias(selecionados, inicio);
        return {
          ...semana,
          inicio: dataCivil(inicio), fim: dataCivil(fim),
          days: semana.days.map((dia, indice) => {
            const diaSemana = ordenados[indice];
            const data = somarDias(inicio, (diaSemana - inicio.getDay() + 7) % 7);
            return { ...dia, day: NOMES_DIAS[diaSemana], data: dataCivil(data) };
          }),
        };
      }),
    };
  });
}

export function avaliarPrazoPlanoReal(meses, dataProva, inicio = new Date()) {
  const prova = lerDataLocal(dataProva);
  const inicial = inicio instanceof Date ? inicio : lerDataLocal(inicio);
  if (!prova || !inicial || !Number.isInteger(Number(meses)) || Number(meses) < 1) {
    return { conhecido: false, ultrapassa: false, termino: null };
  }
  const termino = ultimoDiaMes(inicial, Number(meses) - 1);
  return { conhecido: true, ultrapassa: termino > prova, termino: dataCivil(termino) };
}
