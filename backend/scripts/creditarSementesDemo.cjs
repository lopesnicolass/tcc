/**
 * Crédito de demonstração para UMA conta específica, sem alterar as regras
 * normais de recompensas, preços, inventário ou desbloqueio de salas.
 *
 * Executar na pasta backend:
 *   node scripts/creditarSementesDemo.cjs "email-da-conta@exemplo.com"
 *
 * O saldo da conta escolhida é elevado para NO MÍNIMO 100 sementes.
 * Pode ser executado novamente sem somar 100 a cada execução.
 */
'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');
const fs = require('node:fs');

const email = String(process.argv[2] || '').trim();
const SALDO_DEMO = 100;
const caminho = path.join(__dirname, '..', 'banco', 'vestibulinho.sqlite');

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: node scripts/creditarSementesDemo.cjs "email-da-conta@exemplo.com"');
  process.exit(1);
}
if (!fs.existsSync(caminho)) {
  console.error('Banco de dados local não encontrado:', caminho);
  process.exit(1);
}

const db = new sqlite3.Database(caminho, sqlite3.OPEN_READWRITE);
const run = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function (error) { error ? reject(error) : resolve(this); }));
const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));

(async () => {
  await run('PRAGMA foreign_keys = ON');
  await run('BEGIN IMMEDIATE');
  try {
    const usuario = await get(
      'SELECT id, nome, email FROM usuarios WHERE lower(email) = lower(?)', [email]
    );
    if (!usuario) throw new Error('Conta não encontrada. Confira o e-mail utilizado para entrar na TENNA.');
    // As tabelas já são criadas pelo servidor do TENNA. Não cria dados fictícios.
    await run('INSERT OR IGNORE INTO terrario_usuario (usuario_id) VALUES (?)', [usuario.id]);
    const antes = await get('SELECT sementes FROM terrario_usuario WHERE usuario_id = ?', [usuario.id]);
    await run('UPDATE terrario_usuario SET sementes = MAX(sementes, ?) WHERE usuario_id = ?',
      [SALDO_DEMO, usuario.id]);
    const depois = await get('SELECT sementes FROM terrario_usuario WHERE usuario_id = ?', [usuario.id]);
    await run('COMMIT');
    console.log(`Sementes de demonstração configuradas para ${usuario.nome} (${usuario.email}).`);
    console.log(`Saldo anterior: ${antes.sementes} | Saldo atual: ${depois.sementes}`);
    console.log('Apenas essa conta foi alterada. As regras do foco e das outras contas continuam iguais.');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
})().catch((error) => {
  console.error('Não foi possível creditar sementes:', error.message);
  process.exitCode = 1;
}).finally(() => db.close());
