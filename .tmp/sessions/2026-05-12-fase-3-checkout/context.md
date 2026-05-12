# Task Context: Fase 3 — Checkout

Session ID: 2026-05-12-fase-3-checkout
Created: 2026-05-12T00:00:00Z
Status: in_progress

## Current Request
Iniciar a Fase 3 do plano de refatoração, reduzindo a complexidade do checkout com extração incremental de lógica pura, hooks e blocos de UI menores, sem mudar o comportamento do usuário.

## Context Files (Standards to Follow)
- C:\Users\user\.config\opencode\context\core\standards\code-quality.md
- C:\Users\user\.config\opencode\context\ui\web\react-patterns.md
- C:\Users\user\.config\opencode\context\core\workflows\feature-breakdown.md
- C:\Users\user\.config\opencode\context\core\standards\test-coverage.md
- C:\Users\user\.config\opencode\context\core\standards\code-analysis.md

## Reference Files (Source Material to Look At)
- docs\refatoracao\fase-3-checkout.md
- src\components\pedido-checkout.tsx
- src\lib\checkout-ui.ts
- src\lib\contracts\checkout.ts
- src\lib\utils.ts
- src\lib\cart-store.tsx
- src\app\api\orders\route.ts
- src\app\api\customer\me\route.ts
- src\app\api\customer\verification\request\route.ts
- src\app\api\customer\verification\confirm\route.ts
- src\app\api\zip-code\lookup\route.ts
- src\app\api\delivery-fee\quote\route.ts

## External Docs Fetched
- Nenhuma; o recorte é interno e orientado pelos padrões do projeto.

## Components
- Pedido checkout component
- Checkout pure helpers
- Checkout async flows (próximos recortes)
- Checkout UI blocks (próximos recortes)

## Constraints
- Não mudar contratos HTTP nem comportamento visível do fluxo
- Extrair primeiro apenas lógica pura de baixo risco
- Validar com `npm run typecheck` e `npm run lint`
- Commitar e publicar cada recorte

## Exit Criteria
- [ ] Helpers puros do topo de `pedido-checkout.tsx` saem para módulo dedicado
- [ ] `pedido-checkout.tsx` passa a consumir o módulo extraído sem regressão
- [ ] Typecheck e lint passam após o recorte
- [ ] Mudanças do recorte são commitadas e publicadas
