import test from 'node:test';
import assert from 'node:assert/strict';
import { montarConquistas, calcularNivelPorXp } from '../src/utils/conquistas.js';

function conquistar(id, dados) { return montarConquistas(dados).find((c) => c.id === id); }

test('dados vazios geram medalhas bloqueadas, não conquistadas', () => {
  const conquistas = montarConquistas({ resultados: [], topicos: [], sessoes: [], gamificacao: { xp: 0, streak: 0 } });
  assert.equal(conquistas.length, 10);
  assert.ok(conquistas.every((c) => c.verificado && !c.desbloqueada));
});

test('erros de API não se parecem com zero atividades', () => {
  const conquista = conquistar('nota-maxima', { resultados: null });
  assert.equal(conquista.verificado, false);
  assert.equal(conquista.desbloqueada, false);
});

test('progresso de conteúdos soma apenas estudados e IDs distintos', () => {
  const dados = { topicos: [{ topico_id: 1, estudado: 1 }, { topico_id: 1, estudado: 1 }, { topico_id: 2, estudado: 0 }] };
  assert.equal(conquistar('primeiro-conteudo', dados).desbloqueada, true);
  assert.equal(conquistar('cinco-conteudos', dados).progresso, 1);
});

test('nota máxima exige 100% em uma prova com questões', () => {
  assert.equal(conquistar('nota-maxima', { resultados: [{ porcentagem: 100, total_questoes: 0 }] }).desbloqueada, false);
  assert.equal(conquistar('nota-maxima', { resultados: [{ porcentagem: 100, total_questoes: 10 }] }).desbloqueada, true);
});

test('rodadas apenas contam sessões finalizadas', () => {
  const dados = { sessoes: [{ data_fim: null }, { data_fim: '2026-10-12 10:00:00' }] };
  assert.equal(conquistar('primeira-rodada', dados).desbloqueada, true);
  assert.equal(conquistar('cinco-rodadas', dados).progresso, 1);
});

test('sequência e XP vêm do servidor e respeitam os objetivos', () => {
  const dados = { gamificacao: { streak: 3, xp: 650 } };
  assert.equal(conquistar('sequencia-tres', dados).desbloqueada, true);
  assert.equal(conquistar('xp-quinhentos', dados).desbloqueada, true);
});

test('nível de XP usa a mesma progressão do Tenna', () => {
  assert.deepEqual(calcularNivelPorXp(720, (n) => n * 100), { nivel: 4, xpNoNivel: 120, xpProximoNivel: 400 });
});
