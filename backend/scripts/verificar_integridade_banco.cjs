'use strict';

// Verificação segura: não modifica, limpa ou migra nenhum registro.
// Compatível com Node.js 22.13+ (node:sqlite).
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const arquivo = path.resolve(__dirname, '..', 'banco', 'vestibulinho.sqlite');

if (!fs.existsSync(arquivo)) {
  console.error(`Banco não encontrado: ${arquivo}`);
  process.exitCode = 1;
} else {
  let db;
  try {
    db = new DatabaseSync(arquivo, { readOnly: true });
    const resultado = db.prepare('PRAGMA integrity_check').all();
    const integra = resultado.length === 1 && resultado[0].integrity_check === 'ok';
    console.log(`Integridade estrutural: ${integra ? 'OK' : 'ERRO'}`);
    if (!integra) console.log('Diagnóstico:', resultado);

    const vinculos = db.prepare('PRAGMA foreign_key_check').all();
    console.log(`Vínculos inválidos encontrados: ${vinculos.length}`);
    for (const item of vinculos) {
      console.log(`- Tabela: ${item.table} | Linha: ${item.rowid === null ? '(sem rowid)' : item.rowid} | Tabela de referência: ${item.parent}`);
    }
    console.log('Verificação concluída. Nenhum dado foi alterado.');
    if (!integra || vinculos.length > 0) process.exitCode = 2;
  } catch (error) {
    console.error('Falha ao verificar o banco:', error.message);
    process.exitCode = 1;
  } finally {
    if (db) db.close();
  }
}
