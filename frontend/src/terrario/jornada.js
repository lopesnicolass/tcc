// Mapa visual das três salas do formigueiro.
// Sala 2: 5 sessões válidas. Sala 3: 10 sessões válidas.
export const SALAS_TENNA = Object.freeze([
  {
    numero: 1, nome: 'Ninho Inicial', subtitulo: 'Onde tudo começa',
    descricao: 'O primeiro refúgio de estudos da Tenna. Esta é a sala disponível para estudar e decorar agora.',
    simbolo: '🏡', tema: 'ninho'
  },
  {
    numero: 2, nome: 'Refúgio do Conhecimento', subtitulo: 'Seu cantinho de evolução',
    descricao: 'Uma sala dedicada aos estudos. Ela é conquistada após cinco sessões de foco válidas.',
    simbolo: '📚', tema: 'estudos'
  },
  {
    numero: 3, nome: 'Sala do Desafio Final', subtitulo: 'É hora de colocar o aprendizado em prática',
    descricao: 'O último ambiente do formigueiro lembra o dia do vestibulinho: hora de enfrentar a prova com tudo o que foi aprendido.',
    simbolo: '⭐', tema: 'reta-final'
  },
]);

export function construirJornada(estado) {
  const sessoesValidas = Math.max(0, Number(estado?.sessoesValidas) || 0);
  const desbloqueada = Math.min(3, Math.max(1, Number(estado?.salaDesbloqueada) || 1));
  const objetivoAtual = desbloqueada >= 3 ? 10 : desbloqueada >= 2 ? 10 : 5;
  const progressoAtual = Math.min(objetivoAtual, sessoesValidas);
  const faltamAtual = Math.max(0, objetivoAtual - progressoAtual);
  const faltamSala2 = Math.max(0, 5 - sessoesValidas);
  const faltamSala3 = Math.max(0, 10 - sessoesValidas);

  return {
    progresso: progressoAtual,
    objetivo: objetivoAtual,
    faltam: faltamAtual,
    faltamSala2,
    faltamSala3,
    percentual: Math.round((progressoAtual / objetivoAtual) * 100),
    segundaConquistada: desbloqueada >= 2,
    terceiraConquistada: desbloqueada >= 3,
    totalConquistadas: desbloqueada,
    salas: SALAS_TENNA.map((sala) => ({
      ...sala,
      conquistada: sala.numero <= desbloqueada,
      jogavel: sala.numero <= desbloqueada,
      estado: sala.numero === 1 ? 'atual'
        : sala.numero === 2 ? (desbloqueada >= 2 ? 'conquistada' : 'em-progresso')
        : desbloqueada >= 3 ? 'conquistada' : (desbloqueada >= 2 ? 'em-progresso' : 'futura'),
    })),
  };
}
