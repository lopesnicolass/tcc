import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarMateriaSimulado,
  filtrarPorMateria,
  integrarStatusComHistorico,
  calcularIndicadores
} from '../src/pages/aluno/simulados/dadosSimulados.js';

test('simulados gerais identificados por tipo, alias ou múltiplas matérias', () => {
  assert.equal(normalizarMateriaSimulado({ tipo: 'misto', materia: 'Matemática' }), 'Simulados Gerais');
  assert.equal(normalizarMateriaSimulado({ materia: 'Geral' }), 'Simulados Gerais');
  assert.equal(normalizarMateriaSimulado({ materias: ['Português', 'História'] }), 'Simulados Gerais');
});

test('filtro por matéria inclui mistos somente em Simulados Gerais', () => {
  const simulados = [
    { id: 1, tipo: 'misto', materia: 'Matemática' },
    { id: 2, materia: 'Matemática' },
    { id: 3, materia: 'Geral' },
    { id: 4, materia: 'Língua Portuguesa' }
  ];
  assert.deepEqual(filtrarPorMateria(simulados, 'Simulados Gerais').map((s) => s.id), [1, 3]);
  assert.deepEqual(filtrarPorMateria(simulados, 'Matemática').map((s) => s.id), [2]);
  assert.deepEqual(filtrarPorMateria(simulados, 'Português').map((s) => s.id), [4]);
});

test('histórico oficial restaura concluído, sem apagar prova em progresso', () => {
  const anterior = [
    { id: 1, status: 'nao-iniciado' },
    { id: 2, status: 'em-progresso' },
    { id: 3, status: 'nao-iniciado' }
  ];
  const depois = integrarStatusComHistorico(anterior, [{ simulado_id: 1 }, { simulado_id: 2 }]);
  assert.equal(depois[0].status, 'concluido');
  assert.equal(depois[1].status, 'em-progresso');
  assert.equal(depois[2], anterior[2]);
});

test('indicadores são derivados de tentativas reais sem fabricar pior matéria', () => {
  const resultados = [
    { materia: 'Matemática', totalQuestoes: 10, acertos: 6, porcentagem: 60 },
    { materia: 'Matemática', totalQuestoes: 10, acertos: 8, porcentagem: 80 }
  ];
  const um = calcularIndicadores(resultados);
  assert.equal(um.media, 70);
  assert.equal(um.materias.length, 1);
  assert.equal(um.foco, null);
  const dois = calcularIndicadores([
    ...resultados,
    { materia: 'História', total_questoes: 10, acertos: 3, porcentagem: 30 }
  ]);
  assert.equal(dois.foco.materia, 'História');
  assert.equal(dois.foco.percentual, 30);
  assert.equal(dois.tentativas, 3);
});

test('sem histórico, indicações de média e foco permanecem indisponíveis', () => {
  const resumo = calcularIndicadores(null);
  assert.equal(resumo.tentativas, 0);
  assert.equal(resumo.media, null);
  assert.equal(resumo.foco, null);
});
