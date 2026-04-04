# Modelo de dados inicial

Este documento resume o primeiro desenho do banco em `prisma/schema.prisma`.

## Blocos principais
- `User` e `CustomerProfile`: separam conta de acesso dos dados do cliente.
- `Address`: enderecos de entrega do cliente.
- `Category`, `MenuItem`, `OptionGroup` e `OptionItem`: estrutura do cardapio.
- `Order`, `OrderItem` e `OrderItemOption`: pedidos web, WhatsApp e retirada.
- `Comanda`, `ComandaEntry` e `ComandaEntryOption`: consumo no local com acumulado por comanda.
- `OrderStatusEvent`: historico de mudancas de status do pedido.
- `WhatsAppConversation` e `WhatsAppMessage`: trilha da conversa automatizada.

## Decisoes importantes
- `User.role` cobre perfis internos e cliente.
- `CustomerProfile.phone` e unico para facilitar vinculo com WhatsApp.
- Valores financeiros usam `Decimal(10,2)`.
- `Order` e `Comanda` mantem totais consolidados, enquanto itens e entradas guardam o valor congelado no momento do lancamento.
- O cardapio usa relacao explicita entre `MenuItem` e `OptionGroup`, permitindo reutilizar grupos de adicionais em varios itens.
- O Prisma vai apontar para `DATABASE_URL` no local e usar `DIRECT_DATABASE_REMOTE_URL` quando precisarmos migrar contra a Neon.

## O que ainda pode evoluir
- Tabelas do Auth.js, quando implementarmos login de fato.
- Regras mais detalhadas de entrega, horario e taxa por regiao.
- Separacao futura de status de comanda, caso o fluxo local precise divergir bastante do fluxo de pedido.
