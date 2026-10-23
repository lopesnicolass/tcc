// Mapa visual das três salas. A Sala 2 preserva o desbloqueio já existente
// no servidor; os demais ambientes serão implementados em etapas posteriores.
export const SALAS_TENNA = Object.freeze([
  {
    numero: 1, nome: 'Ninho Inicial', subtitulo: 'Onde tudo começa',
    descricao: 'O primeiro refúgio de estudos da Tenna. Esta é a sala disponível para estudar e decorar agora.',
    simbolo: '🏡', tema: 'ninho'
  },
  {
    numero: 2, nome: 'Refúgio do Conhecimento', subtitulo: 'Seu cantinho de evolução',
    descricao: 'Uma sala que começa vazia e será decorada com móveis próprios. Ela é conquistada após cinco sessões de foco válidas.',
    simbolo: '📚', tema: 'estudos'
  },
  {
    numero: 3, nome: 'Sala da Reta Final', subtitulo: 'A um passo da ETECAMP',
    descricao: 'O último ambiente dentro do formigueiro. Seu teto permanece fechado: a abertura para a ETECAMP será uma conquista especial, implementada em uma etapa futura.',
    simbolo: '⭐', tema: 'reta-final'
  },
]);

export function construirJornada(estado) {
  const sessoesValidas = Math.max(0, Number(estado?.sessoesValidas) || 0);
  // A verificação do desbloqueio real continua no backend, sem simular a sala 3.
  const desbloqueada = Math.min(2, Math.max(1, Number(estado?.salaDesbloqueada) || 1));
  const objetivo = 5;
  const progresso = Math.min(objetivo, sessoesValidas);
  return {
    progresso, objetivo, faltam: Math.max(0, objetivo - progresso),
    percentual: Math.round(progresso / objetivo * 100),
    segundaConquistada: desbloqueada >= 2,
    totalConquistadas: desbloqueada,
    salas: SALAS_TENNA.map(sala => ({
      ...sala,
      conquistada: sala.numero <= desbloqueada,
      jogavel: sala.numero === 1 || (sala.numero === 2 && desbloqueada >= 2),
      estado: sala.numero === 1 ? 'atual'
        : sala.numero === 2 ? (desbloqueada >= 2 ? 'conquistada' : 'em-progresso')
        : 'futura',
    })),
  };
}
