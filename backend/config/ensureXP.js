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

// Registra a origem real do XP e impede conceder duas vezes ao mesmo evento.
// A tabela e o índice precisam ser enfileirados em ordem no SQLite.
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS xp_eventos_verificados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        referencia TEXT NOT NULL,
        data TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        UNIQUE (usuario_id, action, referencia),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_xp_verificados_diario
        ON xp_eventos_verificados(usuario_id, action, data)`);
    // O evento e a atualização do saldo acontecem na MESMA transação implícita
    // do INSERT. Se a atualização falhar, o SQLite reverte também o evento.
    db.run(`CREATE TRIGGER IF NOT EXISTS trg_xp_verificado_saldo
        AFTER INSERT ON xp_eventos_verificados
        BEGIN
            UPDATE usuarios SET
                xp = COALESCE(xp, 0) + NEW.quantidade,
                streak = CASE
                    WHEN last_active_date = NEW.data THEN COALESCE(streak, 0)
                    WHEN last_active_date = date(NEW.data, '-1 day') THEN COALESCE(streak, 0) + 1
                    ELSE 1
                END,
                last_active_date = NEW.data
            WHERE id = NEW.usuario_id;
        END`);
});

module.exports = db;
