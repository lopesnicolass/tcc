const db =
    require("./db");

db.serialize(() => {
    // =====================================================
    // EVENTOS DE XP (controle de limite diário por ação)
    // =====================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS xp_eventos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            usuario_id INTEGER NOT NULL,

            action TEXT NOT NULL,

            data TEXT NOT NULL,

            quantidade INTEGER NOT NULL,

            criado_em DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE INDEX IF NOT EXISTS
        idx_xp_eventos_usuario_acao_data

        ON xp_eventos(
            usuario_id,
            action,
            data
        )
    `);
});

module.exports = db;
