import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// A rota especial só pode ser usada para atividades com origem do plano.
// O POST normal mantém a proibição de agendamento retroativo.
const require = createRequire(import.meta.url);
const Module = require('node:module');
const carregarOriginal = Module._load;
let insercoesEmLote = 0;
let insercoesManuais = 0;
let controller;
try {
  Module._load = function (name, parent, isMain) {
    if (name === '../models/planoPessoalModel') {
      return { buscar(_id, done) {
        done(null, { configuracao: JSON.stringify({ plan: [{ semanas: [{ inicio: '2020-10-01', fim: '2020-10-07', days: [{ items: [{ key: 'programado:4:9', topicoId: 123, topico: 'Interpretação de texto' }] }] }] }] }) });
      } };
    }
    if (name === '../models/cronogramaModel') {
      return {
        adicionarSessoesPlano(_usuarioId, atividades, done) {
          insercoesEmLote += 1;
          done(null, { adicionadas: atividades.length, ignoradas: 0 });
        },
        criarAtividade(_usuarioId, _atividade, done) {
          insercoesManuais += 1;
          done(null, { lastID: 1 });
        },
      };
    }
    return carregarOriginal.apply(this, arguments);
  };
  controller = require('../../backend/controllers/cronogramaController.js');
} finally {
  Module._load = carregarOriginal;
}

function resposta() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function pedido(dados) {
  return { params: { usuarioId: '7' }, usuario: { id: 7, tipo: 'aluno' }, body: dados };
}
const sessao = {
  nome: 'Interpretação de texto', materia: 'Português',
  data: '2020-10-05', horario: '19:00', origem: 'plano-automatico:programado:4:9', topicoId: 123,
};

test('adicionar plano aceita sessão antiga sem reagendar sua data', () => {
  const res = resposta();
  controller.agendarPlano(pedido({ atividades: [sessao] }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.adicionadas, 1);
  assert.equal(insercoesEmLote, 1);
});

test('adicionar uma atividade manual no passado continua bloqueado', () => {
  const res = resposta();
  controller.criar(pedido(sessao), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.mensagem, /já passaram/);
  assert.equal(insercoesManuais, 0);
});

test('rota do plano recusa atividades sem origem de sessão', () => {
  const res = resposta();
  controller.agendarPlano(pedido({ atividades: [{ ...sessao, origem: 'manual' }] }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(insercoesEmLote, 1);
});

test('rota do plano continua validando datas impossíveis', () => {
  const res = resposta();
  controller.agendarPlano(pedido({ atividades: [{ ...sessao, data: '2020-02-31' }] }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(insercoesEmLote, 1);
});


test('rejeita sessão antiga fora da semana prevista', () => {
  const res = resposta();
  controller.agendarPlano(pedido({ atividades: [{ ...sessao, data: '2020-10-08' }] }), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.mensagem, /data histórica inválida/);
  assert.equal(insercoesEmLote, 1);
});

test('rejeita origem verdadeira quando o conteúdo não corresponde ao plano salvo', () => {
  const res = resposta();
  controller.agendarPlano(pedido({ atividades: [{ ...sessao, topicoId: 999 }] }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(insercoesEmLote, 1);
});
