const db = require('../config/db');
const { MATERIAS_FIXAS } = require('../utils/materiasFixas');

const DURACOES = [1, 15, 25, 45]; // 1 min: demonstração, sem XP/desbloqueio
const RECOMPENSAS = Object.freeze({
  1: { sementes: 2, xp: 0 },
  15: { sementes: 5, xp: 10 },
  25: { sementes: 8, xp: 15 },
  45: { sementes: 12, xp: 20 }
});
const MATERIAS = MATERIAS_FIXAS.map(({ nome }) => nome);
const LIMITES = Object.freeze({
  chao: { xMin: 12, xMax: 88, yMin: 56, yMax: 86 },
  tapete: { xMin: 22, xMax: 78, yMin: 66, yMax: 85 },
  parede: { xMin: 22, xMax: 78, yMin: 26, yMax: 50 },
  pendurado: { xMin: 15, xMax: 85, yMin: 26, yMax: 55 }
});
const ITENS = Object.freeze({
  // Itens antigos preservados para não perder compras feitas pelos alunos.
  vasinho: { x: 30, y: 78, zona: 'chao' },
  mesa: { x: 50, y: 56, zona: 'chao' },
  banquinho: { x: 47, y: 70, zona: 'chao' },
  luminaria: { x: 15, y: 69, zona: 'chao' },
  cama: { x: 31, y: 68, zona: 'chao' },
  prateleira: { x: 26, y: 36, zona: 'parede' },
  quadro: { x: 50, y: 36, zona: 'parede' },
  estante: { x: 70, y: 56, zona: 'chao' },
  lampiao: { x: 83, y: 42, zona: 'pendurado' },
  bau: { x: 22, y: 79, zona: 'chao' },
  tapete: { x: 40, y: 77, zona: 'tapete' },
  mesa_redonda: { x: 76, y: 73, zona: 'chao' },
  almofada: { x: 63, y: 80, zona: 'tapete' },
  banquinho_tronco: { x: 82, y: 80, zona: 'chao' },
  guarda_roupa: { x: 59, y: 51, zona: 'chao', sala: 1, limites: { yMin: 42 } },
  // Sala 2: itens exclusivos, com IDs separados das compras da Sala 1.
  s2_mesa: { x: 50, y: 62, zona: 'chao', sala: 2, limites: { yMin: 43 } },
  s2_cadeira: { x: 43, y: 69, zona: 'chao', sala: 2 },
  s2_estante: { x: 26, y: 74, zona: 'chao', sala: 2 },
  s2_mural: { x: 50, y: 34, zona: 'parede', sala: 2 },
  s2_calendario: { x: 72, y: 35, zona: 'parede', sala: 2 },
  s2_globo: { x: 26, y: 84, zona: 'chao', sala: 2 },
  s2_puff: { x: 75, y: 82, zona: 'tapete', sala: 2 },
  s2_planta: { x: 17, y: 33, zona: 'pendurado', sala: 2, limites: { yMin: 16 } },
  s2_luzes: { x: 49, y: 20, zona: 'pendurado', sala: 2, limites: { yMin: 12 } },
  s2_caixa: { x: 84, y: 81, zona: 'chao', sala: 2 },
  s2_tapete_redondo: { x: 58, y: 82, zona: 'tapete', sala: 2 },
  s2_vaso: { x: 84, y: 68, zona: 'chao', sala: 2 },
  s2_livros: { x: 45, y: 78, zona: 'chao', sala: 2 },
  s2_avisos: { x: 28, y: 39, zona: 'parede', sala: 2 },
  // Sala 3: reta final, ainda dentro do formigueiro, sem abertura no teto por enquanto.
  s3_mesa: { x: 43, y: 80, zona: 'chao', sala: 3 },
  s3_lousa: { x: 29, y: 43, zona: 'parede', sala: 3 },
  s3_relogio: { x: 82, y: 31, zona: 'parede', sala: 3, limites: { xMax: 88 } },
  s3_mochila: { x: 22, y: 84, zona: 'chao', sala: 3 },
  s3_kit: { x: 53, y: 68, zona: 'chao', sala: 3 },
  s3_cadeira: { x: 36, y: 73, zona: 'chao', sala: 3 },
  s3_estante: { x: 75, y: 68, zona: 'chao', sala: 3 },
  s3_painel: { x: 65, y: 41, zona: 'parede', sala: 3 },
  s3_calendario: { x: 82, y: 51, zona: 'parede', sala: 3, limites: { xMax: 88, yMax: 55 } },
  s3_livros: { x: 50, y: 80, zona: 'chao', sala: 3 },
  s3_puff: { x: 63, y: 81, zona: 'tapete', sala: 3 },
  s3_tapete: { x: 44, y: 85, zona: 'tapete', sala: 3 },
  s3_vaso: { x: 18, y: 68, zona: 'chao', sala: 3 },
  s3_luzes: { x: 50, y: 29, zona: 'pendurado', sala: 3 },
  s3_caixa: { x: 81, y: 80, zona: 'chao', sala: 3 },
});

