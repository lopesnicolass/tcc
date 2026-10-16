# Tenna — Plataforma de estudos para o Vestibulinho

O **Tenna** é uma aplicação web educacional desenvolvida como Trabalho de Conclusão de Curso (TCC). Reúne conteúdos de estudo, cronograma, calendário, mural, flashcards, simulados, indicadores de desempenho, ranking e o Terrário, além de uma área administrativa.

## Tecnologias e estrutura

- `frontend/`: React 19 e Vite — interface do estudante e da administração.
- `backend/`: Node.js, Express e SQLite — API, autenticação e persistência.
- `frontend/src/terrario/`: componentes e estilos do Terrário.
- `backend/banco/vestibulinho.sqlite`: banco de dados incluído **somente na cópia de demonstração**, quando fornecido.
- `backend/uploads/provas/`: PDFs de provas e gabaritos vinculados aos cadastros, quando fornecidos.
- `frontend/tests/` e `backend/tests/`: testes automatizados.

## Pré-requisitos

- Node.js **22 ou superior** e npm.
- Dois terminais para executar frontend e backend separadamente.

## Configuração para demonstração

Esta versão pode ser entregue com `backend/.env` **já configurado para uso local**, dispensando a criação manual do arquivo. Não são necessários arquivos `.env.example` para seguir estas instruções.

Antes de compartilhar o pacote, confirme que o `.env` utiliza credenciais **exclusivas de demonstração**, sem chaves pessoais ou de produção. Caso o arquivo não esteja presente, solicite ao responsável pelo projeto as configurações locais; não invente valores para serviços externos.

O banco SQLite, se incluído na entrega, deve conter apenas dados fictícios ou autorizados para compartilhamento. Os PDFs de `backend/uploads/provas/` devem corresponder aos registros do banco e ter autorização de distribuição. Não altere os nomes desses arquivos.

## Como executar

Abra um terminal na pasta `backend`:

```bash
cd backend
npm ci
node server.js
```

A API utiliza normalmente a porta **3000**, conforme a configuração local.

Abra outro terminal na pasta `frontend`:

```bash
cd frontend
npm ci
npm run dev
```

Acesse o endereço exibido pelo Vite, normalmente **http://localhost:5173**. Mantenha os dois terminais abertos enquanto usa a aplicação.

> Execute os comandos a partir da pasta raiz do projeto. Se já estiver dentro de `backend` ou `frontend`, não repita o `cd`.

## Testes e compilação

No terminal da pasta `backend`:

```bash
npm test
npm audit
```

No terminal da pasta `frontend`:

```bash
npm test
npm run lint
npm run build
npm audit
```

O build é criado em `frontend/dist/` e pode ser regenerado. As pastas `node_modules/` são recriadas com `npm ci`.

## Integridade do banco

Para verificar o SQLite, a partir da pasta `backend`:

```bash
node scripts/verificar_integridade_banco.cjs
```

A verificação não altera os dados. **Não execute scripts de reparo sem identificar um problema e fazer backup.**

## Observações sobre funcionalidades

- O XP e o ranking oficiais são gerenciados pelo backend.
- No Terrário, sementes, sessões e posições das decorações são armazenadas localmente no navegador e não equivalem ao XP oficial.
- O desbloqueio de salas posteriores do Terrário ainda não está implementado.
- A execução automatizada dos testes não substitui testes funcionais no navegador.

## Cuidados com a entrega

- Não inclua `.git/`, backups privados ou dados pessoais sem autorização.
- Se incluir `backend/.env`, use apenas segredos de demonstração; **não publique esse arquivo em um repositório público**.
- A cópia com banco e PDFs é destinada à demonstração local. Revise as contas e os arquivos antes de compartilhá-la.
- O projeto original de desenvolvimento deve ser mantido separado da cópia enviada à banca.
