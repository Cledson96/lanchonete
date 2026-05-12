# Task Context: Fase 2 — Ajustes arquiteturais

Session ID: 2026-05-12-fase-2-ajustes-arquiteturais
Created: 2026-05-12T00:00:00Z
Status: in_progress

## Current Request
Iniciar a Fase 2 do plano de refatoração, removendo acesso direto ao Prisma em rota, padronizando respostas HTTP manuais e alinhando tratamento de erro nas rotas fora do padrão.

## Context Files (Standards to Follow)
- C:\Users\user\.config\opencode\context\core\standards\code-quality.md
- C:\Users\user\.config\opencode\context\development\principles\api-design.md
- C:\Users\user\.config\opencode\context\core\workflows\component-planning.md
- C:\Users\user\.config\opencode\context\development\principles\clean-code.md
- C:\Users\user\.config\opencode\context\core\workflows\code-review.md

## Reference Files (Source Material to Look At)
- docs\refatoracao\fase-2-ajustes-arquiteturais.md
- docs\plano-refatoracao-faseada.md
- src\lib\http.ts
- src\app\api\menu\items\image\route.ts
- src\app\api\orders\route.ts
- src\app\api\customer\lookup\route.ts
- src\app\api\orders\[code]\route.ts
- src\app\api\menu\items\route.ts
- src\lib\services\menu-admin-service.ts
- src\lib\menu-images.ts
- src\lib\services\customer-service.ts

## External Docs Fetched
- Nenhuma doc externa necessária até agora; o recorte é coberto pelos padrões internos e pelo código atual do projeto.

## Components
- API routes
- Menu admin service
- HTTP error/response helpers

## Constraints
- Preservar comportamento funcional e contratos existentes
- Manter padrão `route -> service -> helper`
- Fazer commit/push da etapa concluída
- Validar com `npm run typecheck` e `npm run lint`

## Exit Criteria
- [ ] `src/app/api/menu/items/image/route.ts` deixa de acessar Prisma diretamente
- [ ] `src/app/api/orders/route.ts` e `src/app/api/customer/lookup/route.ts` passam a usar o padrão central de erro/resposta
- [ ] Typecheck e lint passam após o recorte
- [ ] Mudanças da fase são commitadas e publicadas
