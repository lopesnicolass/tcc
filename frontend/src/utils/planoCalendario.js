// Identifica uma sessão do plano, sem confundi-la com outras revisões do mesmo tema.
// A origem é persistida no calendário e permite reconhecer uma sessão já adicionada.
export function chaveSessaoPlano(item, mes, semana, diaIndex, itemIndex) {
  const identificador = String(item?.key || `${mes.numero}-${semana.number}-${diaIndex}-${itemIndex}`);
  return `plano-automatico:${identificador}`;
}

const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];
const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const pad = (numero) => String(numero).padStart(2, '0');

// O modelo tem mês, semana e dia da semana, mas não uma data civil pronta.
// Propõe o dia correspondente no calendário real; o aluno pode modificá-lo antes de salvar.
export function sugerirDataSessao(mes, semana, dia) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dia?.data || '')) return dia.data;
  const titulo = normalizar(mes?.nome);
  const numeroMes = MESES.findIndex((nome) => titulo.includes(nome));
  const anoEncontrado = titulo.match(/\b(20\d{2})\b/);
  const hoje = new Date();
  const primeiro = numeroMes >= 0 && anoEncontrado
    ? new Date(Number(anoEncontrado[1]), numeroMes, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth() + (Number(mes?.numero || 1) - 1), 1);
  const indiceDia = DIAS.findIndex((nome) => normalizar(dia?.day).startsWith(nome));
  const diaSemana = indiceDia < 0 ? 1 : indiceDia;
  const distancia = (diaSemana - primeiro.getDay() + 7) % 7;
  const diaDoMes = 1 + distancia + 7 * Math.max(0, Number(semana?.number || 1) - 1);
  const data = new Date(primeiro.getFullYear(), primeiro.getMonth(), diaDoMes);
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function sessaoJaAgendada(atividades, origem) {
  return Array.isArray(atividades) && atividades.some((atividade) => atividade.origem === origem);
}