function executar(sql, args = []) {
  return new Promise((resolve, reject) => db.run(sql, args, function callback(erro) {
    if (erro) reject(erro);
    else resolve({ changes: this.changes, lastID: this.lastID });
  }));
}
function obter(sql, args = []) {
  return new Promise((resolve, reject) => db.get(sql, args, (erro, resultado) => {
    if (erro) reject(erro); else resolve(resultado);
  }));
}

function listar(sql, args = []) {
  return new Promise((resolve, reject) => db.all(sql, args, (erro, resultados) => {
    if (erro) reject(erro); else resolve(resultados);
  }));
}

function validarItem(itemId) {
  if (typeof itemId !== 'string' || !Object.hasOwn(ITENS, itemId)) {
    const erro = new Error('Esse item não está disponível na loja.');
    erro.status = 400; throw erro;
  }
}

async function exigirSalaLiberada(usuarioId, itemId) {
  const sala = ITENS[itemId].sala || 1;
  if (sala === 1) return;
  const perfil = await obter('SELECT sala_desbloqueada FROM terrario_usuario WHERE usuario_id=?', [usuarioId]);
  if (!perfil || perfil.sala_desbloqueada < sala) {
    const erro = new Error(`Desbloqueie a Sala ${sala} antes de usar seus móveis.`);
    erro.status = 403;
    throw erro;
  }
}

async function comprarItem(usuarioId, itemId) {
  validarItem(itemId);
  await exigirSalaLiberada(usuarioId, itemId);
  if (itemId === 'vasinho') {
    const erro = new Error('O vasinho já é seu.'); erro.status = 409; throw erro;
  }
  await executar('INSERT OR IGNORE INTO terrario_usuario(usuario_id) VALUES(?)', [usuarioId]);
  const { x, y } = ITENS[itemId];
  // O catálogo e o saldo são consultados no servidor, na mesma instrução SQLite.
  // O trigger AFTER INSERT faz o débito atômico. Repetir a compra não debita.
  const resultado = await executar(`INSERT OR IGNORE INTO terrario_inventario
    (usuario_id,item_id,equipado,posicao_x,posicao_y)
    SELECT ?, c.item_id, 0, ?, ? FROM terrario_catalogo c
    WHERE c.item_id=? AND c.preco>0
      AND EXISTS (SELECT 1 FROM terrario_usuario u
        WHERE u.usuario_id=? AND u.sementes >= c.preco)`,
  [usuarioId, x, y, itemId, usuarioId]);
  if (!resultado.changes) {
    const possui = await obter('SELECT 1 AS ok FROM terrario_inventario WHERE usuario_id=? AND item_id=?', [usuarioId, itemId]);
    const erro = new Error(possui ? 'Você já possui esse item.' : 'Você não tem sementes suficientes para esta compra.');
    erro.status = 409; throw erro;
  }
  return true;
}

async function personalizarItem(usuarioId, itemId, dados) {
  validarItem(itemId);
  await exigirSalaLiberada(usuarioId, itemId);
  if (typeof dados?.equipado !== 'boolean') {
    const erro = new Error('Escolha se deseja colocar ou guardar o item.'); erro.status = 400; throw erro;
  }
  let x = null, y = null;
  if (dados.x !== undefined || dados.y !== undefined) {
    // Alguns móveis possuem altura própria para encaixar na parede ou no teto.
    const limite = { ...LIMITES[ITENS[itemId].zona], ...(ITENS[itemId].limites || {}) };
    if (!Number.isFinite(dados.x) || !Number.isFinite(dados.y) ||
      dados.x < limite.xMin || dados.x > limite.xMax ||
      dados.y < limite.yMin || dados.y > limite.yMax) {
      const erro = new Error('Posição inválida para o móvel.'); erro.status = 400; throw erro;
    }
    x = Math.round(dados.x * 100) / 100;
    y = Math.round(dados.y * 100) / 100;
  }
  let escala = null;
  if (dados.escala !== undefined) {
    if (!Number.isFinite(dados.escala) || dados.escala < 0.6 || dados.escala > 1.5) {
      const erro = new Error('O tamanho deve ficar entre 60% e 150%.'); erro.status = 400; throw erro;
    }
    escala = Math.round(dados.escala * 10) / 10;
  }
  const resultado = await executar(`UPDATE terrario_inventario
    SET equipado=?, posicao_x=COALESCE(?,posicao_x), posicao_y=COALESCE(?,posicao_y)
    WHERE usuario_id=? AND item_id=?`, [dados.equipado ? 1 : 0, x, y, usuarioId, itemId]);
  if (!resultado.changes) {
    const erro = new Error('Compre esse item para conseguir utilizá-lo.'); erro.status = 403; throw erro;
  }
  if (escala !== null) {
    await executar(`INSERT INTO terrario_item_escalas(usuario_id,item_id,escala)
      VALUES(?,?,?) ON CONFLICT(usuario_id,item_id) DO UPDATE SET escala=excluded.escala`,
    [usuarioId, itemId, escala]);
  }
  return true;
}

