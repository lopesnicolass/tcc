# Tenna — projeto de estudos para o Vestibulinho

Aplicação web educacional desenvolvida como projeto de conclusão de curso (TCC). Possui área do estudante, conteúdos, cronograma, calendário, mural, flashcards, simulados, desempenho, ranking e Terrário; inclui administração dos materiais.

## Estrutura

- `frontend/` — React 19 + Vite, telas e componentes.
- `backend/` — Node.js + Express, API e SQLite.
- `frontend/src/terrario/` — Terrário, com cenários e decorações originais.
- `backend/scripts/` — scripts de manutenção do banco e conteúdos.
- `scripts/limpeza_local.cjs` — limpeza **opcional**, com prévia antes de remover arquivos.

## Pré-requisitos

Node.js 22 ou superior e npm. Os comandos devem ser executados em dois terminais separados.

## 1. Configuração inicial

1. Na pasta `backend`, copie `.env.example` para `.env`, mantendo `.env` **somente no seu computador**.
2. Configure `JWT_SECRET` privado e aleatório com pelo menos 32 caracteres. Ajuste `PORT` e `FRONTEND_URL` se necessário.
3. A recuperação de senha por e-mail exige `RESEND_API_KEY` e `EMAIL_FROM` válidos.
4. O frontend usa `http://localhost:3000` por padrão; `frontend/.env.example` documenta `VITE_API_URL` para outro endereço.

O arquivo `backend/banco/vestibulinho.sqlite` **não vem no ZIP público**: contém contas e informações locais. O sistema pode criar um banco novo, mas para apresentar conteúdos e dados existentes use uma cópia privada do seu banco de demonstração no caminho acima. Faça backup antes de atualizar a aplicação.

PDFs enviados ao sistema também **não vêm no ZIP público**. Se precisar abrir provas e gabaritos já cadastrados, preserve em sua instalação privada os arquivos de `backend/uploads/provas/` correspondentes às referências existentes no banco.

## 2. Execução

No primeiro terminal:

```bash
cd backend
npm ci
node server.js
```

No segundo terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra o endereço informado pelo Vite (normalmente `http://localhost:5173`). API: `http://localhost:3000`.

## 3. Testes e build

```bash
cd backend
npm test
npm audit
```

```bash
cd frontend
npm test
npm run lint
npm run build
npm audit
```

`frontend/dist/` é recriada pelo build e não deve ser versionada. O teste de ranking agora roda junto com os testes Node.js do backend, sem necessidade de Python.

## 4. Limpeza local (opcional)

Da raiz do projeto:

```bash
node scripts/limpeza_local.cjs
node scripts/limpeza_local.cjs --aplicar
```

O primeiro comando mostra uma **prévia** e o segundo remove apenas a lista conhecida de arquivos redundantes da versão revisada. Para remover também o build gerado, adicione `--incluir-build`. A rotina não altera `.git`, `.env`, bancos, backups nem uploads.

## 5. Integridade do banco

**Pare o servidor e faça backup antes de qualquer reparo.** Da pasta `backend`:

```bash
node scripts/verificar_integridade_banco.cjs
```

O script de reparo `reparar_integridade_banco.cjs --aplicar` é reservado para ocorrências confirmadas de registros órfãos e cria um backup próprio. Não o execute apenas como parte do processo de instalação.

## 6. Observações para a banca

- O XP e o ranking oficiais são gerenciados no backend.
- No Terrário atual, **sementes, sessões e posições das decorações são armazenadas localmente no navegador**. São independentes do XP oficial e ainda não têm persistência no backend.
- O desbloqueio das salas posteriores do Terrário ainda não está implementado.
- O projeto precisa de testes reais de integração, acessibilidade e configuração do ambiente antes de publicação externa.

## 7. Segurança no compartilhamento

Não compartilhe `.env`, a pasta `.git`, o banco de usuários, backups ou arquivos pessoais. O `.gitignore` previne adições futuras, mas arquivos sensíveis já incluídos no histórico Git exigem revisão do histórico e substituição das credenciais que tenham sido expostas.
