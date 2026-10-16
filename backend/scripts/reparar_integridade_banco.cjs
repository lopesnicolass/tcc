'use strict';

// Reparo restrito aos vínculos órfãos conhecidos do Tenna.
// Sem argumentos: apenas inspeciona. Com --aplicar: cria backup, arquiva e corrige.
// Requer Node.js 22.13+ com node:sqlite. O backend DEVE estar desligado ao aplicar.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync, backup } = require('node:sqlite');

const arquivo = path.resolve(__dirname, '..', 'banco', 'vestibulinho.sqlite');
const aplicar = process.argv.includes('--aplicar');
const argumentosInvalidos = process.argv.slice(2).filter(a => a !== '--aplicar');
const tabelas = new Set(['resultados', 'sessoes', 'mural_postits']);

function checarIntegridade(db) {
  const verificacao = db.prepare('PRAGMA integrity_check').all();
  const ok = verificacao.length === 1 && verificacao[0].integrity_check === 'ok';
  if (!ok) throw new Error('O SQLite encontrou problema estrutural. O reparo foi cancelado.');
  return db.prepare('PRAGMA foreign_key_check').all();
}

function validarOrfaos(db, orfaos) {
  for (const item of orfaos) {
    if (!tabelas.has(item.table) || item.parent !== 'usuarios' || !Number.isSafeInteger(item.rowid)) {
      throw new Error(`Vínculo inesperado em ${item.table}. Avaliação manual necessária; nenhum dado foi alterado.`);
    }
    const chaves = db.prepare(`PRAGMA foreign_key_list("${item.table}")`).all();
    const chave = chaves.find(ch => ch.id === item.fkid);
    if (!chave || chave.table !== 'usuarios' || chave.from !== 'usuario_id' || chave.to !== 'id') {
      throw new Error(`Chave estrangeira inesperada em ${item.table}. Reparo cancelado.`);
    }
    const existe = db.prepare(`SELECT 1 AS existe FROM "${item.table}" WHERE rowid = ?`).get(item.rowid);
    if (!existe) throw new Error(`Registro não encontrado: ${item.table}/${item.rowid}. Reparo cancelado.`);
  }
}

function nomeBackup() {
  const agora = new Date().toISOString().replace(/[:.]/g, '-');
  return arquivo.replace(/\.sqlite$/, `.backup-integridade-${agora}-${process.pid}.sqlite`);
}

async function main() {
  if (argumentosInvalidos.length) {
    throw new Error('Uso: node scripts/reparar_integridade_banco.cjs [--aplicar]');
  }
  if (!fs.existsSync(arquivo)) throw new Error('Banco não encontrado em backend/banco/vestibulinho.sqlite.');
  let db;
  try {
    db = new DatabaseSync(arquivo, { readOnly: !aplicar });
    const orfaos = checarIntegridade(db);
    console.log('Integridade estrutural: OK');
    console.log(`Vínculos inválidos: ${orfaos.length}`);
    for (const item of orfaos) {
      console.log(`- ${item.table}, linha ${item.rowid}, referência ${item.parent}`);
    }
    if (!orfaos.length) {
      console.log('Nenhum reparo necessário. Nenhum dado foi alterado.');
      return;
    }
    validarOrfaos(db, orfaos);
    if (!aplicar) {
      console.log('Modo de conferência: nenhuma alteração realizada.');
      console.log('Para reparar: pare o backend, faça uma cópia extra se desejar, e execute:');
      console.log('node scripts/reparar_integridade_banco.cjs --aplicar');
      return;
    }

    const destino = nomeBackup();
    if (fs.existsSync(destino)) throw new Error('Nome do backup já existe. Reparo cancelado.');
    // Copia consistente feita pelo próprio SQLite, antes de iniciar as alterações.
    await backup(db, destino);
    const dbBackup = new DatabaseSync(destino, { readOnly: true });
    try {
      const resultadoBackup = dbBackup.prepare('PRAGMA integrity_check').get();
      if (resultadoBackup?.integrity_check !== 'ok') throw new Error('Falha ao validar backup.');
    } finally {
      dbBackup.close();
    }
    console.log(`Backup privado criado e validado: ${path.basename(destino)}`);

    let transacaoIniciada = false;
    try {
      db.exec('PRAGMA foreign_keys = ON');
      db.exec('BEGIN IMMEDIATE');
      transacaoIniciada = true;
      // Arquivo interno que mantém todos os campos originais para eventual restauração manual.
      db.exec(`CREATE TABLE IF NOT EXISTS integridade_orfaos_arquivados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tabela TEXT NOT NULL,
        rowid_original INTEGER NOT NULL,
        dados_json TEXT NOT NULL,
        arquivado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      const inserir = db.prepare(`INSERT INTO integridade_orfaos_arquivados
        (tabela, rowid_original, dados_json) VALUES (?, ?, ?)`);
      for (const item of orfaos) {
        // A tabela é previamente validada contra uma lista fixa; não recebe entrada arbitrária.
        const registro = db.prepare(`SELECT * FROM "${item.table}" WHERE rowid = ?`).get(item.rowid);
        if (!registro) throw new Error(`Registro desapareceu: ${item.table}/${item.rowid}.`);
        const serializado = JSON.stringify(registro, (_chave, valor) =>
          typeof valor === 'bigint' ? { __tenna_bigint: String(valor) } :
          valor instanceof Uint8Array ? { __tenna_bytes: Buffer.from(valor).toString('base64') } : valor);
        inserir.run(item.table, item.rowid, serializado);
        const remocao = db.prepare(`DELETE FROM "${item.table}" WHERE rowid = ?`).run(item.rowid);
        if (remocao.changes !== 1) throw new Error(`Remoção inesperada: ${item.table}/${item.rowid}.`);
      }
      const restantes = checarIntegridade(db);
      if (restantes.length) throw new Error(`Ainda existem ${restantes.length} vínculos inválidos. Reparo desfeito.`);
      db.exec('COMMIT');
      transacaoIniciada = false;
      console.log(`Reparo concluído: ${orfaos.length} registros órfãos arquivados antes de serem removidos das tabelas ativas.`);
      console.log('Integridade estrutural: OK | Vínculos inválidos restantes: 0');
      console.log('O arquivo de backup e o arquivo interno integridade_orfaos_arquivados foram preservados.');
    } catch (erro) {
      if (transacaoIniciada) db.exec('ROLLBACK');
      throw erro;
    }
  } finally {
    if (db) db.close();
  }
}

main().catch(error => {
  console.error('ERRO:', error.message);
  process.exitCode = 1;
});
