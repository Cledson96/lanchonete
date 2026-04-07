# WhatsApp Web.js Setup

## Variaveis de ambiente
- `WHATSAPP_SESSION_PATH`: pasta local da sessao do WhatsApp Web.
- `WHATSAPP_HEADLESS`: `true` para rodar sem abrir navegador no servidor.
- `WHATSAPP_CLIENT_NAME`: nome da sessao persistida.
- `WHATSAPP_ALLOWED_COUNTRY_CODE`: DDI permitido, default `55`.
- `WHATSAPP_BOT_ENABLED`: liga ou desliga o bot de atendimento.

## Dependencias de servidor
O VPS Linux precisa de Chromium/Chrome e bibliotecas de runtime compatíveis com Puppeteer.

## Fluxo de conexao
1. entrar no dashboard em `/dashboard/whatsapp`
2. clicar em `Conectar / gerar QR`
3. escanear o QR com o WhatsApp Business da loja
4. aguardar o status `conectado`

## O que funciona nessa v1
- envio de OTP do checkout pelo WhatsApp Web
- mensagens automaticas de status do pedido
- inbox simples no dashboard
- bot textual de pedido pelo WhatsApp

## Observacoes
- a sessao fica persistida em disco local
- a arquitetura atual foi pensada para um unico processo Node em VPS
- nao e indicada para ambiente serverless
