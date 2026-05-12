# Task Context: Refatoração faseada do projeto

Session ID: 2026-05-08-refatoracao-faseada
Created: 2026-05-08T00:00:00Z
Status: in_progress

## Current Request
Criar uma branch dedicada, persistir um plano mestre e planos operacionais menores em Markdown, executar a refatoração por partes não tão grandes e fazer commit + push ao final de cada fase concluída.

## Context Files (Standards to Follow)
- `C:\Users\user\.config\opencode\context\core\standards\documentation.md`
- `C:\Users\user\.config\opencode\context\core\standards\code-analysis.md`
- `C:\Users\user\.config\opencode\context\core\standards\code-quality.md`
- `C:\Users\user\.config\opencode\context\core\standards\test-coverage.md`
- `C:\Users\user\.config\opencode\context\core\workflows\feature-breakdown.md`
- `C:\Users\user\.config\opencode\context\core\workflows\component-planning.md`
- `C:\Users\user\.config\opencode\context\core\workflows\task-delegation-basics.md`
- `C:\Users\user\.config\opencode\context\core\task-management\guides\splitting-tasks.md`

## Reference Files (Source Material to Look At)
- `docs/plano-refatoracao-faseada.md`
- `docs/plano-backend-v1.md`
- `docs/plano-lanchonete-v1.md`
- `package.json`
- `src/app/api/orders/route.ts`
- `src/app/api/delivery-fee/quote/route.ts`
- `src/app/api/dashboard/settings/route.ts`
- `src/app/api/menu/route.ts`
- `src/components/pedido-checkout.tsx`
- `src/components/dashboard-cardapio-manager.tsx`
- `src/lib/services/order-service.ts`
- `src/lib/services/whatsapp-service.ts`

## External Docs Fetched
- Nenhum por enquanto.

## Components
- Plano mestre de refatoração persistido em `docs/`
- Planos operacionais por fase em `docs/refatoracao/`
- Artefatos da Fase 0 para baseline, contratos e estratégia de testes
- Sessão compartilhada para agentes em `.tmp/sessions/2026-05-08-refatoracao-faseada/`

## Constraints
- Executar em partes pequenas e verificáveis
- Fazer commit e push ao final de cada fase concluída
- Não misturar refatoração de múltiplos hotspots na mesma etapa sem necessidade
- Manter o padrão dominante `route -> service -> helper`
- Tratar ausência de testes como risco explícito

## Exit Criteria
- [x] Plano mestre persistido
- [x] Planos operacionais por fase persistidos
- [x] Fase 0 executada e documentada
- [ ] Fase 1 detalhada e executada
- [ ] Próximas fases executadas com commit + push por fase

## Progress
- [x] Sessão inicializada
- [x] Plano mestre criado
- [x] Planos operacionais criados
- [x] Fase 0 em documentação concluída
- [ ] Fase 1 iniciada
