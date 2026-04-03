# Plano da Plataforma da Lanchonete

## Resumo
Construir uma aplicacao fullstack em `Next.js` na versao mais recente com `TypeScript`, usando `PostgreSQL` como banco principal e um unico projeto com tres frentes integradas: landing page com cardapio e pedidos, dashboard operacional com visoes por etapa, e integracao completa com WhatsApp para entrada e atualizacao de pedidos.

Documento alvo para registrar este plano no repositorio: `docs/plano-lanchonete-v1.md`.

A v1 cobre:
- Cardapio publico com categorias como lanches, sucos, adicionais e combos.
- Pedido pelo site com conta de cliente.
- Pedido automatizado pelo WhatsApp.
- Consumo no local com comanda aberta por QR code.
- Dashboard unico com visoes de atendimento, cozinha, entrega, caixa e administracao.
- Sem pagamento online; o sistema calcula total, registra forma de pagamento manual e fecha a venda no atendimento.

## Mudancas e Arquitetura
### Stack e estrutura
- Usar `Next.js` App Router com runtime Node, `TypeScript`, `Prisma` e `PostgreSQL`.
- Centralizar frontend e backend no mesmo app para reduzir complexidade inicial.
- Adotar `Auth.js` com login por `email + senha`, exigindo `telefone` no cadastro do cliente.
- Usar `Meta WhatsApp Cloud API` para webhook de mensagens recebidas e envio de mensagens transacionais.

### Modulos principais
- Landing page publica em `/` com hero, cardapio por categorias, destaques, horario, taxa/area de entrega e CTA para pedir no site ou WhatsApp.
- Fluxo web em `/pedido` para delivery e retirada, com carrinho, adicionais, observacoes, endereco e resumo do pedido.
- Fluxo de comanda em `/comanda/[slug]` acessado por QR code; cliente entra na sua comanda, adiciona itens ao longo do tempo e acompanha total parcial.
- Dashboard em `/dashboard` com login interno e visoes por aba:
  - Atendimento: novos pedidos, validacao, aceite e contato com cliente.
  - Cozinha/Balcao: fila de preparo em tempo real, ordenada por prioridade e canal.
  - Entrega: pedidos prontos, saida para entrega e conclusao.
  - Caixa/Comandas: comandas abertas, total acumulado, fechamento manual.
  - Admin: CRUD de cardapio, categorias, adicionais, disponibilidade, horarios e configuracoes.
- Integracao WhatsApp:
  - Entrada: bot guiado coleta canal, itens, quantidade, adicionais, endereco e confirma o pedido.
  - Saida: ao marcar `aceito`, enviar mensagem dizendo que o pedido esta em preparo; ao marcar `saiu para entrega`, enviar nova mensagem ao cliente.
  - Mesmo catalogo e regras do site devem alimentar o bot do WhatsApp para evitar divergencia.

### Modelo de dominio
- `User`: contas internas e clientes, com `role` em `admin | atendimento | cozinha | entrega | caixa | cliente`.
- `CustomerProfile`: telefone, nome, enderecos, historico e opt-in de WhatsApp.
- `Category`, `MenuItem`, `OptionGroup`, `OptionItem`: estrutura do cardapio editavel.
- `Order`: pedido principal com `channel` em `web | whatsapp | local`, `type` em `delivery | retirada | local`, status e totais.
- `OrderItem`: itens, adicionais, quantidade, observacoes e subtotal congelado no momento do pedido.
- `Comanda`: conta aberta do consumo no local, ligada a QR code e a um cliente opcional.
- `ComandaEntry`: cada adicao de item na comanda, com total acumulado e ligacao ao envio para cozinha.
- `Address`: endereco de entrega do cliente.
- `OrderStatusEvent`: trilha auditavel de mudancas de status.
- `WhatsAppConversation` e `WhatsAppMessage`: estado da conversa automatizada, mensagens recebidas/enviadas e correlacao com pedido.

