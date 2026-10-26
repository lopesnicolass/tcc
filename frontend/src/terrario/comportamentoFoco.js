// Anima a Tenna exclusivamente enquanto a sessão de foco está rodando.
// Apenas visualizar uma sala (ou desbloquear o mapa de testes) não é foco.
export function deveAnimarTenna(estadoSessao, decorando, segundosRestantes) {
  return estadoSessao === 'running' && !decorando &&
    Number.isFinite(segundosRestantes) && segundosRestantes > 0;
}
