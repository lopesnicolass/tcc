/** Calcula apenas o mostrador; a conclusão da sessão depende do servidor. */
export function remainingFromServer(state, receivedAtMs, nowMs) {
  const sessao = state?.sessao;
  const seconds = Math.max(0, Number(sessao?.restanteSegundos) || 0);
  if (sessao?.estado !== 'em_andamento') return seconds;
  const elapsedMs = Math.max(0, (Number(nowMs) || 0) - (Number(receivedAtMs) || 0));
  return Math.max(0, Math.ceil(seconds - elapsedMs / 1000));
}
