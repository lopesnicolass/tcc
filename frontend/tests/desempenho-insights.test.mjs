import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarMateriaDesempenho,
  analisarResultadosPorMateria,
  analisarResultadosPorAssunto,
  resumirEvolucao,
  sugerirRevisoes
} from '../src/utils/desempenhoInsights.js';

const r = (materia, acertos, total_questoes, extras = {}) => ({ materia, acertos, total_questoes, ...extras });

test('normaliza matérias com e sem acentos e desconsidera simulados gerais', () => {
  assert.equal(normalizarMateriaDesempenho('Portugues'), 'Português');
  assert.equal(normalizarMateriaDesempenho('Língua Portuguesa'), 'Português');
  assert.equal(normalizarMateriaDesempenho('Ciencias'), 'Ciências');
  assert.equal(normalizarMateriaDesempenho('Geral/Misto'), null);
  assert.equal(normalizarMateriaDesempenho(''), null);
});

test('calcula aproveitamento ponderado por questões, não a média simples das tentativas', () => {
  const materias = analisarResultadosPorMateria([
    r('Matemática', 8, 10),
    r('Matematica', 0, 30),
    r('Português', 18, 20)
  ]);
  assert.deepEqual(materias.map(({ nome, percentual }) => [nome, percentual]), [
    ['Matemática', 20], ['Português', 90]
  ]);
  assert.equal(materias[0].tentativas, 2);
  assert.equal(materias[0].questoes, 40);
});

test('não calcula matéria para resultados gerais nem com totais impossíveis', () => {
  const materias = analisarResultadosPorMateria([
    r('Simulados Gerais', 4, 5),
    r('História', 12, 10),
    r('Geografia', 5, 0),
    r('Ciências', 3, 10)
  ]);
  assert.deepEqual(materias.map(item => item.nome), ['Ciências']);
});

test('agrupa assuntos por tópico do banco e não inventa conteúdo ausente', () => {
  const assuntos = analisarResultadosPorAssunto([
    r('Geografia', 4, 10, { assunto: 'Biomas', topico_id: 19 }),
    r('Geografia', 6, 10, { assunto: 'Biomas', topico_id: 19 }),
    r('Matemática', 2, 10, { assunto: null, topico_id: null }),
    r('Simulados Gerais', 1, 10, { assunto: 'Nome misto', topico_id: 18 })
  ]);
  assert.equal(assuntos.length, 1);
  assert.equal(assuntos[0].nome, 'Biomas');
  assert.equal(assuntos[0].percentual, 50);
  assert.equal(assuntos[0].topicoId, 19);
});

test('sugere assunto com link de tópico e outra matéria uma única vez', () => {
  const sugestoes = sugerirRevisoes([
    r('Geografia', 2, 10, { assunto: 'Biomas', topico_id: 19 }),
    r('Geografia', 5, 10, { assunto: 'Clima', topico_id: 20 }),
    r('Matemática', 7, 10)
  ]);
  assert.equal(sugestoes[0].tipo, 'assunto');
  assert.equal(sugestoes[0].topicoId, 19);
  assert.equal(sugestoes.filter(s => (s.materia || s.nome) === 'Geografia').length, 1);
  assert.equal(sugestoes.find(s => s.nome === 'Matemática').tipo, 'materia');
});

test('retorna indicadores vazios sem registros e não inventa evolução', () => {
  assert.deepEqual(analisarResultadosPorMateria([]), []);
  assert.deepEqual(sugerirRevisoes([]), []);
  assert.equal(resumirEvolucao([]), null);
  assert.equal(resumirEvolucao([{ porcentagem: 30 }]), null);
});

test('compara grupos separados de tentativas para evitar sobreposição', () => {
  const evolucao = resumirEvolucao([20,30,40,55,65,75].map(porcentagem => ({ porcentagem })));
  assert.deepEqual(evolucao, {
    diferenca: 35,
    recentes: 3,
    anteriores: 3,
    mediaRecente: 65,
    mediaAnterior: 30
  });
});

test('funciona com apenas duas tentativas e diferença negativa', () => {
  const e = resumirEvolucao([{ porcentagem: 80 }, { porcentagem: 60 }]);
  assert.equal(e.diferenca, -20);
  assert.equal(e.anteriores, 1);
  assert.equal(e.recentes, 1);
});
