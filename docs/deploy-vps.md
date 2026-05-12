# Deploy automatico na VPS

Este projeto usa Docker Compose na VPS, Nginx como proxy central e GitHub
Actions para publicar imagens no GitHub Container Registry. Depois do setup
inicial, todo push na branch `main` faz deploy automatico de producao e todo
push na branch `develop` faz deploy automatico do ambiente de desenvolvimento.

## 1. Modelo de branches

- `develop`: branch de trabalho e validacao.
- `main`: producao.

Fluxo recomendado:

```bash
# primeira vez, se a branch ainda nao existir no remoto:
git branch develop main
git push -u origin develop

git switch develop
git pull origin develop
# trabalhe em feature branches ou direto em develop
git push origin develop

# quando estiver pronto:
# abra PR de develop para main, ou faca merge local e push em main
```

O deploy de producao roda em push na `main`. O deploy de desenvolvimento roda
em push na `develop`.

## 2. Secrets do GitHub

Configure em `Settings > Secrets and variables > Actions`:

- `VPS_HOST`: IP ou dominio SSH da VPS.
- `VPS_USER`: usuario SSH da VPS.
- `VPS_SSH_KEY`: chave privada SSH com acesso a VPS.
- `VPS_APP_DIR`: pasta do projeto na VPS, exemplo `/opt/lanchonete`.
- `PRODUCTION_SITE_URL`: URL publica do site, exemplo `https://seudominio.com`.
- `PRODUCTION_WHATSAPP_URL`: link publico do WhatsApp, exemplo `https://wa.me/55...`.
- `DEVELOP_VPS_APP_DIR`: pasta do projeto de desenvolvimento na VPS, exemplo `/opt/lanchonete-develop`.
- `DEVELOP_SITE_URL`: URL publica do ambiente develop, exemplo `https://dev.seudominio.com`.
- `DEVELOP_WHATSAPP_URL`: link publico do WhatsApp usado no ambiente develop.

Os workflows usam `GITHUB_TOKEN` para publicar em `ghcr.io/cledson96/lanchonete`.
As tags usadas sao:

- Producao: `latest` e o SHA do commit.
- Develop: `develop` e `develop-SHA`.

## 3. Preparar a VPS uma vez

Use Ubuntu/Debian recente, aponte o DNS do dominio para o IP da VPS e libere as
portas `80` e `443`. O container do Next.js fica acessivel apenas em
`127.0.0.1:3001`; o Nginx publico da VPS faz o proxy. O worker do WhatsApp roda
apenas na rede interna do Docker Compose.

Instale Docker e Compose:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Saia e entre novamente no SSH para o grupo `docker` valer.

Clone o repo no caminho usado em `VPS_APP_DIR` para producao:

```bash
sudo mkdir -p /opt/lanchonete
sudo chown "$USER:$USER" /opt/lanchonete
git clone https://github.com/Cledson96/lanchonete.git /opt/lanchonete
cd /opt/lanchonete
git checkout main
cp .env.production.example .env.production
```

Clone tambem o repo no caminho usado em `DEVELOP_VPS_APP_DIR` para o ambiente
develop:

```bash
sudo mkdir -p /opt/lanchonete-develop
sudo chown "$USER:$USER" /opt/lanchonete-develop
git clone https://github.com/Cledson96/lanchonete.git /opt/lanchonete-develop
cd /opt/lanchonete-develop
git checkout develop
cp .env.production.example .env.production
```

Se a imagem do GHCR estiver privada, faca login na VPS:

```bash
docker login ghcr.io
```

## 4. Configurar `.env.production`

Edite `/opt/lanchonete/.env.production` e troque, no minimo:

- `APP_IMAGE=ghcr.io/cledson96/lanchonete:latest`
- `APP_HOST_PORT=127.0.0.1:3001`
- `DATABASE_URL`
- `APP_AUTH_SECRET`
- `WHATSAPP_WORKER_TOKEN`
- `WHATSAPP_INTERNAL_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`
- `NEXT_PUBLIC_WHATSAPP_URL`
- `STORE_PIX_KEY`

Edite tambem `/opt/lanchonete-develop/.env.production` para o ambiente develop.
Use, no minimo:

- `APP_IMAGE=ghcr.io/cledson96/lanchonete:develop`
- `APP_HOST_PORT=127.0.0.1:3002`
- `DATABASE_URL` apontando para um banco separado de desenvolvimento.
- `APP_AUTH_SECRET` diferente do segredo de producao.
- `WHATSAPP_WORKER_TOKEN` e `WHATSAPP_INTERNAL_WEBHOOK_SECRET` proprios de develop.
- `NEXT_PUBLIC_SITE_URL` com a URL de develop.
- `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD` de desenvolvimento.
- `NEXT_PUBLIC_WHATSAPP_URL` de desenvolvimento.
- `STORE_PIX_KEY` de desenvolvimento.

Gere um segredo forte:

```bash
openssl rand -base64 32
```

Se o Postgres estiver instalado direto no host da VPS, use
`host.docker.internal` no `DATABASE_URL`, por exemplo:

```env
DATABASE_URL=postgresql://lanchonete_app:SENHA@host.docker.internal:5432/lanchonete_prod?schema=public
```

O `docker-compose.yml` ja inclui `host.docker.internal:host-gateway` para esse
acesso funcionar de dentro do container.

## 5. Configurar Nginx

