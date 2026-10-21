/**
 * Mensagens específicas para a integração do Terrário com o backend.
 * Não transforma uma falha de API em dados falsos/saldo local.
 */
export function mensagemErroTerrario(erro) {
  const status = Number(erro?.status) || 0;
  const mensagem = String(erro?.message || '').trim();

  if (erro?.code === 'TERRARIO_RESPOSTA_INVALIDA') {
    return 'A API respondeu sem os dados esperados do Terrário. Confira se o backend atualizado está sendo executado.';
  }
  if (status === 404) {
    return 'A rota do Terrário não existe no servidor em execução (erro 404). Pare o backend com Ctrl+C e inicie novamente com node server.js dentro da pasta backend.';
  }
  if (status === 401 || status === 403) {
    return 'Sua sessão de login não está válida. Entre novamente no Tenna para acessar o Terrário.';
  }
  if (status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde um instante antes de tentar novamente.';
  }
  if (status >= 500) {
    return 'O backend apresentou um erro ao acessar o Terrário. Confira o terminal do servidor e reinicie o backend atualizado, se necessário.';
  }
  if (!status && (/failed to fetch|networkerror|fetch failed|load failed/i.test(mensagem) || erro instanceof TypeError)) {
    return 'Não foi possível conectar ao backend do Tenna. Verifique se ele está ligado na porta configurada (normalmente 3000) e se o frontend aponta para a API correta.';
  }
  if (!mensagem || mensagem === 'Não foi possível completar a operação.') {
    return 'Não foi possível concluir a solicitação ao Terrário. Confirme que o backend atualizado está rodando e tente novamente.';
  }
  return mensagem;
}

export function validarEstadoTerrario(data) {
  if (!data || typeof data !== 'object' ||
      !Number.isFinite(data.sementes) ||
      !Number.isFinite(data.sessoesValidas) ||
      !Object.prototype.hasOwnProperty.call(data, 'sessao')) {
    const erro = new Error('Resposta inválida do servidor do Terrário.');
    erro.code = 'TERRARIO_RESPOSTA_INVALIDA';
    throw erro;
  }
  return data;
}
