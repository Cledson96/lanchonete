# Banco de dados local e remoto

## O que foi configurado nesta maquina
- PostgreSQL 16 em espaco de usuario, sem instalacao global.
- Cluster local em `~/.local/share/lanchonete-postgres/data`.
- Porta local `54329`.
- Usuario de aplicacao `lanchonete_app`.
- Banco local `lanchonete_dev`.
- Autenticacao TCP local em `127.0.0.1` usando `scram-sha-256`.
- O usuario local recebe `CREATEDB` para o Prisma conseguir criar o shadow database temporario durante `prisma migrate dev`.

## Caminhos locais
- Binarios: `~/.local/opt/postgresql-16/usr/lib/postgresql/16/bin`
- Dados: `~/.local/share/lanchonete-postgres/data`
- Socket: `~/.local/share/lanchonete-postgres/socket`
- Log: `~/.local/share/lanchonete-postgres/postgres.log`
- Senha do usuario da aplicacao: `~/.local/share/lanchonete-postgres/lanchonete_app.password`

## Scripts do repositorio
- `./scripts/db/install-postgres-local.sh`: baixa e extrai os binarios locais do PostgreSQL 16.
- `./scripts/db/init-local-cluster.sh`: inicializa o cluster, cria usuario local e banco `lanchonete_dev`.
- `./scripts/db/start-local-db.sh`: sobe o banco local.
- `./scripts/db/stop-local-db.sh`: para o banco local.
- `./scripts/db/status-local-db.sh`: mostra status e caminhos usados.
- `./scripts/db/psql-local.sh [database]`: abre um `psql` autenticado.
- `./scripts/db/smoke-test-local-db.sh`: cria, lista e remove um registro de smoke test.
- `./scripts/db/print-env.sh`: imprime as variaveis locais prontas para um `.env.local`.

## Fluxo recomendado
1. Rodar `./scripts/db/install-postgres-local.sh` em uma maquina nova.
2. Rodar `./scripts/db/init-local-cluster.sh`.
3. Gerar o arquivo local com `./scripts/db/print-env.sh > .env.local`.
4. Validar com `./scripts/db/smoke-test-local-db.sh`.
5. Rodar `npx prisma migrate dev` sempre apontando para `DATABASE_URL` local.

## Neon
- O projeto remoto planejado se chama `lanchonete`.
- A criacao do projeto na Neon nao foi automatizada porque esta maquina nao tem credenciais da Neon configuradas.
- Para eu integrar a Neon aqui, preciso de:
  - `DATABASE_REMOTE_URL`: a URL pooled da Neon para o runtime da aplicacao.
  - `DIRECT_DATABASE_REMOTE_URL`: a URL direta da Neon para o Prisma CLI e migrations.
- Se voce quiser que eu crie branches ou automatize algo pela API da Neon, tambem preciso de um `NEON_API_KEY`.
- Use a branch `main` da Neon como ambiente remoto compartilhado e crie branches temporarias para validar migracoes e testes destrutivos.
- Em desenvolvimento local, `DATABASE_URL` continua apontando para o PostgreSQL local.
- Em producao, a aplicacao deve usar a URL da Neon como `DATABASE_URL`.
- No Prisma 7, a URL usada pelo CLI fica em `prisma.config.ts`. Por enquanto o projeto usa `DATABASE_URL` local para modelagem e migracoes no dev.
- Como o projeto ainda nao tem dependencias Node instaladas, os comandos do Prisma devem ser executados com o ambiente carregado no shell, por exemplo `set -a && source .env.local && set +a`.
- Quando formos rodar migracoes ou comandos do Prisma contra a Neon, podemos apontar `DATABASE_URL` para a URL direta da Neon naquele contexto.
