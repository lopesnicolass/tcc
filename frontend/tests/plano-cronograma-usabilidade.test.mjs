import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarPlanoProgramado } from '../src/utils/planoProgramado.js';
import { prepararAgendamentoCompleto, recuperarConfiguracaoAgenda, resumoSemanaPlano, moverSessaoNaSemana } from '../src/utils/planoCalendario.js';

const modelo = { id: 55, meses: 1, frequencia_dias: 2, sessoes: [
  {id:1,mes:1,semana:1,dia_estudo:1,sessao:1,materia:'Português',topico:'Classes gramaticais',topico_id:101},
  {id:2,mes:1,semana:1,dia_estudo:1,sessao:2,materia:'Português',topico:'Sintaxe',topico_id:102},
  {id:3,mes:1,semana:1,dia_estudo:2,sessao:3,materia:'História',topico:'Brasil Colonial',topico_id:103},
]};
const plano = gerarPlanoProgramado(modelo,{inicio:'2026-10-28',diasSemana:[2,4]});
const atividades = prepararAgendamentoCompleto(plano,{
  diasSemana:[1,3],horarioInicial:'14:00',agora:new Date(2026,9,28,17),
}).atividades;

test('recupera dias e hora da agenda sem misturar atividades alheias',()=>{
  const opcoes = recuperarConfiguracaoAgenda(plano,[...atividades,{origem:'outro',data:'2026-10-04',horario:'01:00'}],2);
  assert.deepEqual(opcoes.diasSemana,[1,3]);
  assert.equal(opcoes.horario,'14:00');
});

test('mostra progresso e agendamento como dimensões distintas',()=>{
  const mes = plano[0], semana=mes.semanas[0];
  const semAgenda = resumoSemanaPlano(mes,semana,[],{'101':true});
  assert.equal(semAgenda.progresso,'Em andamento');
  assert.equal(semAgenda.agendamento,'Sem agendamento');
  const comAgenda = resumoSemanaPlano(mes,semana,atividades,{'101':true});
  assert.equal(comAgenda.agendamento,'Agendada');
  const vazio = resumoSemanaPlano(mes,mes.semanas[1]);
  assert.equal(vazio.progresso,'Sem atividades');
});

test('reorganiza sessões dentro da semana preservando identidade do ADM',()=>{
  const original = plano[0].semanas[0].days;
  const novo = moverSessaoNaSemana(plano,1,1,0,0,1);
  const mudados = novo[0].semanas[0].days;
  assert.equal(original[0].items.length,2);
  assert.equal(mudados[0].items.length,1);
  assert.equal(mudados[1].items.length,2);
  assert.equal(mudados[1].items[1].key,original[0].items[0].key);
  assert.equal(moverSessaoNaSemana(novo,1,1,0,0,0),novo);
});

test('não muda a regra do primeiro dia do mês e permite sessões passadas',()=>{
  assert.equal(plano[0].inicio,'2026-10-01');
  assert.equal(atividades[0].data,'2026-10-05');
  assert.equal(atividades.length,3);
});
