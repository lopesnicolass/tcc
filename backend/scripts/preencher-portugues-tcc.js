/**
 * Adiciona aulas de Português ao banco SQLite existente da Tenna.
 * Execute, com o backend parado, na raiz do projeto:
 *   node backend/scripts/preencher-portugues-tcc.js
 *
 * Seguro para repetir: não apaga, substitui ou duplica páginas existentes.
 * Requer somente o pacote sqlite3 que já é usado pelo backend.
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const aulas = require('./conteudos-portugues-tcc.json');

const banco = path.resolve(__dirname, '..', 'banco', 'vestibulinho.sqlite');
const tipos = new Set(['texto', 'destaque', 'lista', 'exemplo', 'exemplos', 'tabela', 'pergunta', 'glossario', 'checklist']);

function validar() {
  if (!Array.isArray(aulas) || !aulas.length) throw new Error('Arquivo de aulas vazio ou inválido.');
  for (const aula of aulas) {
    if (!aula.topico || !aula.titulo || !Array.isArray(aula.blocos) || !aula.blocos.length) {
      throw new Error(`Aula incompleta: ${aula.topico || '(sem nome)'}`);
    }
    for (const bloco of aula.blocos) {
      if (!tipos.has(bloco.tipo) || !bloco.dados || typeof bloco.dados !== 'object') {
        throw new Error(`Bloco inválido na aula ${aula.topico}`);
      }
      if (bloco.tipo === 'pergunta') {
        const { alternativas, correta } = bloco.dados;
        if (!Array.isArray(alternativas) || alternativas.length < 2 || !Number.isInteger(correta) || correta < 0 || correta >= alternativas.length) {
          throw new Error(`Pergunta inválida na aula ${aula.topico}`);
        }
      }
    }
  }
}

function abrirBanco() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(banco, sqlite3.OPEN_READWRITE, err => err ? reject(err) : resolve(db));
  });
}
function executar(db, sql, parametros = []) {
  return new Promise((resolve, reject) => db.run(sql, parametros, function (err) {
    err ? reject(err) : resolve({ id: this.lastID, alteracoes: this.changes });
  }));
}
function buscar(db, sql, parametros = []) {
  return new Promise((resolve, reject) => db.get(sql, parametros, (err, row) => err ? reject(err) : resolve(row)));
}
function fechar(db) {
  return new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve()));
}

async function main() {
  validar();
  if (!fs.existsSync(banco)) {
    throw new Error(`Banco não encontrado: ${banco}. Extraia o script dentro do projeto Tenna.`);
  }

  const db = await abrirBanco();
  let emTransacao = false;
  try {
    await executar(db, 'PRAGMA foreign_keys = ON');
    const materia = await buscar(db, `
      SELECT id, nome FROM materias
      WHERE slug IN ('portugues', 'lingua-portuguesa')
         OR nome = 'Português' COLLATE NOCASE
      ORDER BY CASE WHEN slug = 'portugues' THEN 0 ELSE 1 END
      LIMIT 1
    `);
    if (!materia) throw new Error('Matéria Português não encontrada. Inicie o backend uma vez para criar as matérias.');

    // Backup consistente feito pelo próprio SQLite, sem substituir o banco atual.
    const data = new Date().toISOString().replace(/[:.]/g, '-');
    const copia = path.join(path.dirname(banco), `vestibulinho.backup-portugues-${data}.sqlite`);
    await executar(db, 'VACUUM INTO ?', [copia]);
    console.log(`Backup criado: ${copia}`);

    await executar(db, 'BEGIN IMMEDIATE TRANSACTION');
    emTransacao = true;
    let novasPaginas = 0;
    let novosTopicos = 0;
    let novosBlocos = 0;
    let preservados = 0;
    const maxOrdem = await buscar(db, 'SELECT COALESCE(MAX(ordem), 0) AS ordem FROM topicos WHERE materia_id = ?', [materia.id]);
    let proximaOrdem = Number(maxOrdem.ordem) + 1;

    for (const aula of aulas) {
      let topico = await buscar(db, `
        SELECT id FROM topicos
        WHERE materia_id = ? AND LOWER(TRIM(nome)) = LOWER(TRIM(?))
        LIMIT 1
      `, [materia.id, aula.topico]);

      if (!topico) {
        const inserido = await executar(db, `
          INSERT INTO topicos (materia_id, nome, descricao, ordem, ativo)
          VALUES (?, ?, ?, ?, 1)
        `, [materia.id, aula.topico, aula.descricao_topico || '', proximaOrdem++]);
        topico = { id: inserido.id };
        novosTopicos++;
      }

      const existente = await buscar(db, 'SELECT id FROM paginas_conteudo WHERE topico_id = ?', [topico.id]);
      if (existente) {
        console.log(`Mantido sem alterações: ${aula.topico} (já possui página)`);
        preservados++;
        continue;
      }

      const aparencia = {
        tema: 'azul', formato: 'trilha', rotulo: 'MATERIAL DE ESTUDO',
        mensagem: 'Um passo de cada vez. Você consegue!', minutos: aula.minutos || 8,
        mostrarIndice: true, cabecalho: 'compacto', tamanhoTexto: 'normal',
        larguraLeitura: 'confortavel', mostrarEtapas: false,
        mostrarMensagem: false, mostrarDetalhes: false
      };
      const pagina = await executar(db, `
        INSERT INTO paginas_conteudo (topico_id, titulo, descricao, aparencia, publicado)
        VALUES (?, ?, ?, ?, 1)
      `, [topico.id, aula.titulo, aula.descricao_pagina || '', JSON.stringify(aparencia)]);
      novasPaginas++;

      for (let i = 0; i < aula.blocos.length; i++) {
        const bloco = aula.blocos[i];
        await executar(db, `
          INSERT INTO blocos_conteudo (pagina_id, tipo, ordem, dados, ativo)
          VALUES (?, ?, ?, ?, 1)
        `, [pagina.id, bloco.tipo, i + 1, JSON.stringify(bloco.dados)]);
        novosBlocos++;
      }
      console.log(`Criado: ${aula.topico} (${aula.blocos.length} blocos)`);
    }
    await executar(db, 'COMMIT');
    emTransacao = false;
    console.log(`\nConcluído: ${novosTopicos} tópicos, ${novasPaginas} páginas e ${novosBlocos} blocos adicionados.`);
    if (preservados) console.log(`${preservados} página(s) existente(s) preservada(s).`);
    console.log('Abra Conteúdos > Português e atualize a página do navegador.');
  } catch (erro) {
    if (emTransacao) {
      try { await executar(db, 'ROLLBACK'); } catch (_) { /* manter erro original */ }
    }
    throw erro;
  } finally {
    await fechar(db);
  }
}

main().catch(err => {
  console.error(`\nErro ao preencher Português: ${err.message}`);
  console.error('O banco original foi preservado. Confira as instruções do ZIP.');
  process.exitCode = 1;
});
