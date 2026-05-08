# Fase 2 — Ajustes arquiteturais

**Status:** planejada

## Objetivo
Eliminar desvios pequenos do padrão arquitetural dominante antes da refatoração dos hotspots maiores.

## Dependências
- `fase-1-dtos-serializacao.md`

## Arquivos-alvo iniciais
- `src/app/api/menu/items/image/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/customer/lookup/route.ts`

## Entregas esperadas
- rota sem acesso direto ao Prisma
- respostas HTTP padronizadas com helpers centrais
- tratamento de erro consistente

## Critérios de aceite
- rota imagem delega para service
- respostas manuais substituídas por padrão central quando aplicável
- comportamento preservado para sucesso e erro

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: align routes with service and response helpers`
