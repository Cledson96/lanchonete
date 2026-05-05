# Deploy automatico na VPS

Este projeto usa Docker Compose na VPS, Nginx como proxy central e GitHub
Actions para publicar uma imagem no GitHub Container Registry. Depois do setup
inicial, todo push na branch `main` faz deploy automatico.

## 1. Modelo de branches

- `development`: branch de trabalho e validacao.
- `main`: producao.

Fluxo recomendado:

```bash
git switch development
git pull origin development
# trabalhe em feature branches ou direto em development
git push origin development

# quando estiver pronto:
# abra PR de development para main, ou faca merge local e push em main
```

O deploy so roda em push na `main`.

## 2. Secrets do GitHub

Configure em `Settings > Secrets and variables > Actions`:

- `VPS_HOST`: IP ou dominio SSH da VPS.
- `VPS_USER`: usuario SSH da VPS.
- `VPS_SSH_KEY`: chave privada SSH com acesso a VPS.
- `VPS_APP_DIR`: pasta do projeto na VPS, exemplo `/opt/lanchonete`.
- `PRODUCTION_SITE_URL`: URL publica do site, exemplo `https://seudominio.com`.
- `PRODUCTION_WHATSAPP_URL`: link publico do WhatsApp, exemplo `https://wa.me/55...`.

O workflow usa `GITHUB_TOKEN` para publicar em `ghcr.io/cledson96/lanchonete`.

## 3. Preparar a VPS uma vez

Use Ubuntu/Debian recente, aponte o DNS do dominio para o IP da VPS e libere as
portas `80` e `443`. O container do Next.js fica acessivel apenas em
`127.0.0.1:3001`; o Nginx publico da VPS faz o proxy.

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

Clone o repo no caminho usado em `VPS_APP_DIR`:

```bash
sudo mkdir -p /opt/lanchonete
sudo chown "$USER:$USER" /opt/lanchonete
git clone https://github.com/Cledson96/lanchonete.git /opt/lanchonete
cd /opt/lanchonete
git checkout main
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
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`
- `NEXT_PUBLIC_WHATSAPP_URL`
- `STORE_PIX_KEY`

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

## 8. WhatsApp

Depois que o site abrir em `https://seu-dominio`:

1. entre em `/dashboard/login`.
2. acesse `/dashboard/whatsapp`.
3. clique para conectar/gerar QR.
4. escaneie o QR com o WhatsApp Business da loja.

A sessao fica no volume `whatsapp-session`, montado em
`/app/.runtime/whatsapp-session`, e deve sobreviver a deploys e restarts.

## 9. Comandos uteis na VPS

```bash
cd /opt/lanchonete
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app
curl -I http://127.0.0.1:3001
sudo nginx -t
sudo systemctl status nginx
```

Rodar seed manualmente:

```bash
docker compose --env-file .env.production run --rm app npm run prisma:seed
```

Backup do banco instalado no host da VPS:

```bash
pg_dump "$DATABASE_URL" > backup-lanchonete.sql
```
