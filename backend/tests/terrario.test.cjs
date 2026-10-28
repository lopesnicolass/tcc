const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function novoBanco({ schemaAntigo = false } = {}) {
  const banco = new DatabaseSync(':memory:');
  banco.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE usuarios (id INTEGER PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0,
       streak INTEGER NOT NULL DEFAULT 0, last_active_date TEXT);
    CREATE TABLE xp_eventos_verificados (
      id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL, action TEXT NOT NULL,
      referencia TEXT NOT NULL, data TEXT NOT NULL, quantidade INTEGER NOT NULL,
      UNIQUE(usuario_id, action, referencia));
    INSERT INTO usuarios(id) VALUES (1),(2);`);
  const origemXP = fs.readFileSync(path.join(__dirname, '../config/ensureXP.js'), 'utf8');
  const gatilhoXP = origemXP.match(/db\.run\(`(CREATE TRIGGER IF NOT EXISTS trg_xp_verificado_saldo[\s\S]*?)`\);/);
  assert.ok(gatilhoXP);
  banco.exec(gatilhoXP[1]);
  if (schemaAntigo) {
    banco.exec(`CREATE TABLE terrario_sessoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      materia TEXT NOT NULL,
      duracao_minutos INTEGER NOT NULL CHECK(duracao_minutos IN (1, 15, 25, 45)),
      restante_segundos INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'em_andamento'
        CHECK(estado IN ('em_andamento', 'pausada', 'concluida', 'cancelada')),
      iniciada_em_ms INTEGER NOT NULL,
      ativo_desde_ms INTEGER,
      concluida_em_ms INTEGER,
      sementes_recebidas INTEGER NOT NULL DEFAULT 0,
      xp_recebido INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
    INSERT INTO terrario_sessoes
      (id,usuario_id,materia,duracao_minutos,restante_segundos,estado,iniciada_em_ms,ativo_desde_ms,concluida_em_ms,sementes_recebidas,xp_recebido)
      VALUES(55,1,'Estudo livre',25,0,'concluida',1000,NULL,1600000,8,15);`);
  }
  // Captura as migrações reais, sem criar um arquivo SQLite real.
  const caminhoDB = require.resolve('../config/db');
  const simulador = {
    serialize(fn) { fn(); },
    run(sql, args, cb) {
      const parametros = Array.isArray(args) ? args : [];
      const callback = typeof args === 'function' ? args : cb;
      try {
        const res = banco.prepare(sql).run(...parametros);
        if (callback) callback.call({ changes: Number(res.changes), lastID: Number(res.lastInsertRowid) }, null);
      } catch (e) {
        if (callback) callback(e); else throw e;
      }
    },
    get(sql, args, cb) {
      try { cb(null, banco.prepare(sql).get(...args)); }
      catch (e) { cb(e); }
    },
    all(sql, args, cb) {
      try { cb(null, banco.prepare(sql).all(...args)); }
      catch (e) { cb(e); }
    }
  };
  require.cache[caminhoDB] = { exports: simulador, loaded: true };
  delete require.cache[require.resolve('../config/ensureTerrario')];
  require('../config/ensureTerrario');
  delete require.cache[require.resolve('../models/terrarioModel')];
  const model = require('../models/terrarioModel');
  return { banco, model };
}

test('Terrário: iniciar, pausar, continuar, concluir e impedir prêmio repetido', async () => {
  const { banco, model } = novoBanco();
  const t = Date.now();
  const started = await model.iniciar(1, 'Matemática', 15, t);
  assert.ok(started.lastID > 0);
  await assert.rejects(model.iniciar(1, 'Matemática', 25, t), /UNIQUE constraint failed/);
  const incomplete = await model.acao(1, started.lastID, 'concluir', t + 5000);
  assert.equal(incomplete.status, 409);
  assert.equal((await model.acao(1, started.lastID, 'pausar', t + 2000)).status, 200);
  let state = await model.buscarEstado(1, t + 400000);
  assert.equal(state.sessao.estado, 'pausada');
  const restart = await model.acao(1, started.lastID, 'continuar', t + 5000);
  assert.equal(restart.status, 200);
  const done = await model.acao(1, started.lastID, 'concluir', t + 1000000);
  assert.equal(done.status, 200);
  assert.equal((await model.acao(1, started.lastID, 'concluir', t + 1100000)).status, 200);
  state = await model.buscarEstado(1, t + 1100000);
  assert.equal(state.sementes, 2);
  assert.equal(state.sessoesValidas, 1);
  assert.equal(state.xpTotal, 10);
  assert.equal(banco.prepare("SELECT COUNT(*) n FROM xp_eventos_verificados WHERE action='foco_concluido'").get().n, 1);
  assert.equal((await model.acao(2, started.lastID, 'concluir', t + 1100000)).status, 404);
  banco.close();
});

test('Terrário: cancelamento não paga recompensas; demo não desbloqueia sala', async () => {
  const { banco, model } = novoBanco();
  const t = Date.now();
  const cancelled = await model.iniciar(1, 'Português', 25, t);
  assert.equal((await model.acao(1, cancelled.lastID, 'cancelar', t + 1000)).status, 200);
  let state = await model.buscarEstado(1, t + 10000000);
  assert.equal(state.sementes, 0);
  assert.equal(state.xpTotal, 0);
  assert.equal(state.sessoesValidas, 0);
  const demo = await model.iniciar(1, 'Ciências', 1, t + 10000000);
  state = await model.buscarEstado(1, t + 10070000); // passagem do tempo conclui ao carregar
  assert.equal(state.sessao.id, demo.lastID);
  assert.equal(state.sessao.estado, 'concluida');
  assert.equal(state.sementes, 0);
  assert.equal(state.sessoesValidas, 0);
  assert.equal(state.xpTotal, 0);
  banco.close();
});

test('Terrário: progresso de 5 sessões reais libera sala 2 permanentemente', async () => {
  const { banco, model } = novoBanco();
  const t = Date.now();
  for (let i = 0; i < 5; i++) {
    const inicio = t + i * 1000000;
    const s = await model.iniciar(1, 'História', 15, inicio);
    assert.equal((await model.acao(1, s.lastID, 'concluir', inicio + 900001)).status, 200);
  }
  const state = await model.buscarEstado(1, t + 10000000);
  assert.equal(state.salaDesbloqueada, 2);
  assert.equal(state.sessoesValidas, 5);
  assert.equal(state.xpTotal, 50);
  assert.equal(state.tempoTotalSegundos, 4500);
  banco.close();
});


test('Terrário: loja debita sementes uma vez, mantém inventário e isola contas', async () => {
  const { banco, model } = novoBanco();
  let state = await model.buscarEstado(1);
  assert.equal(state.inventario.find(item => item.id === 'vasinho')?.equipado, true);
  await assert.rejects(model.comprarItem(1, 'mesa'), /sementes suficientes/);
  banco.prepare('UPDATE terrario_usuario SET sementes=25 WHERE usuario_id=1').run();
  await model.comprarItem(1, 'mesa');
  state = await model.buscarEstado(1);
  assert.equal(state.sementes, 19);
  assert.equal(state.inventario.find(item => item.id === 'mesa')?.equipado, false);
  await assert.rejects(model.comprarItem(1, 'mesa'), /já possui/);
  assert.equal((await model.buscarEstado(1)).sementes, 19);
  await model.personalizarItem(1, 'mesa', { equipado: true, x: 65.5, y: 77 });
  state = await model.buscarEstado(1);
  assert.deepEqual(state.inventario.find(item => item.id === 'mesa'), {
    id: 'mesa', equipado: true, x: 65.5, y: 77, escala: 1
  });
  await model.personalizarItem(1, 'mesa', { equipado: false });
  assert.equal((await model.buscarEstado(1)).inventario.find(item => item.id === 'mesa').equipado, false);
  await assert.rejects(model.personalizarItem(1, 'mesa', { equipado: true, x: -1, y: 300 }), /Posição inválida/);
  await assert.rejects(model.personalizarItem(2, 'mesa', { equipado: true }), /Compre esse item/);
  await assert.rejects(model.comprarItem(1, 'inexistente'), /não está disponível/);
  assert.equal((await model.buscarEstado(2)).inventario.length, 1);
  banco.close();
});

test('Terrário: preços acessíveis atualizam catálogos antigos sem mexer nas compras', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sementes=14 WHERE usuario_id=1').run();
  banco.prepare("UPDATE terrario_catalogo SET preco=28 WHERE item_id='s3_mesa'").run();
  banco.prepare("UPDATE terrario_catalogo SET preco=10 WHERE item_id='mesa'").run();
  const saldoAntes = (await model.buscarEstado(1)).sementes;
  delete require.cache[require.resolve('../config/ensureTerrario')];
  require('../config/ensureTerrario');
  assert.equal(banco.prepare("SELECT preco FROM terrario_catalogo WHERE item_id='s3_mesa'").get().preco,10);
  assert.equal(banco.prepare("SELECT preco FROM terrario_catalogo WHERE item_id='mesa'").get().preco,6);
  assert.equal((await model.buscarEstado(1)).sementes,saldoAntes);
  await model.comprarItem(1,'mesa');
  assert.equal((await model.buscarEstado(1)).sementes,8);
  delete require.cache[require.resolve('../config/ensureTerrario')];
  require('../config/ensureTerrario');
  assert.equal((await model.buscarEstado(1)).sementes,8);
  assert.equal((await model.buscarEstado(1)).inventario.filter(i=>i.id==='mesa').length,1);
  banco.close();
});

test('Terrário: compras simultâneas não gastam além do saldo', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sementes=8 WHERE usuario_id=1').run();
  const results = await Promise.allSettled([
    model.comprarItem(1, 'mesa'),
    model.comprarItem(1, 'luminaria')
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok((await model.buscarEstado(1)).sementes >= 0);
  assert.equal(banco.prepare('SELECT COUNT(*) n FROM terrario_inventario WHERE usuario_id=1').get().n, 2);
  banco.close();
});


test('Terrário: novos móveis preservam compra e possuem limites de parede e chão', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sementes=80 WHERE usuario_id=1').run();
  await model.comprarItem(1, 'prateleira');
  await model.comprarItem(1, 'tapete');
  await model.personalizarItem(1, 'prateleira', { equipado: true, x: 27, y: 38 });
  await model.personalizarItem(1, 'tapete', { equipado: true, x: 42, y: 77 });
  await assert.rejects(model.personalizarItem(1, 'prateleira', { equipado: true, x: 27, y: 75 }), /Posição inválida/);
  await assert.rejects(model.personalizarItem(1, 'tapete', { equipado: true, x: 42, y: 30 }), /Posição inválida/);
  const estado = await model.buscarEstado(1);
  assert.equal(estado.sementes, 72);
  assert.equal(estado.inventario.find(item => item.id === 'prateleira').y, 38);
  assert.equal(estado.inventario.find(item => item.id === 'tapete').y, 77);
  assert.equal(estado.inventario.find(item => item.id === 'vasinho').equipado, true);
  banco.close();
});

test('Terrário: escala do móvel é persistida por aluno sem gastar sementes', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sementes=30 WHERE usuario_id=1').run();
  await model.comprarItem(1, 'mesa');
  await model.personalizarItem(1, 'mesa', { equipado: true, escala: 1.4 });
  const state = await model.buscarEstado(1);
  assert.equal(state.inventario.find(item => item.id === 'mesa').escala, 1.4);
  assert.equal(state.sementes, 24);
  await model.personalizarItem(1, 'mesa', { equipado: true, x: 50, y: 56 });
  assert.equal((await model.buscarEstado(1)).inventario.find(item => item.id === 'mesa').escala, 1.4);
  await assert.rejects(model.personalizarItem(1, 'mesa', { equipado: true, escala: 2.2 }), /tamanho/);
  await assert.rejects(model.personalizarItem(2, 'mesa', { equipado: true, escala: 1.2 }), /Compre/);
  assert.equal((await model.buscarEstado(2)).inventario.find(item => item.id === 'mesa'), undefined);
  banco.close();
});

test('Terrário: sala 2 só permite comprar móveis depois do desbloqueio e não altera a Sala 1', async () => {
  const { banco, model } = novoBanco();
  const initial = await model.buscarEstado(1);
  assert.equal(initial.salaDesbloqueada, 1);
  assert.equal(initial.inventario.some(item => item.id.startsWith('s2_')), false);
  banco.prepare('UPDATE terrario_usuario SET sementes=90 WHERE usuario_id=1').run();
  await assert.rejects(model.comprarItem(1, 's2_mesa'), /Desbloqueie a Sala 2/);
  assert.equal((await model.buscarEstado(1)).sementes, 90);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=2 WHERE usuario_id=1').run();
  await model.comprarItem(1, 's2_mesa');
  let state = await model.buscarEstado(1);
  assert.equal(state.sementes, 82);
  assert.equal(state.inventario.find(item => item.id === 's2_mesa').equipado, false);
  assert.equal(state.inventario.find(item => item.id === 'vasinho').equipado, true);
  await assert.rejects(model.comprarItem(1, 's2_mesa'), /já possui/);
  assert.equal((await model.buscarEstado(1)).sementes, 82);
  await model.personalizarItem(1, 's2_mesa', { equipado:true, x:45, y:68, escala:1.2 });
  state = await model.buscarEstado(1);
  assert.deepEqual(state.inventario.find(item => item.id === 's2_mesa'), { id:'s2_mesa', equipado:true, x:45, y:68, escala:1.2 });
  assert.equal(state.inventario.find(item => item.id === 'vasinho').equipado, true);
  await model.personalizarItem(1, 's2_mesa', { equipado:false });
  state = await model.buscarEstado(1);
  assert.equal(state.inventario.find(item => item.id === 's2_mesa').equipado, false);
  await assert.rejects(model.comprarItem(2, 's2_mesa'), /Desbloqueie a Sala 2/);
  banco.close();
});

test('Terrário: Sala 2 mantém posição e escala próprias, respeitando zonas e bloqueio', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=2, sementes=100 WHERE usuario_id=1').run();
  await model.comprarItem(1,'s2_mural');
  await model.comprarItem(1,'s2_cadeira');
  assert.equal((await model.buscarEstado(1)).sementes,92);
  await assert.rejects(model.personalizarItem(1, 's2_mural', { equipado:true, x:55, y:75 }), /Posição inválida/);
  await model.personalizarItem(1, 's2_mural', { equipado:true, x:51, y:39, escala:1.4 });
  await model.personalizarItem(1, 's2_cadeira', { equipado:true, x:57, y:72 });
  let estado = await model.buscarEstado(1);
  assert.equal(estado.inventario.find(i => i.id === 's2_mural').escala,1.4);
  assert.equal(estado.inventario.find(i => i.id === 's2_cadeira').x,57);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=1 WHERE usuario_id=1').run();
  await assert.rejects(model.personalizarItem(1, 's2_cadeira', { equipado:false }), /Desbloqueie a Sala 2/);
  banco.close();
});


test('Terrário: quatro novos itens da Sala 2 exigem desbloqueio, têm preços e zonas válidas', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  const itens = [
    ['s2_tapete_redondo',4,53,83],
    ['s2_vaso',2,18,68],
    ['s2_livros',2,52,81],
    ['s2_avisos',4,29,39],
  ];
  for (const [id] of itens) await assert.rejects(model.comprarItem(1,id), /Desbloqueie a Sala 2/);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=2, sementes=100 WHERE usuario_id=1').run();
  for (const [id,preco,x,y] of itens) {
    const anterior = (await model.buscarEstado(1)).sementes;
    await model.comprarItem(1,id);
    assert.equal((await model.buscarEstado(1)).sementes, anterior-preco);
    await model.personalizarItem(1,id,{ equipado:true,x,y });
  }
  const estado = await model.buscarEstado(1);
  assert.equal(estado.inventario.filter(item=>item.id.startsWith('s2_')).length,4);
  assert.equal(estado.inventario.find(item=>item.id==='vasinho').equipado,true);
  await assert.rejects(model.personalizarItem(1,'s2_avisos',{ equipado:true,x:29,y:80 }), /Posição inválida/);
  banco.close();
});

test('Terrário: mesa e luzes da Sala 2 podem subir mais alto sem liberar zonas de outros itens', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=2, sementes=150 WHERE usuario_id=1').run();
  for (const id of ['s2_mesa', 's2_luzes', 's2_planta', 's2_mural']) await model.comprarItem(1, id);
  await model.personalizarItem(1, 's2_mesa', { equipado:true, x:50, y:44 });
  await model.personalizarItem(1, 's2_luzes', { equipado:true, x:49, y:13 });
  await model.personalizarItem(1, 's2_planta', { equipado:true, x:17, y:19 });
  const estado = await model.buscarEstado(1);
  assert.equal(estado.inventario.find(item => item.id === 's2_mesa').y, 44);
  assert.equal(estado.inventario.find(item => item.id === 's2_luzes').y, 13);
  assert.equal(estado.inventario.find(item => item.id === 's2_planta').x, 17);
  await assert.rejects(model.personalizarItem(1, 's2_mesa', { equipado:true, x:50, y:42 }), /Posição inválida/);
  await assert.rejects(model.personalizarItem(1, 's2_luzes', { equipado:true, x:49, y:11 }), /Posição inválida/);
  await assert.rejects(model.personalizarItem(1, 's2_mural', { equipado:true, x:49, y:20 }), /Posição inválida/);
  banco.close();
});

test('Terrário: a Sala 3 vende seus oito itens exclusivos, com limites e compra protegidos', async () => {
  const { banco, model } = novoBanco();
  await model.buscarEstado(1);
  banco.prepare('UPDATE terrario_usuario SET sementes=200 WHERE usuario_id=1').run();
  await assert.rejects(model.comprarItem(1,'s3_lousa'),/Desbloqueie a Sala 3/);
  assert.equal((await model.buscarEstado(1)).sementes,200);
  banco.prepare('UPDATE terrario_usuario SET sala_desbloqueada=3 WHERE usuario_id=1').run();
  const ids=['s3_mesa','s3_lousa','s3_relogio','s3_mochila','s3_kit','s3_calendario','s3_painel','s3_tapete'];
  for (const id of ids) await model.comprarItem(1,id);
  await assert.rejects(model.comprarItem(1,'s3_mesa'),/já possui/);
  await model.personalizarItem(1,'s3_lousa',{equipado:true,x:30,y:40,escala:1.3});
  await model.personalizarItem(1,'s3_mochila',{equipado:true,x:26,y:77});
  await assert.rejects(model.personalizarItem(1,'s3_lousa',{equipado:true,x:30,y:80}),/Posição inválida/);
  await assert.rejects(model.personalizarItem(1,'s3_mochila',{equipado:true,x:26,y:34}),/Posição inválida/);
  const estado=await model.buscarEstado(1);
  assert.equal(estado.sementes,164);
  assert.equal(estado.inventario.filter(item=>ids.includes(item.id)).length,8);
  assert.equal(estado.inventario.find(i=>i.id==='s3_lousa').escala,1.3);
  banco.close();
});


test('Terrário: estudo livre funciona sem escolher matéria no cronômetro', async () => {
  const { banco, model } = novoBanco();
  const inicio = Date.now();
  const sessao = await model.iniciar(1, 'Estudo livre', 15, inicio);
  let estado = await model.buscarEstado(1, inicio + 1000);
  assert.equal(estado.sessao.materia, 'Estudo livre');
  assert.equal(estado.sessao.estado, 'em_andamento');
  assert.equal((await model.acao(1, sessao.lastID, 'pausar', inicio + 2000)).status, 200);
  estado = await model.buscarEstado(1, inicio + 3000);
  assert.equal(estado.sessao.estado, 'pausada');
  assert.equal((await model.acao(1, sessao.lastID, 'continuar', inicio + 4000)).status, 200);
  estado = await model.buscarEstado(1, inicio + 5000);
  assert.equal(estado.sessao.estado, 'em_andamento');
  banco.close();
});


test('Terrário: aceita durações de 1 a 120 min e paga 2 sementes a cada 15 completos', async () => {
  const { banco, model } = novoBanco();
  const tempoInicial = Date.now();
  for (const n of [0, -2, 121, 17.5, '17', null]) {
    await assert.rejects(model.iniciar(1, 'Estudo livre', n, tempoInicial), /duração deve ser/);
  }
  const duracoes = [2, 14, 17, 30, 46, 120];
  const sementes = [0, 0, 2, 4, 6, 16];
  const xp = [0, 0, 10, 15, 20, 20];
  for (let i = 0; i < duracoes.length; i++) {
    const inicio = tempoInicial + i * 8_000_000;
    const sessao = await model.iniciar(1, 'Estudo livre', duracoes[i], inicio);
    assert.equal((await model.acao(1, sessao.lastID, 'concluir', inicio + duracoes[i] * 60000 + 20)).status, 200);
    const credito = banco.prepare('SELECT duracao_minutos,sementes_recebidas,xp_recebido FROM terrario_sessoes WHERE id=?').get(sessao.lastID);
    assert.equal(credito.duracao_minutos, duracoes[i]);
    assert.equal(credito.sementes_recebidas, sementes[i]);
    assert.equal(credito.xp_recebido, xp[i]);
  }
  const estado = await model.buscarEstado(1, tempoInicial + 50_000_000);
  assert.equal(estado.sessoesValidas, 4);
  assert.equal(estado.sementes, 28);
  assert.equal(estado.xpTotal, 65);
  banco.close();
});

test('Terrário: migração preserva sessões antigas, seus IDs e os gatilhos', async () => {
  const { banco, model } = novoBanco({ schemaAntigo: true });
  const sessaoAntiga = banco.prepare('SELECT * FROM terrario_sessoes WHERE id=55').get();
  assert.equal(sessaoAntiga.duracao_minutos, 25);
  assert.equal(sessaoAntiga.sementes_recebidas, 8);
  assert.equal(sessaoAntiga.xp_recebido, 15);
  assert.match(banco.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='terrario_sessoes'").get().sql, /BETWEEN 1 AND 120/);
  const t = Date.now();
  const nova = await model.iniciar(1, 'Estudo livre', 36, t);
  assert.ok(nova.lastID > 55);
  await assert.rejects(model.iniciar(1, 'Estudo livre', 40, t), /UNIQUE constraint failed/);
  assert.equal((await model.acao(1, nova.lastID, 'concluir', t + 36 * 60000 + 10)).status, 200);
  assert.equal((await model.buscarEstado(1, t + 3000000)).sementes, 4); // Crédito antigo já registrado na sessão não é recalculado
  banco.close();
});


test('Terrário: recompensa usa apenas blocos completos de 15 minutos', async () => {
  const { banco, model } = novoBanco();
  const tempoInicial = Date.now();
  const duracoes = [1, 15, 25, 29, 30, 44, 45, 60, 120];
  const esperadas = [0, 2, 2, 2, 4, 4, 6, 8, 16];
  for (let i = 0; i < duracoes.length; i++) {
    const inicio = tempoInicial + i * 8_000_000;
    const sessao = await model.iniciar(1, 'Estudo livre', duracoes[i], inicio);
    assert.equal((await model.acao(1, sessao.lastID, 'concluir', inicio + duracoes[i] * 60000 + 20)).status, 200);
    const valor = banco.prepare('SELECT sementes_recebidas FROM terrario_sessoes WHERE id=?').get(sessao.lastID);
    assert.equal(valor.sementes_recebidas, esperadas[i], `Duração de ${duracoes[i]} min`);
  }
  assert.equal((await model.buscarEstado(1, tempoInicial + 80_000_000)).sementes, 44);
  banco.close();
});


test('Terrário: após 8 sessões válidas no dia, nenhuma semente nova é concedida', async () => {
  const { banco, model } = novoBanco();
  const hoje = Date.now();
  // Insere sessões históricas concluídas hoje, sem creditar o saldo de teste.
  for (let i = 0; i < 8; i++) {
    banco.prepare(`INSERT INTO terrario_sessoes
      (usuario_id,materia,duracao_minutos,restante_segundos,estado,iniciada_em_ms,ativo_desde_ms,concluida_em_ms)
      VALUES (1,'Estudo livre',15,0,'concluida',?,NULL,?)`)
      .run(hoje - (i + 1) * 1000, hoje - (i + 1) * 1000);
  }
  const sessao = await model.iniciar(1, 'Estudo livre', 45, hoje);
  assert.equal((await model.acao(1, sessao.lastID, 'concluir', hoje + 45 * 60_000 + 1)).status, 200);
  assert.equal(banco.prepare('SELECT sementes_recebidas FROM terrario_sessoes WHERE id=?').get(sessao.lastID).sementes_recebidas, 0);
  banco.close();
});
