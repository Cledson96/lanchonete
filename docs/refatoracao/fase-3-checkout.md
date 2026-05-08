# Fase 3 — Checkout

**Status:** planejada

## Objetivo
Reduzir a complexidade do checkout extraindo lógica pura, hooks de fluxo e componentes menores sem mudar o comportamento do usuário.

## Dependências
- `fase-1-dtos-serializacao.md`
- `fase-2-ajustes-arquiteturais.md`

## Arquivo principal
- `src/components/pedido-checkout.tsx`

## Sequência recomendada
1. extrair tipos compartilhados remanescentes
2. extrair cálculos e validações puros
3. extrair hooks de submissão, estado e efeitos
4. dividir UI por blocos
5. adicionar cobertura mínima nos helpers e hooks críticos

## Critérios de aceite
- componente principal significativamente menor
- helpers puros fora do arquivo principal
- hooks de fluxo isolados
- sem regressão de contrato nas chamadas HTTP

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: modularize checkout flow`
