# Fase 2 — Ajustes arquiteturais

**Status:** concluída

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

## Resultado executado
- `src/app/api/menu/items/image/route.ts` passou a delegar upload/remoção de imagem para `menu-admin-service`
- `src/app/api/orders/route.ts` e `src/app/api/customer/lookup/route.ts` substituíram respostas manuais por `ApiError` + `handleRouteError`
- `customer/lookup` passou a reutilizar o serializer compartilhado do checkout para evitar remapeamento manual

## Critérios de aceite
- rota imagem delega para service
- respostas manuais substituídas por padrão central quando aplicável
- comportamento preservado para sucesso e erro

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: align routes with service and response helpers`
