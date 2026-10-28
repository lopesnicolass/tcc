const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let salvo = null;
let usuarioGravado = null;
let controller;
try {
  Module._load = function (name, parent, isMain) {
    if (name === '../models/planoPessoalModel') return {
      salvar(usuario, plano, timestamp, callback) {
        usuarioGravado = usuario;
        salvo = { configuracao: JSON.stringify(plano), salvo_em: timestamp };
        callback(null, salvo);
      },
      buscar(_usuario, callback) { callback(null, salvo); }
    };
    return original.apply(this, arguments);
  };
  controller = require('../controllers/planoPessoalController');
} finally {
  Module._load = original;
}
const resposta = () => ({ statusCode: 200, body: null,
  status(valor) { this.statusCode = valor; return this; },
  json(valor) { this.body = valor; return this; }
});
const plano = {
  modeloId: 4, months: 1, days: 1, inicio: '2026-10-01', diasSemana: [2],
  plan: [{ semanas: Array.from({ length: 4 }, (_, i) => ({
    number: i + 1,
    days: [{ items: i === 0 ? [{ key: 'programado:4:9', topicoId: 10 }, { key: 'programado:4:10', topicoId: 11 }] : [] }]
  })) }]
};

test('salva planos por identidade autenticada, com dois conteúdos no mesmo dia', () => {
  const res = resposta();
  controller.atualizarMeuPlano({ usuario: { id: 7 }, body: { plano, salvoEm: 123456 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(usuarioGravado, 7);
  assert.equal(res.body.salvoEm, 123456);
});

test('recupera o plano salvo sem mudar a ordem dos conteúdos', () => {
  const res = resposta();
  controller.meuPlano({ usuario: { id: 7 } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.plano.plan[0].semanas[0].days[0].items.map(s => s.topicoId), [10, 11]);
});

test('impede carga com dias divergentes da configuração', () => {
  const res = resposta();
  controller.atualizarMeuPlano({ usuario: { id: 7 }, body: { plano: { ...plano, days: 2 }, salvoEm: 123457 } }, res);
  assert.equal(res.statusCode, 400);
});

test('impede data fora do primeiro dia do mês', () => {
  const res = resposta();
  controller.atualizarMeuPlano({ usuario: { id: 7 }, body: { plano: { ...plano, inicio: '2026-10-28' }, salvoEm: 123457 } }, res);
  assert.equal(res.statusCode, 400);
});
