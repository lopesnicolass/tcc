import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gerarPlanoProgramado, reagendarDatasPlano, diasPadrao, validarDiasSemana,
  avaliarPrazoPlanoReal, dataCivil, formatarPeriodo,
} from '../src/utils/planoProgramado.js';
import { sugerirDataSessao, sugerirAgendamentoFuturo, agendamentoNoFuturo, chaveSessaoPlano, dataPermitidaSessaoPlano } from '../src/utils/planoCalendario.js';

const modelo = {
  id: 12, meses: 2, frequencia_dias: 3,
  sessoes: Array.from({length: 2}, (_,mes) => Array.from({length:4}, (_,semana) =>
    [1,2,3].map(slot => ({id: mes*12+semana*3+slot, mes:mes+1, semana:semana+1, dia_estudo:slot,
      sessao:1,materia:'Português',topico:`Tópico ${slot}`,topico_id:slot+1,materia_id:1})))).flat(2),
};

test('permite somente dias válidos em quantidade compatível', () => {
  assert.deepEqual(diasPadrao(3), [1,3,5]);
  assert.ok(validarDiasSemana([0,2,6],3));
  assert.ok(!validarDiasSemana([1,1,2],3));
  assert.ok(!validarDiasSemana([1,2],3));
});

test('gera meses civis completos, mesmo quando o plano é criado no fim do mês', () => {
  const plano = gerarPlanoProgramado(modelo,{diasSemana:[0,2,6],inicio:'2026-10-27'});
  assert.equal(plano.length,2);
  assert.equal(plano[0].nome,'outubro de 2026');
  assert.equal(plano[0].inicio,'2026-10-01');
  assert.equal(plano[0].fim,'2026-10-31');
  assert.equal(plano[1].nome,'novembro de 2026');
  assert.equal(plano[1].inicio,'2026-11-01');
  assert.equal(plano[1].fim,'2026-11-30');
  for (const mes of plano) for (const semana of mes.semanas) {
    const datas = semana.days.map(d=>d.data);
    assert.equal(new Set(datas).size,3);
    assert.deepEqual(datas,[...datas].sort());
    assert.ok(datas.every(data=>data>=semana.inicio && data<=semana.fim));
    assert.equal(semana.days[0].items[0].topico,'Tópico 1');
  }
  assert.deepEqual(plano[0].semanas[0].days.map(d=>d.data),
    ['2026-10-03','2026-10-04','2026-10-06']);
  assert.equal(plano[0].semanas[3].fim,'2026-10-31');
});

test('ao gerar em dezembro, o segundo mês é janeiro do ano seguinte', () => {
  const plano = gerarPlanoProgramado(modelo,{diasSemana:[1,3,5],inicio:'2026-12-30'});
  assert.equal(plano[0].inicio,'2026-12-01');
  assert.equal(plano[0].fim,'2026-12-31');
  assert.equal(plano[1].inicio,'2027-01-01');
  assert.equal(plano[1].fim,'2027-01-31');
});

test('não perde conteúdo ou identificação ao reorganizar datas de um plano',()=>{
  const plano = gerarPlanoProgramado(modelo,{diasSemana:[1,3,5],inicio:'2026-01-08'});
  const antes = plano.flatMap(m=>m.semanas.flatMap(s=>s.days.flatMap(d=>d.items.map(i=>i.key))));
  const organizado = reagendarDatasPlano(plano,{diasSemana:[0,2,6],inicio:'2026-10-27'});
  const depois = organizado.flatMap(m=>m.semanas.flatMap(s=>s.days.flatMap(d=>d.items.map(i=>i.key))));
  assert.deepEqual(depois,antes);
  assert.equal(organizado[0].inicio,'2026-10-01');
  assert.equal(chaveSessaoPlano(plano[0].semanas[0].days[0].items[0],plano[0],plano[0].semanas[0],0,0),
    chaveSessaoPlano(organizado[0].semanas[0].days[0].items[0],organizado[0],organizado[0].semanas[0],0,0));
});

test('o prazo considera o último dia do último mês civil',()=>{
  assert.equal(avaliarPrazoPlanoReal(2,'2026-11-29','2026-10-27').ultrapassa,true);
  assert.equal(avaliarPrazoPlanoReal(2,'2026-11-30','2026-10-27').ultrapassa,false);
  assert.equal(avaliarPrazoPlanoReal(1,'2026-10-31','2026-10-27').termino,'2026-10-31');
});

test('agendamentos nunca são sugeridos no passado',()=>{
  const hoje=new Date(2026,9,27,20,5);
  assert.deepEqual(sugerirAgendamentoFuturo('2026-10-25',hoje),{data:'2026-10-27',horario:'20:30',hoje:'2026-10-27'});
  assert.equal(sugerirAgendamentoFuturo('2026-11-05',hoje).horario,'18:00');
  assert.equal(sugerirAgendamentoFuturo('2026-10-27',new Date(2026,9,27,23,58)).data,'2026-10-28');
  assert.equal(agendamentoNoFuturo('2026-10-27','20:30',hoje),true);
  assert.equal(agendamentoNoFuturo('2026-10-27','20:00',hoje),false);
  assert.equal(agendamentoNoFuturo('2026-02-30','18:00',hoje),false);
});

test('agendamento de sessão usa sua data exata e formato humano',()=>{
  const plano = gerarPlanoProgramado(modelo,{diasSemana:[0,2,6],inicio:'2026-10-27'});
  const dia = plano[0].semanas[0].days[1];
  assert.equal(sugerirDataSessao(plano[0],plano[0].semanas[0],dia),'2026-10-04');
  assert.ok(formatarPeriodo('2026-10-27','2026-11-23').includes('nov'));
  assert.equal(dataCivil(new Date(2026,9,27)),'2026-10-27');
});

test('uma sessão do Cronograma admite seu dia histórico, mas não outra data passada', () => {
  const hoje = new Date(2026, 9, 27, 20, 0);
  assert.equal(dataPermitidaSessaoPlano('2026-10-05', '19:00', '2026-10-05', hoje), true);
  assert.equal(dataPermitidaSessaoPlano('2026-10-04', '19:00', '2026-10-05', hoje), false);
  assert.equal(dataPermitidaSessaoPlano('2026-10-28', '19:00', '2026-10-05', hoje), true);
  assert.equal(dataPermitidaSessaoPlano('2026-02-30', '19:00', '2026-02-30', hoje), false);
  assert.equal(dataPermitidaSessaoPlano('2026-10-05', '25:00', '2026-10-05', hoje), false);
  assert.equal(agendamentoNoFuturo('2026-10-05','19:00',hoje), false);
});
