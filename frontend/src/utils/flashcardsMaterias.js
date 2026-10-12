// Mantém uma ordem estável das cinco matérias principais do Tenna.
export const MATERIAS_FLASHCARDS = Object.freeze([
  'Português', 'Matemática', 'História', 'Geografia', 'Ciências'
]);

export function organizarMaterias(cards = []) {
  const adicionais = new Set();
  for (const card of cards) {
    const materia = card.subject || 'Sem matéria';
    if (!MATERIAS_FLASHCARDS.includes(materia)) adicionais.add(materia);
  }
  return [...MATERIAS_FLASHCARDS, ...[...adicionais].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
