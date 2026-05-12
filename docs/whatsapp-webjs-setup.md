# WhatsApp Worker Setup

## Variaveis de ambiente
- `WHATSAPP_SESSION_PATH`: pasta local da sessao persistida do Baileys.
- `WHATSAPP_CLIENT_NAME`: nome da sessao persistida.
- `WHATSAPP_ALLOWED_COUNTRY_CODE`: DDI permitido, default `55`.
- `WHATSAPP_BOT_ENABLED`: liga ou desliga o bot de atendimento.
- `WHATSAPP_AUTO_START`: sobe o worker tentando restaurar a sessao automaticamente.
- `WHATSAPP_WORKER_URL`: URL interna usada pelo app para falar com o worker.
- `WHATSAPP_WORKER_TOKEN`: token Bearer do app para o worker.
- `WHATSAPP_INTERNAL_WEBHOOK_SECRET`: segredo do worker para publicar eventos no app.

## Arquitetura
- `app`: Next.js, dashboard, banco e regras de negocio.
- `whatsapp-worker`: processo Node dedicado rodando Baileys sem Chromium.
- comunicacao interna por HTTP com token e webhook assinado.

## Fluxo de conexao
1. entrar no dashboard em `/dashboard/whatsapp`
2. clicar em `Conectar / gerar QR`
3. escanear o QR com o WhatsApp Business da loja
4. aguardar o status `conectado`

## O que funciona nessa v1
- envio de OTP do checkout pelo worker Baileys
- mensagens automaticas de status do pedido
- inbox simples no dashboard
- bot textual de pedido pelo WhatsApp

## Observacoes
- a sessao fica persistida em disco local
- o app e o worker podem reiniciar separadamente sem Chromium
- nao e indicada para ambiente serverless
