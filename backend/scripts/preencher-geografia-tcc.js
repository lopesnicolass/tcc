/**
 * Prepara o simulado de Geografia utilizado nas capturas de tela do TCC.
 * Seguro para executar mais de uma vez: não cria simulados duplicados.
 *
 * Execute a partir da pasta backend:
 *   node scripts/preencher-geografia-tcc.js
 */
const sqlite3 = require('sqlite3');
const path = require('path');
const dados = require('./questoes-geografia-tcc.json');

const caminho = path.join(__dirname, '..', 'banco', 'vestibulinho.sqlite');
const db = new sqlite3.Database(caminho);
const buscar = (sql, parametros = []) => new Promise((resolve, reject) => db.get(sql, parametros, (erro, linha) => erro ? reject(erro) : resolve(linha)));
const executar = (sql, parametros = []) => new Promise((resolve, reject) => db.run(sql, parametros, function (erro) { erro ? reject(erro) : resolve(this); }));

async function main() {
  const jaExiste = await buscar('SELECT id FROM simulados WHERE titulo = ? AND materia = ?', [dados.titulo, dados.materia]);
  if (jaExiste) {
    console.log(`Simulado de Geografia já cadastrado (ID ${jaExiste.id}). Nenhuma alteração realizada.`);
    return;
  }

  const topico = await buscar(`SELECT t.id FROM topicos t JOIN materias m ON m.id = t.materia_id
    WHERE m.nome = ? AND t.nome = ? LIMIT 1`, [dados.materia, dados.topico]);
  if (!topico) throw new Error('Cadastre a matéria Geografia e o conteúdo Cartografia antes de executar o script.');

  await executar('BEGIN TRANSACTION');
  try {
    const registro = await executar(`INSERT INTO simulados
      (titulo, descricao, tempo_limite, quantidade_questoes, materia, dificuldade, topico_id, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [dados.titulo, dados.descricao, dados.tempoLimite, dados.questoes.length, dados.materia, dados.dificuldade, topico.id]);

    for (let ordem = 0; ordem < dados.questoes.length; ordem++) {
      const questao = dados.questoes[ordem];
      const criada = await executar(`INSERT INTO questoes
        (pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, correta, materia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [questao.pergunta, ...questao.alternativas, questao.correta, dados.materia]);
      await executar('INSERT INTO simulado_questoes (simulado_id, questao_id, ordem) VALUES (?, ?, ?)',
        [registro.lastID, criada.lastID, ordem + 1]);
    }
    await executar('COMMIT');
    console.log(`Simulado de Geografia criado (ID ${registro.lastID}) com ${dados.questoes.length} questões.`);
  } catch (erro) {
    await executar('ROLLBACK');
    throw erro;
  }
}

main().catch(erro => { console.error(erro); process.exitCode = 1; }).finally(() => db.close());
