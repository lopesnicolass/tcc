// Compatibilidade: servidores antigos conhecem /lote, mas ainda não /plano.
// Preferimos /plano porque impede duplicações atomicamente no banco.
const statusRotaAusente = (erro) => erro?.status === 404 || erro?.status === 405;

export async function enviarPlanoCalendario({ usuarioId, atividades, requisitar, consultarAtividades }) {
  if (!Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0 || !Array.isArray(atividades) || !atividades.length) {
    throw new Error('Não há atividades válidas para enviar ao Calendário.');
  }

  const corpo = { method: 'POST', body: JSON.stringify({ atividades }) };
  try {
    return await requisitar(`/cronograma/${usuarioId}/plano`, corpo, 'Não foi possível adicionar o plano ao Calendário.');
  } catch (erro) {
    // Falhas de validação, autenticação e banco NÃO devem disparar outra tentativa.
    // Só usamos a rota legada quando a rota moderna realmente não existe.
    if (!statusRotaAusente(erro)) throw erro;
  }

  // A rota antiga não checa origens repetidas: atualizamos a lista antes de enviá-las.
  const existentes = await consultarAtividades();
  const origensExistentes = new Set((Array.isArray(existentes) ? existentes : []).map((a) => a.origem).filter(Boolean));
  const pendentes = atividades.filter((atividade) => !origensExistentes.has(atividade.origem));
  const ignoradas = atividades.length - pendentes.length;
  if (!pendentes.length) return { adicionadas: 0, ignoradas };

  try {
    // O endpoint existente /lote salva tudo em uma transação.
    await requisitar(`/cronograma/${usuarioId}/lote`, {
      method: 'POST', body: JSON.stringify({ atividades: pendentes }),
    }, 'Não foi possível salvar as atividades no Calendário.');
  } catch (erro) {
    if (statusRotaAusente(erro)) {
      throw new Error('O servidor do Calendário precisa ser atualizado para permitir agendar o plano inteiro.');
    }
    throw erro;
  }
  return { adicionadas: pendentes.length, ignoradas };
}
