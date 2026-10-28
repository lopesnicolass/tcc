import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarPlanoProgramado } from '../src/utils/planoProgramado.js';
import { prepararAgendamentoCompleto } from '../src/utils/planoCalendario.js';

const modelo = {
  id: 13, meses: 1, frequencia_dias: 2,
  sessoes: [
    {id: 8, mes: 1, semana: 1, dia_estudo: 1, sessao: 1, materia: 'Matemática', materia_id: 1, topico: 'Equações', topico_id: 80},
    {id: 9, mes: 1, semana: 1, dia_estudo: 1, sessao: 2, materia: 'Português', materia_id: 2, topico: 'Interpretação', topico_id: 81},
    {id: 10, mes: 1, semana: 1, dia_estudo: 2, sessao: 3, materia: 'História', materia_id: 3, topico: 'Brasil Colonial', topico_id: 82},
  ],
};
const plano = gerarPlanoProgramado(modelo, { inicio: '2026-10-15', diasSemana: [2, 4] });
const agora = new Date(2026, 9, 27, 10, 0);

test('modelo ADM aceita dois conteúdos no mesmo dia de estudo', () => {
  assert.equal(plano[0].semanas[0].days[0].items.length, 2);
  assert.equal(plano[0].semanas[0].days[1].items.length, 1);
});

test('exige seleção da quantidade correta de dias antes de agendar', () => {
  assert.match(prepararAgendamentoCompleto(plano, { diasSemana: [], horarioInicial: '19:00', agora }).erro, /2 dias/);
});

test('mantém conteúdos do ADM, distribui dias e separa horários múltiplos', () => {
  const r = prepararAgendamentoCompleto(plano, { diasSemana: [1, 3], horarioInicial: '19:00', agora });
  assert.equal(r.atividades.length, 3);
  assert.equal(r.inicio, '2026-10-05');
  assert.equal(r.inicioPlano, '2026-10-01');
  assert.equal(r.plano[0].fim, '2026-10-31');
  assert.equal(r.atividades[0].data, r.atividades[1].data);
  assert.deepEqual([r.atividades[0].horario, r.atividades[1].horario], ['19:00', '20:00']);
  assert.deepEqual(r.atividades.map((a) => a.data), ['2026-10-05', '2026-10-05', '2026-10-07']);
  assert.equal(r.anteriores, 3);
  assert.equal(r.plano[0].semanas[0].days[0].day, 'Segunda');
});

test('não duplica uma sessão existente e preserva horários ocupados', () => {
  const primeira = prepararAgendamentoCompleto(plano, { diasSemana: [1, 3], horarioInicial: '19:00', agora });
  const r = prepararAgendamentoCompleto(plano, {
    diasSemana: [1, 3], horarioInicial: '19:00', agora,
    atividadesExistentes: [primeira.atividades[0], { data: primeira.atividades[1].data, horario: '19:00' }],
  });
  assert.equal(r.atividades.length, 2);
  assert.equal(r.jaAgendadas, 1);
  assert.equal(r.atividades[0].horario, '20:00');
});

test('ignora conteúdo estudado sem mudar as datas antigas dos outros', () => {
  const r = prepararAgendamentoCompleto(plano, {
    diasSemana: [2, 4], horarioInicial: '08:00', agora,
    topicosEstudados: { '80': true },
  });
  assert.equal(r.inicio, '2026-10-01');
  assert.equal(r.concluidas, 1);
  assert.equal(r.atividades.length, 2);
});

test('impede criar horários após a meia-noite', () => {
  const r = prepararAgendamentoCompleto(plano, { diasSemana: [1,3], horarioInicial: '23:30', agora });
  assert.match(r.erro, /horários suficientes/);
});

test('agendar no fim de outubro não transforma o plano de dois meses em blocos de 28 dias', () => {
  const doisMeses = gerarPlanoProgramado({ ...modelo, meses: 2 }, { inicio: '2026-10-27', diasSemana: [2,4] });
  const r = prepararAgendamentoCompleto(doisMeses, { diasSemana: [2,4], horarioInicial: '19:00', agora });
  assert.equal(r.erro, undefined);
  assert.equal(r.plano[0].inicio, '2026-10-01');
  assert.equal(r.plano[1].inicio, '2026-11-01');
  assert.equal(r.plano[1].fim, '2026-11-30');
  assert.deepEqual(r.atividades.map(a => a.data), ['2026-10-01','2026-10-01','2026-10-06']);
});


test('mantém as datas de semanas antigas e de semanas seguintes, sem empurrar sessões', () => {
  const modeloLongo = { ...modelo, meses: 2, sessoes: [
    ...modelo.sessoes,
    {id: 11, mes: 2, semana: 1, dia_estudo: 1, sessao: 4, materia: 'Ciências', topico: 'Energia', topico_id: 83},
  ] };
  const r = prepararAgendamentoCompleto(gerarPlanoProgramado(modeloLongo, { inicio: '2026-10-27', diasSemana: [2, 4] }),
    { diasSemana: [2,4], horarioInicial: '14:00', agora });
  assert.deepEqual(r.atividades.map(a => a.data), ['2026-10-01','2026-10-01','2026-10-06','2026-11-03']);
  assert.equal(r.anteriores, 3);
  assert.equal(r.atividades[3].horario, '14:00');
});
