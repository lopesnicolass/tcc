// Datas civis publicadas pela administração. Não converta YYYY-MM-DD em UTC:
// isso poderia exibir o dia anterior no Brasil.
export function formatarDataImportante(data, opcoes = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data || ''))) return 'Data não informada';
  const [ano, mes, dia] = data.split('-').map(Number);
  const valor = new Date(ano, mes - 1, dia, 12);
  if (valor.getFullYear() !== ano || valor.getMonth() !== mes - 1 || valor.getDate() !== dia) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', opcoes).format(valor);
}

export function ehVestibulinho(evento) {
  const tipo = String(evento?.tipo || '').toLocaleLowerCase('pt-BR');
  const titulo = String(evento?.titulo || '');
  if (tipo === 'vestibulinho') return true;
  // Inscrições, resultados e gabaritos também mencionam o nome da prova,
  // mas não devem ser confundidos com a data do exame.
  return !/inscri|resultado|gabarito|recurso|prazo/i.test(titulo) &&
    tipo !== 'inscrições' && tipo !== 'resultado' && /vestibulinho/i.test(titulo);
}

// Prioriza eventos futuros sem ocultar os eventos passados já cadastrados.
export function ordenarDatasImportantes(datas = [], hoje = '') {
  const validas = (Array.isArray(datas) ? datas : []).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(String(item?.data || '')));
  return [...validas].sort((a, b) => {
    const grupoA = a.data >= hoje ? 0 : 1;
    const grupoB = b.data >= hoje ? 0 : 1;
    if (grupoA !== grupoB) return grupoA - grupoB;
    return grupoA === 0 ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data);
  });
}


export function linkOficialSeguro(link) {
  if (!link || typeof link !== 'string') return null;
  try {
    const url = new URL(link.trim());
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

// Sem confundir a abertura e o encerramento das inscrições com a data da prova.
// O administrador continua podendo cadastrar tipos adicionais no futuro.
export function tipoMarcoVestibulinho(evento) {
  if (ehVestibulinho(evento)) return 'prova';
  const texto = `${evento?.titulo || ''} ${evento?.tipo || ''}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/inscri/.test(texto)) {
    if (/\b(fim|termino|encerramento|encerra|encerram|ultimo dia|prazo final|fechamento)\b/.test(texto)) {
      return 'inscricoes-fim';
    }
    if (/\b(inicio|abertura|abertas|aberta|comeco|comecam|iniciam|iniciam-se)\b/.test(texto)) {
      return 'inscricoes-inicio';
    }
  }
  return 'outro';
}

export function rotuloMarcoVestibulinho(tipo) {
  if (tipo === 'prova') return 'Dia da prova';
  if (tipo === 'inscricoes-inicio') return 'Início das inscrições';
  if (tipo === 'inscricoes-fim') return 'Fim das inscrições';
  return 'Data importante';
}
