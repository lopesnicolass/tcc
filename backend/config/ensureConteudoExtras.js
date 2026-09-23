const db =
    require("./db");

// =====================================================
// TABELA DE PROGRESSO DOS CHECKLISTS
// =====================================================

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS checklist_progresso (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,

            bloco_id INTEGER NOT NULL,

            item_indice INTEGER NOT NULL,

            concluido INTEGER NOT NULL DEFAULT 0,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE,

            FOREIGN KEY (bloco_id)
                REFERENCES blocos_conteudo(id)
                ON DELETE CASCADE,

            UNIQUE (
                usuario_id,
                bloco_id,
                item_indice
            )
        )
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_checklist_progresso_usuario
        ON checklist_progresso(usuario_id)
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_checklist_progresso_bloco
        ON checklist_progresso(bloco_id)
    `);
});

module.exports = db;