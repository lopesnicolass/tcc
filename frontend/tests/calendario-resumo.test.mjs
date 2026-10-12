import test from 'node:test';
import assert from 'node:assert/strict';
import { eventosVisiveisDia, resumirDia, resumirMes } from '../src/utils/calendarioResumo.js';

test('resumo mensal conta atividades, conclusões e dias distintos (não soma horários como duração)', () => {
  const atividades = [
    { data: '2026-10-11', horario: '08:00', done: false },
    { data: '2026-10-11', horario: '20:00', done: true },
    { data: '2026-10-13', horario: '09:30', done: true },
    { data: '2026-11-01', horario: '09:00', done: true },
  ];
  assert.deepEqual(resumirMes(atividades, '2026-10'), {
    atividades: 3, concluidas: 2, diasPlanejados: 2,
  });
});

test('resumo do dia aceita dias vazios e atividades concluídas', () => {
  assert.deepEqual(resumirDia([]), { total: 0, concluidas: 0 });
  assert.deepEqual(resumirDia([{ done: 1 }, { done: false }]), { total: 2, concluidas: 1 });
});

test('contagem + mais inclui também datas importantes', () => {
  const atividades = [
    { id: 1, horario: '14:00', nome: 'Biologia' },
    { id: 2, horario: '08:00', nome: 'Matemática' },
    { id: 3, horario: '17:00', nome: 'Português' },
  ];
  const importante = [{ id: 4, titulo: 'Vestibulinho' }];
  const resultado = eventosVisiveisDia(atividades, importante, 2);
  assert.equal(resultado.total, 4);
  assert.equal(resultado.restantes, 2);
  assert.deepEqual(resultado.visiveis.map((e) => e.item.id), [4, 2]);
});

test('dias com apenas uma atividade não exibem eventos extras', () => {
  const resultado = eventosVisiveisDia([{ nome: 'Estudar' }], [], 2);
  assert.equal(resultado.total, 1);
  assert.equal(resultado.restantes, 0);
});
