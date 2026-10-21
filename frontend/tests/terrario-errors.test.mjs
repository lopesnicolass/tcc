import test from 'node:test';
import assert from 'node:assert/strict';
import { mensagemErroTerrario, validarEstadoTerrario } from '../src/terrario/terrarioErrors.js';

test('Erro HTTP 404 instrui reiniciar o backend da Etapa 1', () => {
  const mensagem = mensagemErroTerrario(Object.assign(new Error('Não foi possível completar a operação.'), { status: 404 }));
  assert.match(mensagem, /404/);
  assert.match(mensagem, /node server\.js/);
});

test('Erros de autenticação e de conexão têm orientações distintas', () => {
  assert.match(mensagemErroTerrario({ status: 401, message: 'Falha' }), /login/);
  assert.match(mensagemErroTerrario(new TypeError('Failed to fetch')), /conectar ao backend/);
});

test('Mensagem específica do servidor é preservada em validações de entrada', () => {
  assert.equal(mensagemErroTerrario({ status: 400, message: 'Selecione uma matéria válida.' }), 'Selecione uma matéria válida.');
});

test('Rejeita resposta de sucesso sem estrutura do Terrário para não mostrar saldo fictício', () => {
  assert.throws(() => validarEstadoTerrario({}), { code: 'TERRARIO_RESPOSTA_INVALIDA' });
  assert.deepEqual(validarEstadoTerrario({ sementes: 0, sessoesValidas: 0, sessao: null }),
    { sementes: 0, sessoesValidas: 0, sessao: null });
});
