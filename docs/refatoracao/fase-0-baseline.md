# Fase 0 — Baseline de execução

## Resumo executivo
O projeto já possui uma arquitetura dominante saudável baseada em rotas finas, services com regra de negócio e validação centralizada, mas o maior risco atual está na complexidade local de alguns arquivos muito grandes e na falta de uma base de testes automatizados visível.

## Baseline do ambiente atual
### Scripts disponíveis em `package.json`
- `build`
- `lint`
- `typecheck`
- scripts Prisma e utilitários de banco

### Lacuna atual
- não há script de `test`
- não foram encontrados sinais claros de suíte `*.test.*` ou `*.spec.*` na análise anterior

## Hotspots priorizados
1. `src/components/dashboard-cardapio-manager.tsx` — ~2088 linhas
2. `src/components/pedido-checkout.tsx` — ~1497 linhas
3. `src/lib/services/whatsapp-service.ts` — ~1317 linhas
4. `src/components/dashboard-orders-workspace.tsx` — ~954 linhas
5. `src/components/dashboard-comandas-workspace.tsx` — ~894 linhas
6. `src/lib/services/order-admin-service.ts` — ~611 linhas

## Padrões já fortes
- rotas finas com `handleRouteError` e `ok`
- services como centro de regra de negócio
- validação via schema na borda
- autenticação explícita
- páginas server-first combinadas com ilhas client

## Contratos críticos mapeados
### 1. Menu público
- **Rota:** `GET /api/menu`
- **Arquivo:** `src/app/api/menu/route.ts`
- **Entrada:** `Request` com rate limit por IP
- **Saída:** `{ categories }`
- **Dependência principal:** `getPublicMenu()`
- **Observação:** já está bem alinhado ao padrão fino de rota

### 2. Cotação de entrega
- **Rota:** `POST /api/delivery-fee/quote`
- **Arquivo:** `src/app/api/delivery-fee/quote/route.ts`
- **Entrada:** `deliveryQuoteSchema`
- **Saída:** objeto `quote` serializado por `ok()`
- **Dependência principal:** `resolveDeliveryFeeRule()`

### 3. Criação de pedido web
- **Rota:** `POST /api/orders`
- **Arquivo:** `src/app/api/orders/route.ts`
- **Entrada:** `createOrderSchema`
- **Dependências:** `requireCustomer()`, `createOrder()`, `buildOrderConfirmationMessage()`
- **Saída:** `{ order }`
- **Risco:** possui resposta manual `403` fora do helper central

### 4. Settings do dashboard
- **Rotas:** `GET/PATCH /api/dashboard/settings`
- **Arquivo:** `src/app/api/dashboard/settings/route.ts`
- **Entrada:** `updateStoreSettingsSchema` no `PATCH`
- **Saída:** payload de settings via service
- **Dependências:** `requireAdmin()`, `getStoreSettings()`, `updateStoreSettings()`

## Sinais claros de duplicação estrutural
### `src/components/pedido-checkout.tsx`
- concentra muitos tipos locais de DTO/response
- mistura helpers, formatação, transformação, estado, chamadas HTTP e renderização
- já contém oportunidade direta para extração de tipos compartilhados e hooks

### `src/components/dashboard-cardapio-manager.tsx`
- concentra tipos locais, normalização de preço, helpers, estado de edição e renderização extensa
- o helper `asNumber()` mostra a necessidade de normalização centralizada de valores

## Estratégia mínima de testes antes de refatorações maiores
### Prioridade 1
- serialização e mapeamento de dados
- cálculos do checkout
- validações e mensagens de erro
- builders/formatters do WhatsApp

### Prioridade 2
- rotas alteradas na Fase 2
- hooks extraídos do checkout
- helpers puros do cardápio

### Regra operacional
- sempre que uma lógica for extraída para função pura, avaliar criação imediata de teste
- não esperar a fase final para começar cobertura

## Riscos registrados
1. regressão em checkout
2. drift entre backend e frontend por DTOs duplicados
3. crescimento de hotspots durante a refatoração se não houver corte por responsabilidade
4. ausência de testes como limitador de velocidade

## Recomendação de execução imediata
Seguir para a Fase 1 e criar uma base compartilhada de DTOs e serialização antes de tocar nos componentes gigantes.
