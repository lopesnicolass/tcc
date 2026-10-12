// Utilitários puros da revisão: não dependem do estado do React ou do backend.
export function alternarCardsVirados(virados, exibidos) {
  const proximo = new Set(virados);
  const todosVirados = exibidos.length > 0 && exibidos.every((card) => proximo.has(card.id));

  exibidos.forEach((card) => {
    if (todosVirados) {
      proximo.delete(card.id);
    } else {
      proximo.add(card.id);
    }
  });

  return proximo;
}

export function obterTemasParaRevisar(respostas, cardsDaSessao) {
  const porId = new Map(cardsDaSessao.map((card) => [card.id, card]));

  return Array.from(new Set(
    respostas
      .filter((resposta) => !resposta.acertou)
      .map((resposta) => {
        const card = porId.get(resposta.flashcardId);
        return card
          ? `${card.subject} · ${card.content || 'Revisão geral'}`
          : resposta.materia;
      })
      .filter(Boolean)
  ));
}
