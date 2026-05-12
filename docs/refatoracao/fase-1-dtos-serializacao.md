# Fase 1 — DTOs e serialização

**Status:** concluída

## Objetivo
Criar a base compartilhada de contratos e serialização para reduzir duplicação entre backend, rotas e frontend antes da modularização dos hotspots.

## Dependências
- `fase-0-preparacao.md`
- `fase-0-baseline.md`

## Arquivos-alvo iniciais
- `src/components/pedido-checkout.tsx`
- `src/components/dashboard-cardapio-manager.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/menu/route.ts`
- `src/app/api/dashboard/settings/route.ts`
- `src/lib/services/order-service.ts`
- `src/lib/services/store-settings-service.ts`

## Entregas esperadas
- camada compartilhada de DTOs por domínio
- normalização `Decimal -> number` centralizada
- redução de tipos locais repetidos nos componentes-alvo

## Resultado executado
- contratos compartilhados para checkout, store e cardápio público
- serializers dedicados para checkout, delivery, store settings e cardápio
- helpers compartilhados para coerção numérica e precificação de itens
- primeiros consumidores migrados em rotas, checkout, comanda, home pública e página de sucesso

## Subetapas
### 1.1 Mapear contratos por domínio
- cardápio
- pedidos/checkout
- settings

### 1.2 Definir módulos compartilhados
- tipos públicos reutilizáveis
- serializers/mappers por domínio

### 1.3 Migrar primeiros consumidores
- rotas com payload previsível
- componentes com tipos locais duplicados

## Critérios de aceite
- não haver novo tipo local duplicado para os contratos principais
- normalização de número centralizada em utilitário ou serializer dedicado
- build lógico preservado nas rotas alteradas

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: centralize shared DTOs and serialization`