### Regras operacionais
- Status padrao do pedido: `novo`, `aceito`, `em_preparo`, `pronto`, `saiu_para_entrega`, `entregue`, `fechado`, `cancelado`.
- Pedido local em comanda nao fecha a venda a cada item; acumula valor e mostra parcial para cliente e caixa.
- Cada adicao na comanda gera evento para cozinha/balcao sem perder o total consolidado da comanda.
- Pedido via WhatsApp e via site entram na mesma fila operacional.
- Menu indisponivel ou item pausado precisa refletir na landing, no checkout e no bot do WhatsApp.
- Pagamento permanece fora da plataforma na v1; registrar apenas `forma_prevista` e `status_manual_pagamento` para fechamento interno.

## APIs, Interfaces e Comportamentos Publicos
- Rotas publicas:
  - `/`
  - `/pedido`
  - `/comanda/[slug]`
  - `/login`
  - `/cadastro`
- Rotas internas:
  - `/dashboard`
  - `/dashboard/pedidos`
  - `/dashboard/comandas`
  - `/dashboard/cardapio`
- APIs principais:
  - `POST /api/orders` para criar pedido web.
  - `POST /api/comandas/:id/items` para adicionar itens na comanda.
  - `POST /api/dashboard/orders/:id/status` para transicao operacional de status.
  - `GET/POST/PATCH /api/menu/*` para CRUD do cardapio.
  - `POST /api/whatsapp/webhook` para eventos recebidos do WhatsApp.
- Contratos importantes:
  - `OrderChannel = 'web' | 'whatsapp' | 'local'`
  - `OrderType = 'delivery' | 'retirada' | 'local'`
  - `OrderStatus = 'novo' | 'aceito' | 'em_preparo' | 'pronto' | 'saiu_para_entrega' | 'entregue' | 'fechado' | 'cancelado'`
- Atualizacao do dashboard:
  - Implementar refresh quase em tempo real com polling curto na v1.
  - Manter a logica preparada para evoluir depois para websocket/SSE sem reescrever o dominio.

## Plano de Entrega e Testes
### Fases sugeridas
1. Fundacao: bootstrap do projeto, banco, autenticacao, layout base e dominio do cardapio.
2. Canal web: landing page, checkout, cadastro/login, criacao de pedidos e fila interna.
3. Operacao interna: dashboard por visoes, mudanca de status, comandas e fechamento.
4. WhatsApp: webhook, bot guiado, criacao de pedidos e mensagens automaticas de status.
5. Refino de producao: autorizacao por role, auditoria, logs, tratamento de falhas e hardening.

### Testes obrigatorios
- Cadastro/login de cliente com telefone obrigatorio.
- Navegacao do cardapio e atualizacao do carrinho com adicionais.
- Criacao de pedido web para delivery e retirada.
- Criacao e continuidade de comanda por QR code, incluindo multiplas adicoes e total acumulado.
- Aceite de pedido no dashboard disparando mensagem de `em preparo` no WhatsApp.
- Mudanca para `saiu_para_entrega` disparando mensagem correta no WhatsApp.
- Conversa automatizada no WhatsApp convertendo selecao de itens em pedido real.
- CRUD de cardapio refletindo imediatamente em landing, checkout e bot.
- Controle de acesso por role no dashboard.
- Calculo de subtotal, taxa, total e fechamento de comanda sem pagamento online.

## Assuncoes e Defaults
- Banco definido: `PostgreSQL`.
- ORM escolhido: `Prisma`.
- Integracao de WhatsApp: `Meta WhatsApp Cloud API`.
- Conta de cliente: `email + senha`, com `telefone` obrigatorio para vinculo com WhatsApp.
- Atendimento local: `comanda aberta por QR code`.
- Producao interna na v1: `fila em tela no dashboard`, sem impressora.
- Entrega na v1: atualizacao manual pela equipe, sem rastreamento em mapa.
- Pagamento online fica fora do escopo inicial; o objetivo da v1 e capturar, organizar e acompanhar pedidos de ponta a ponta.
