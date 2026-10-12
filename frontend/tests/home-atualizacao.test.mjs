import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarDataAtividade,
  formatarData,
  obterStatusData,
  selecionarProximasAtividades
} from '../src/utils/homeAtividades.js';

test('aceita datas das atividades no formato do backend e da interface', () => {
  assert.equal(formatarData('2026-10-13'), '13/10/2026');
  assert.equal(formatarData('13/10/2026'), '13/10/2026');
  assert.equal(criarDataAtividade({ data: '2026-10-13', horario: '08:30' }).getHours(), 8);
  assert.equal(criarDataAtividade({ data: '13/10/2026', horario: '08:30' }).getMinutes(), 30);
});

test('filtra atividades concluídas, vencidas e sem data válida', () => {
  const agora = new Date(2026, 9, 11, 12, 0);
  const lista = [
    { id: 1, nome: 'Vencida', data: '2026-10-11', horario: '08:00' },
    { id: 2, nome: 'Concluída', data: '2026-10-12', horario: '08:00', done: true },
    { id: 3, nome: 'Válida', data: '2026-10-13', horario: '08:00' },
    { id: 4, nome: 'Sem data' }
  ];
  assert.deepEqual(selecionarProximasAtividades(lista, agora).map((a) => a.id), [3]);
});

test('ordena cronologicamente e mostra no máximo 4', () => {
  const agora = new Date(2026, 9, 11, 8, 0);
  const datas = ['2026-10-19', '2026-10-15', '2026-10-12', '2026-10-17', '2026-10-14'];
  const atividades = datas.map((data, id) => ({ id, nome: `Tarefa ${id}`, data, horario: '15:00' }));
  assert.deepEqual(selecionarProximasAtividades(atividades, agora).map((a) => a.data),
    ['2026-10-12', '2026-10-14', '2026-10-15', '2026-10-17']);
});

test('identifica datas próximas sem trocar o dia por UTC', () => {
  const agora = new Date();
  const data = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
  assert.equal(obterStatusData({ data, horario: '18:00' }), 'Hoje');
});

test('tolera ausência de lista e limite zero', () => {
  assert.deepEqual(selecionarProximasAtividades(null), []);
  assert.deepEqual(selecionarProximasAtividades([{ data: '2099-01-01', horario: '10:00' }], new Date(), 0), []);
});

test('não converte datas e horários inválidos em outros compromissos', () => {
  assert.equal(criarDataAtividade({ data: '2026-02-30', horario: '10:00' }), null);
  assert.equal(criarDataAtividade({ data: '2026-10-11', horario: '25:00' }), null);
});
