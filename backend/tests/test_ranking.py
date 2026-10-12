"""Verificações SQL do ranking, executáveis com python -m unittest.
Não acessa nem altera o banco real do Tenna.
"""
import pathlib
import re
import sqlite3
import unittest

BASE = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (BASE / 'models/rankingModel.js').read_text(encoding='utf-8')


def extrair_sql(nome):
    inicio = SOURCE.index(f'function {nome}(')
    trecho = SOURCE[inicio:]
    encontrado = re.search(r'db\.(?:all|get|run)\(`(.*?)`', trecho, re.S)
    assert encontrado, f'SQL não encontrado em {nome}'
    return encontrado.group(1)


class RankingTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.executescript('''
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY, nome TEXT NOT NULL, tipo TEXT NOT NULL,
                xp INTEGER NOT NULL DEFAULT 0,
                foto_perfil_dados BLOB, foto_perfil_tipo TEXT
            );
            CREATE TABLE ranking_participantes (
                usuario_id INTEGER PRIMARY KEY,
                participando INTEGER NOT NULL DEFAULT 0 CHECK(participando IN (0, 1)),
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
            );
        ''')
        self.db.executemany('INSERT INTO usuarios (id, nome, tipo, xp) VALUES (?, ?, ?, ?)', [
            (1, 'Aluno A', 'aluno', 900),
            (2, 'Aluno B', 'aluno', 600),
            (3, 'Aluno C', 'aluno', 600),
            (4, 'Aluno D', 'aluno', 800),
            (5, 'Administrador', 'admin', 9000),
        ])

    def join(self, id, participating=True):
        self.db.execute(extrair_sql('atualizarParticipacao'), (int(participating), id))

    def test_order_and_tiebreaker_and_cap(self):
        for id in range(1, 6):
            self.join(id)
        rows = self.db.execute(extrair_sql('listarTop3')).fetchall()
        self.assertEqual([r[0] for r in rows], [1, 4, 2])
        self.assertEqual(len(rows), 3)

    def test_only_opted_in_students(self):
        self.join(2)
        self.join(5)
        rows = self.db.execute(extrair_sql('listarTop3')).fetchall()
        self.assertEqual([r[0] for r in rows], [2])

    def test_opt_out(self):
        self.join(1)
        self.join(1, False)
        self.assertEqual(self.db.execute(extrair_sql('listarTop3')).fetchall(), [])

    def test_photo_protected_by_optin(self):
        self.db.execute('UPDATE usuarios SET foto_perfil_dados = ?, foto_perfil_tipo = ? WHERE id = 1',
                        (b'fake-image', 'image/png'))
        self.assertIsNone(self.db.execute(extrair_sql('buscarFotoParticipante'), (1,)).fetchone())
        self.join(1)
        foto = self.db.execute(extrair_sql('buscarFotoParticipante'), (1,)).fetchone()
        self.assertEqual(foto, (b'fake-image', 'image/png'))
        self.join(1, False)
        self.assertIsNone(self.db.execute(extrair_sql('buscarFotoParticipante'), (1,)).fetchone())

    def test_admin_cannot_opt_in(self):
        self.join(5)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM ranking_participantes WHERE usuario_id = 5').fetchone()[0], 0)

    def test_participation_status(self):
        self.assertEqual(self.db.execute(extrair_sql('buscarParticipacao'), (1,)).fetchone(), (0,))
        self.join(1)
        self.assertEqual(self.db.execute(extrair_sql('buscarParticipacao'), (1,)).fetchone(), (1,))


if __name__ == '__main__':
    unittest.main()