async function creditarConclusao(usuarioId, id, agora = Date.now()) {
  // Condição temporal calculada no servidor, não no contador do browser.
  // A conclusão só muda o estado uma vez; o gatilho credita XP e sementes
  // na mesma instrução SQLite, sem possibilidade de crédito em dobro.
  const alteracao = await executar(`UPDATE terrario_sessoes
    SET estado='concluida', restante_segundos=0, ativo_desde_ms=NULL,
      concluida_em_ms=?,
      sementes_recebidas=CASE
        WHEN duracao_minutos=1 AND
          (SELECT COUNT(*) FROM terrario_sessoes s
           WHERE s.usuario_id=terrario_sessoes.usuario_id
             AND s.estado='concluida' AND s.duracao_minutos=1
             AND date(s.concluida_em_ms/1000,'unixepoch')=date('now')) >= 3
          THEN 0
        WHEN duracao_minutos>=15 AND
          (SELECT COUNT(*) FROM terrario_sessoes s
           WHERE s.usuario_id=terrario_sessoes.usuario_id
             AND s.estado='concluida' AND s.duracao_minutos>=15
             AND date(s.concluida_em_ms/1000,'unixepoch')=date('now')) >= 8
          THEN 0
        WHEN duracao_minutos=1 THEN 2
        WHEN duracao_minutos=15 THEN 5
        WHEN duracao_minutos=25 THEN 8
        ELSE 12 END,
      xp_recebido=CASE
        WHEN (SELECT COUNT(*) FROM xp_eventos_verificados
              WHERE usuario_id=terrario_sessoes.usuario_id
                AND action='foco_concluido' AND data=date('now')) >= 8
          THEN 0
        WHEN duracao_minutos=15 THEN 10
        WHEN duracao_minutos=25 THEN 15
        WHEN duracao_minutos=45 THEN 20
        ELSE 0 END
    WHERE id=? AND usuario_id=? AND estado='em_andamento'
      AND ativo_desde_ms IS NOT NULL
      AND ? >= ativo_desde_ms + restante_segundos * 1000`,
  [agora, id, usuarioId, agora]);
  return alteracao.changes === 1;
}

async function buscarEstado(usuarioId, agora = Date.now()) {
  await executar('INSERT OR IGNORE INTO terrario_usuario(usuario_id) VALUES(?)', [usuarioId]);
  await executar("INSERT OR IGNORE INTO terrario_inventario(usuario_id,item_id,equipado,posicao_x,posicao_y) VALUES(?,'vasinho',1,30,78)", [usuarioId]);
  let sessao = await obter(`SELECT * FROM terrario_sessoes
    WHERE usuario_id=? AND estado IN ('em_andamento', 'pausada')
    ORDER BY id DESC LIMIT 1`, [usuarioId]);
  if (sessao && sessao.estado === 'em_andamento' &&
    agora >= sessao.ativo_desde_ms + sessao.restante_segundos * 1000) {
    await creditarConclusao(usuarioId, sessao.id, agora);
    sessao = null;
  }
  const [perfil, ultimaSessao, xp, inventario] = await Promise.all([
    obter('SELECT * FROM terrario_usuario WHERE usuario_id=?', [usuarioId]),
    obter('SELECT * FROM terrario_sessoes WHERE usuario_id=? ORDER BY id DESC LIMIT 1', [usuarioId]),
    obter('SELECT xp FROM usuarios WHERE id=?', [usuarioId]),
    listar(`SELECT i.item_id AS id, i.equipado, i.posicao_x AS x, i.posicao_y AS y,
      COALESCE(e.escala,1) AS escala FROM terrario_inventario i
      LEFT JOIN terrario_item_escalas e ON e.usuario_id=i.usuario_id AND e.item_id=i.item_id
      WHERE i.usuario_id=?`, [usuarioId])
  ]);
  const atual = sessao || (ultimaSessao?.estado === 'concluida' ? ultimaSessao : null);
  const restante = atual?.estado === 'em_andamento'
    ? Math.max(0, Math.ceil((atual.ativo_desde_ms + atual.restante_segundos * 1000 - agora) / 1000))
    : atual?.restante_segundos ?? null;
  return {
    sementes: perfil.sementes,
    salaDesbloqueada: perfil.sala_desbloqueada,
    salaAtiva: perfil.sala_ativa,
    sessoesValidas: perfil.total_sessoes_concluidas,
    tempoTotalSegundos: perfil.tempo_total_foco_segundos,
    xpTotal: xp?.xp ?? 0,
    inventario: inventario.map(item => ({ ...item, equipado: Boolean(item.equipado) })),
    sessao: atual ? {
      id: atual.id, materia: atual.materia, duracao: atual.duracao_minutos,
      estado: atual.estado, restanteSegundos: restante,
      sementesRecebidas: atual.sementes_recebidas,
      xpRecebido: atual.xp_recebido
    } : null,
    agoraServidor: agora
  };
}

