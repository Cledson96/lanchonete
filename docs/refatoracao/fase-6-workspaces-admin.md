# Fase 6 — Workspaces administrativos

**Status:** planejada

## Objetivo
Reduzir complexidade dos workspaces administrativos maiores, separando filtros, ações, estado e apresentação.

## Dependências
- `fase-1-dtos-serializacao.md`
- `fase-2-ajustes-arquiteturais.md`

## Arquivos principais
- `src/components/dashboard-orders-workspace.tsx`
- `src/components/dashboard-comandas-workspace.tsx`
- `src/components/dashboard-settings-manager.tsx`

## Sequência recomendada
1. extrair estado e filtros
2. extrair componentes de lista/detalhe/ações
3. mover helpers e tipos locais para camadas compartilhadas
4. revisar cobertura mínima das regras extraídas

## Critérios de aceite
- workspaces menores e mais legíveis
- menor acoplamento entre estado e renderização
- tipos repetidos removidos quando fizer sentido

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: modularize dashboard workspaces`
