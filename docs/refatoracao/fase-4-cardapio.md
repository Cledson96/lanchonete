# Fase 4 — Cardápio

**Status:** planejada

## Objetivo
Quebrar o maior hotspot da UI em módulos menores, com separação entre estado, transformação, ações e renderização.

## Dependências
- `fase-1-dtos-serializacao.md`
- `fase-2-ajustes-arquiteturais.md`

## Arquivo principal
- `src/components/dashboard-cardapio-manager.tsx`

## Sequência recomendada
1. identificar subdomínios internos
2. extrair normalização e transformação de dados
3. extrair hooks de dados e ações
4. dividir UI por seções
5. cobrir regras extraídas

## Critérios de aceite
- componente raiz atua como orquestrador
- lógica não visual isolada em módulos menores
- menor duplicação de tipos e normalização de preços

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: split menu manager into smaller modules`