async function iniciar(usuarioId, materia, duracao, agora = Date.now()) {
  if (!MATERIAS.includes(materia) || !DURACOES.includes(duracao)) {
    const erro = new Error('Selecione uma matéria e uma duração válida.');
    erro.status = 400;
    throw erro;
  }
  await executar('INSERT OR IGNORE INTO terrario_usuario(usuario_id) VALUES(?)', [usuarioId]);
  return executar(`INSERT INTO terrario_sessoes
    (usuario_id,materia,duracao_minutos,restante_segundos,estado,iniciada_em_ms,ativo_desde_ms)
    VALUES(?,?,?,?, 'em_andamento',?,?)`, [usuarioId, materia, duracao, duracao * 60, agora, agora]);
}

async function acao(usuarioId, id, tipo, agora = Date.now()) {
  const sessao = await obter('SELECT * FROM terrario_sessoes WHERE id=? AND usuario_id=?', [id, usuarioId]);
  if (!sessao) return { status: 404, mensagem: 'Sessão não encontrada.' };
  if (tipo === 'concluir') {
    if (sessao.estado === 'concluida') return { status: 200, mensagem: 'Sessão já concluída.' };
    if (sessao.estado !== 'em_andamento' ||
      agora < sessao.ativo_desde_ms + sessao.restante_segundos * 1000) {
      return { status: 409, mensagem: 'O tempo de foco ainda não terminou.' };
    }
    await creditarConclusao(usuarioId, id, agora);
    return { status: 200 };
  }
  if (tipo === 'pausar') {
    if (sessao.estado !== 'em_andamento') return { status: 409, mensagem: 'Sessão não está em andamento.' };
    if (agora >= sessao.ativo_desde_ms + sessao.restante_segundos * 1000) {
      await creditarConclusao(usuarioId, id, agora);
      return { status: 200 };
    }
    const { changes } = await executar(`UPDATE terrario_sessoes
      SET estado='pausada', restante_segundos=MAX(0, restante_segundos - CAST((? - ativo_desde_ms)/1000 AS INTEGER)),
      ativo_desde_ms=NULL WHERE id=? AND usuario_id=? AND estado='em_andamento'`, [agora, id, usuarioId]);
    return { status: changes ? 200 : 409 };
  }
  if (tipo === 'continuar') {
    const { changes } = await executar(`UPDATE terrario_sessoes
      SET estado='em_andamento', ativo_desde_ms=?
      WHERE id=? AND usuario_id=? AND estado='pausada' AND restante_segundos>0`,
    [agora, id, usuarioId]);
    return { status: changes ? 200 : 409, mensagem: changes ? null : 'Sessão não está pausada.' };
  }
  if (tipo === 'cancelar') {
    const { changes } = await executar(`UPDATE terrario_sessoes
      SET estado='cancelada', ativo_desde_ms=NULL
      WHERE id=? AND usuario_id=? AND estado IN ('em_andamento', 'pausada')`,
    [id, usuarioId]);
    return { status: changes || sessao.estado === 'cancelada' ? 200 : 409,
      mensagem: changes || sessao.estado === 'cancelada' ? null : 'Sessão já concluída não pode ser cancelada.' };
  }
  return { status: 400, mensagem: 'Ação inválida.' };
}

module.exports = { DURACOES, RECOMPENSAS, MATERIAS, buscarEstado, iniciar, acao, creditarConclusao, comprarItem, personalizarItem };
