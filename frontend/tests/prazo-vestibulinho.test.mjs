import test from 'node:test';
import assert from 'node:assert/strict';
import { lerDataCivil, fimDoPlanoQuatroSemanas, avaliarPrazo, mesesAntesDaProva, dataFormatadaPtBr } from '../src/utils/prazoVestibulinho.js';

const hoje = new Date(2026, 9, 12, 12); // 12 outubro 2026 (segunda)

test('um bloco de 4 semanas termina no sábado da quarta semana', () => {
  assert.equal(fimDoPlanoQuatroSemanas(hoje, 1).toDateString(), new Date(2026, 10, 7).toDateString());
});
test('faltando 55 dias, dois meses de 4 semanas cabem antes do dia 06/12', () => {
  assert.equal(fimDoPlanoQuatroSemanas(hoje, 2).toDateString(), new Date(2026, 11, 5).toDateString());
  assert.equal(avaliarPrazo(2, '2026-12-06', hoje).ultrapassa, false);
  assert.equal(avaliarPrazo(3, '2026-12-06', hoje).ultrapassa, true);
  assert.equal(mesesAntesDaProva(12, '2026-12-06', hoje), 2);
});
test('plano muito perto do vestibulinho pode ter todos os meses como ultrapassados', () => {
  assert.equal(mesesAntesDaProva(12, '2026-10-15', hoje), 0);
  assert.equal(avaliarPrazo(1, '2026-10-15', hoje).ultrapassa, true);
});
test('sem data válida não aplica cinza ou bloqueio', () => {
  assert.deepEqual(avaliarPrazo(6, null, hoje), { ultrapassa: false, conhecido: false });
  assert.equal(mesesAntesDaProva(12, 'data inválida', hoje), null);
  assert.equal(lerDataCivil('2026-02-30'), null);
});
test('fim dos blocos funciona nas trocas de ano', () => {
  assert.equal(fimDoPlanoQuatroSemanas(new Date(2026, 11, 28), 1).toDateString(), new Date(2027, 0, 23).toDateString());
  assert.match(dataFormatadaPtBr('2026-12-06'), /dezembro/);
});
