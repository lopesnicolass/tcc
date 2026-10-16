#!/usr/bin/env python3
"""Inspeciona os vínculos inválidos do SQLite. Usa --aplicar para criar backup
privado e arquivar/remover somente linhas órfãs das três tabelas conhecidas.
Pare o servidor antes de executar --aplicar. Nunca compartilhe o backup.
"""
import argparse
import json
import sqlite3
from pathlib import Path
from datetime import datetime

ARQUIVO = Path(__file__).resolve().parents[1] / 'banco' / 'vestibulinho.sqlite'
TABELAS_PERMITIDAS = {'sessoes', 'resultados', 'mural_postits'}


def verificar():
    parser = argparse.ArgumentParser()
    parser.add_argument('--aplicar', action='store_true')
    args = parser.parse_args()
    if not ARQUIVO.is_file():
        raise SystemExit('Banco não encontrado: ' + str(ARQUIVO))
    conexao = sqlite3.connect(ARQUIVO)
    conexao.row_factory = sqlite3.Row
    orfaos = conexao.execute('PRAGMA foreign_key_check').fetchall()
    print(f'{len(orfaos)} vínculos inválidos encontrados.')
    for linha in orfaos:
        print(f"  {linha['table']} / rowid {linha['rowid']} / tabela-pai: {linha['parent']}")
    if not orfaos or not args.aplicar:
        print('Nenhuma alteração. Para reparar os casos conhecidos, execute com --aplicar.')
        conexao.close()
        return
    if any(linha['table'] not in TABELAS_PERMITIDAS for linha in orfaos):
        conexao.close()
        raise SystemExit('Há relações inesperadas; faça avaliação manual antes de reparar.')
    # Backup consistente, realizado pelo próprio SQLite.
    copia = ARQUIVO.with_name(ARQUIVO.stem + '.backup-integridade-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.sqlite')
    destino = sqlite3.connect(copia)
    conexao.backup(destino)
    destino.close()
    print('Backup privado criado:', copia)
    try:
        conexao.execute('PRAGMA foreign_keys = OFF')
        conexao.execute('BEGIN IMMEDIATE')
        conexao.execute("""CREATE TABLE IF NOT EXISTS integridade_orfaos_arquivados (
            id INTEGER PRIMARY KEY, tabela TEXT, rowid_original INTEGER,
            dados_json TEXT, arquivado_em TEXT DEFAULT CURRENT_TIMESTAMP)""")
        for item in orfaos:
            tabela = item['table']
            rowid = item['rowid']
            registro = conexao.execute(f'SELECT * FROM "{tabela}" WHERE rowid = ?', (rowid,)).fetchone()
            if registro is None:
                continue
            conexao.execute('INSERT INTO integridade_orfaos_arquivados (tabela, rowid_original, dados_json) VALUES (?,?,?)',
                            (tabela, rowid, json.dumps(dict(registro), ensure_ascii=False)))
            conexao.execute(f'DELETE FROM "{tabela}" WHERE rowid = ?', (rowid,))
        if conexao.execute('PRAGMA foreign_key_check').fetchall():
            raise RuntimeError('Verificação de integridade ainda encontrou vínculos inválidos.')
        conexao.commit()
        print('Reparo concluído. Linhas órfãs arquivadas no próprio banco e backup preservado.')
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()

if __name__ == '__main__':
    verificar()
