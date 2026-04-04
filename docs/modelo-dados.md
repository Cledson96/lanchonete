# Modelo de dados inicial

Este documento resume o primeiro desenho do banco em `prisma/schema.prisma`.

## Blocos principais
- `User` e `CustomerProfile`: separam conta de acesso dos dados do cliente.
- `Address`: enderecos de entrega do cliente.
- `DeliveryFeeRule`: regras de frete por regiao para entrega.
- `Category`, `MenuItem`, `OptionGroup` e `OptionItem`: estrutura do cardapio.
- `Order`, `OrderItem` e `OrderItemOption`: pedidos web, WhatsApp e retirada.
- `Comanda`, `ComandaEntry` e `ComandaEntryOption`: consumo no local com acumulado por comanda.
- `OrderStatusEvent`: historico de mudancas de status do pedido.
- `WhatsAppConversation` e `WhatsAppMessage`: trilha da conversa automatizada.

## Decisoes importantes
- `User.role` cobre perfis internos e cliente.
- `CustomerProfile` pode existir sem `User`, para permitir cliente identificado apenas por telefone.
- `CustomerProfile.phone` e unico para facilitar vinculo com WhatsApp e busca do cliente pelo numero.
- Valores financeiros usam `Decimal(10,2)`.
- `Order` e `Comanda` mantem totais consolidados, enquanto itens e entradas guardam o valor congelado no momento do lancamento.
- `Order` guarda `customerName` e `customerPhone` como snapshot historico do momento da compra.
- `Order.deliveryFeeRuleId` aponta para a regra de frete aplicada quando o pedido for entrega.
- O cardapio usa relacao explicita entre `MenuItem` e `OptionGroup`, permitindo reutilizar grupos de adicionais em varios itens.
- O Prisma vai apontar para `DATABASE_URL` no local e usar `DIRECT_DATABASE_REMOTE_URL` quando precisarmos migrar contra a Neon.

## O que ainda pode evoluir
- Tabelas do Auth.js, quando implementarmos login de fato.
- Regras mais detalhadas de entrega, horario e taxa por faixa de CEP, se quisermos sofisticar o frete.
- Separacao futura de status de comanda, caso o fluxo local precise divergir bastante do fluxo de pedido.
