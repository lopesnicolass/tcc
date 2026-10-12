import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairListaAdministrativa, resumirFontesAdministrativas, contarSeDisponivel } from '../src/utils/adminOverview.js';

test('extrai listas de payload objeto ou array', () => {
  assert.deepEqual(extrairListaAdministrativa({ usuarios: [{ id: 1 }] }, 'usuarios'), [{ id: 1 }]);
  assert.deepEqual(extrairListaAdministrativa([{ id: 2 }], 'usuarios'), [{ id: 2 }]);
});
test('payload inválido não produz um falso zero', () => {
  assert.equal(extrairListaAdministrativa({}, 'usuarios'), null);
  const resultado = resumirFontesAdministrativas([
    { chave: 'usuarios', ok: false, payload: {} },
    { chave: 'simulados', ok: true, payload: { simulados: [] } },
    { chave: 'questoes', ok: true, payload: { questoes: [{ id: 1 }] } },
    { chave: 'provas', ok: true, payload: {} },
  ]);
  assert.deepEqual(resultado.status, { usuarios: false, simulados: true, questoes: true, provas: false });
  assert.equal(contarSeDisponivel(resultado.dados.usuarios, resultado.status.usuarios), null);
  assert.equal(contarSeDisponivel(resultado.dados.simulados, resultado.status.simulados), 0);
  assert.equal(contarSeDisponivel(resultado.dados.questoes, resultado.status.questoes), 1);
  assert.equal(contarSeDisponivel(resultado.dados.provas, resultado.status.provas), null);
});
