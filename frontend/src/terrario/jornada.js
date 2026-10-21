// Metadados visuais da jornada. O servidor é a fonte do progresso real.
// Nesta versão, a segunda sala pode ser conquistada; seu cenário é uma prévia.
export const SALAS_TENNA = Object.freeze([
  { numero: 1, nome: 'Ninho Inicial', subtitulo: 'O começo de tudo', descricao: 'Seu primeiro refúgio de estudos. Aqui você encontra a Tenna, estuda e personaliza o ninho.', simbolo: '🏡', tema: 'ninho' },
  { numero: 2, nome: 'Cantinho de Estudos', subtitulo: 'Uma rotina nasce aqui', descricao: 'Uma conquista para quem completou cinco sessões reais de foco. O cenário desta sala está sendo preparado.', simbolo: '📖', tema: 'estudos' },
  { numero: 3, nome: 'Biblioteca da Revisão', subtitulo: 'Conhecimento que cresce', descricao: 'Um futuro capítulo dedicado a revisar os conteúdos mais importantes.', simbolo: '📚', tema: 'biblioteca' },
  { numero: 4, nome: 'Oficina dos Simulados', subtitulo: 'Prática a cada desafio', descricao: 'Um futuro espaço para celebrar a prática e o aprendizado com simulados.', simbolo: '🧩', tema: 'oficina' },
  { numero: 5, nome: 'Jardim da Persistência', subtitulo: 'Cada passo importa', descricao: 'Um futuro espaço para reconhecer a constância, sem cobrar sequências diárias perfeitas.', simbolo: '🌿', tema: 'jardim' },
  { numero: 6, nome: 'Mirante EtecCamp', subtitulo: 'A jornada continua', descricao: 'O marco simbólico da jornada de preparação. Não corresponde a uma aprovação real no Vestibulinho.', simbolo: '🏁', tema: 'mirante' },
]);

export function construirJornada(estado) {
  const sessoesValidas = Math.max(0, Number(estado?.sessoesValidas) || 0);
  // A verificação de desbloqueio real é feita no banco de dados.
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
      jogavel: sala.numero === 1,
      estado: sala.numero === 1 ? 'atual'
        : sala.numero === 2 ? (desbloqueada >= 2 ? 'conquistada' : 'em-progresso')
        : 'futura',
    })),
  };
}