Instale Nginx e Certbot, se ainda nao estiverem instalados:

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Crie o site do subdominio:

```bash
sudo nano /etc/nginx/sites-available/lanchonete.cledson.com.br
```

Conteudo:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name lanchonete.cledson.com.br;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Ative e valide:

```bash
sudo ln -s /etc/nginx/sites-available/lanchonete.cledson.com.br /etc/nginx/sites-enabled/lanchonete.cledson.com.br
sudo nginx -t
sudo systemctl reload nginx
```

Depois que o DNS `lanchonete.cledson.com.br` apontar para a VPS, emita HTTPS:

```bash
sudo certbot --nginx -d lanchonete.cledson.com.br
```

Para o ambiente develop, crie outro site Nginx apontando para a porta definida
em `APP_HOST_PORT`, por exemplo `127.0.0.1:3002`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name dev.lanchonete.cledson.com.br;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Depois que o DNS do subdominio develop apontar para a VPS, emita HTTPS:

```bash
sudo certbot --nginx -d dev.lanchonete.cledson.com.br
```

## 6. Primeiro deploy

Depois que o primeiro push na `main` publicar a imagem, rode uma vez na VPS:

```bash
cd /opt/lanchonete
docker compose --env-file .env.production pull app
docker compose --env-file .env.production run --rm app npx prisma migrate deploy
docker compose --env-file .env.production run --rm app npm run prisma:seed
docker compose --env-file .env.production up -d
```

O seed nao roda automaticamente nos deploys seguintes para nao mexer em dados
operacionais sem intencao.

O app deve responder localmente em:

```bash
curl -I http://127.0.0.1:3001
```

Depois que o primeiro push na `develop` publicar a imagem, rode uma vez na VPS:

```bash
cd /opt/lanchonete-develop
docker compose --env-file .env.production pull app
docker compose --env-file .env.production run --rm app npx prisma migrate deploy
docker compose --env-file .env.production run --rm app npm run prisma:seed
docker compose --env-file .env.production up -d
```

O app develop deve responder localmente em:

```bash
curl -I http://127.0.0.1:3002
```

## 7. Deploys automaticos

Em todo push na `main`, o GitHub Actions:

1. roda lint, typecheck, Prisma validate e build.
2. builda a imagem Docker com as URLs publicas de producao.
3. publica `ghcr.io/cledson96/lanchonete:latest` e `:SHA`.
4. entra na VPS por SSH.
5. atualiza o clone para `main`.
6. roda `docker compose pull app`.
7. roda `npx prisma migrate deploy`.
8. roda `docker compose up -d`.

O Nginx continua rodando no host e aponta sempre para `127.0.0.1:3001`.

Para acompanhar, abra `Actions > Deploy production` no GitHub.

Em todo push na `develop`, o GitHub Actions:

1. roda lint, typecheck, Prisma validate e build.
2. builda a imagem Docker com as URLs publicas de develop.
3. publica `ghcr.io/cledson96/lanchonete:develop` e `:develop-SHA`.
4. entra na VPS por SSH.
5. atualiza o clone para `develop`.
6. roda `docker compose pull app`.
7. roda `npx prisma migrate deploy`.
8. roda `docker compose up -d`.

O Nginx do ambiente develop deve apontar para `127.0.0.1:3002`, ou para a
porta configurada em `APP_HOST_PORT` no `.env.production` desse ambiente.

Para acompanhar, abra `Actions > Deploy develop` no GitHub.

## 8. WhatsApp

Depois que o site abrir em `https://seu-dominio`:

1. entre em `/dashboard/login`.
2. acesse `/dashboard/whatsapp`.
3. clique para conectar/gerar QR.
4. escaneie o QR com o WhatsApp Business da loja.

A sessao fica no volume `whatsapp-session`, montado em
`/app/.runtime/whatsapp-session`, e deve sobreviver a deploys e restarts.

## 9. Uploads do cardapio

As imagens enviadas pelo dashboard para itens do cardapio ficam em
`/app/public/uploads/menu` dentro do container. O Docker Compose monta essa pasta
no volume persistente `menu-uploads`, entao deploys, pulls de imagem e restarts
nao apagam os uploads.

Para listar volumes:

```bash
docker volume ls | grep lanchonete
```

## 10. Comandos uteis na VPS

```bash
cd /opt/lanchonete
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app
curl -I http://127.0.0.1:3001
sudo nginx -t
sudo systemctl status nginx
```

Comandos uteis do ambiente develop:

```bash
cd /opt/lanchonete-develop
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app
curl -I http://127.0.0.1:3002
sudo nginx -t
sudo systemctl status nginx
```

Rodar seed manualmente:

```bash
docker compose --env-file .env.production run --rm app npm run prisma:seed
```

Popular o banco develop com uma copia atual de producao:

```bash
cd /opt/lanchonete-develop
SOURCE_ENV=/opt/lanchonete/.env.production \
TARGET_ENV=/opt/lanchonete-develop/.env.production \
CONFIRM_COPY_PROD_TO_DEVELOP=1 \
bash ./scripts/db/copy-prod-to-develop-db.sh
```

Esse comando apaga e recria o schema `public` do banco de develop antes de
restaurar os dados de producao. Nao rode apontando `TARGET_ENV` para producao.

Backup do banco instalado no host da VPS:

```bash
pg_dump "$DATABASE_URL" > backup-lanchonete.sql
```
