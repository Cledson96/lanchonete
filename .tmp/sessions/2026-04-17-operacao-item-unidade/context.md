# Task Context: Operação por item/unidade

Session ID: 2026-04-17-operacao-item-unidade
Created: 2026-04-17T00:00:00Z
Status: in_progress

## Current Request
O usuário quer que a cozinha mova o kanban por item/unidade, não pela comanda inteira. A visão da comanda/pedido deve sinalizar quando todos os itens estiverem prontos, e no presencial deve ser possível saber se cada item já foi entregue ao cliente, inclusive com entregas parciais.

## Context Files (Standards to Follow)
- /home/cledson/.opencode/context/core/standards/code-quality.md
- /home/cledson/.opencode/context/core/workflows/feature-breakdown.md

## Reference Files (Source Material to Look At)
- /home/cledson/projetos/lanchonete/PROJETO.md
- /home/cledson/projetos/lanchonete/docs/modelo-dados.md
- /home/cledson/projetos/lanchonete/prisma/schema.prisma
- /home/cledson/projetos/lanchonete/src/lib/services/order-service.ts
- /home/cledson/projetos/lanchonete/src/lib/services/comanda-service.ts
- /home/cledson/projetos/lanchonete/src/lib/services/order-admin-service.ts
- /home/cledson/projetos/lanchonete/src/components/dashboard-orders-workspace.tsx
- /home/cledson/projetos/lanchonete/src/components/dashboard-order-detail-sheet.tsx

## External Docs Fetched
- Nenhuma

## Components
- Modelagem operacional por unidade de item
- Persistência na criação de pedidos/comandas
- Agregação de status para pedido/comanda
- Kanban da cozinha por item movimentável
- Sinalização de pronto/entregue na visão de comanda

## Constraints
- Manter o fluxo atual de pedidos/comandas funcionando
- Permitir entrega parcial no presencial
- Delivery continua precisando de visão agregada do pedido completo
- Implementar incrementalmente e validar a cada etapa

## Exit Criteria
- [ ] Cada unidade de item possui estado operacional próprio
- [ ] A cozinha consegue mover itens/unidades no kanban
- [ ] Pedido/comanda mostra pronto parcial/total por agregação
- [ ] Comanda presencial distingue itens já entregues ao cliente
- [ ] Typecheck passa após as mudanças
