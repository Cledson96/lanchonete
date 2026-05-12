# Fase 3 — Checkout

**Status:** concluída

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

## Resultado executado
- helpers puros e estado derivado extraídos para `src/lib/checkout-client.ts`
- hidratação de sessão, entrega, verificação e submissão isoladas em hooks dedicados (`use-checkout-customer-session`, `use-checkout-delivery-flow`, `use-checkout-verification`, `use-checkout-submit`)
- cliente HTTP e refresh de status da loja extraídos para `src/lib/checkout-api.ts` e `src/lib/use-checkout-store-status.ts`
- UI do checkout dividida em blocos visuais focados dentro de `src/components/checkout/`
- contrato HTTP do submit preservado com validação por `npm run typecheck` e `npm run lint`

## Observação de cobertura
- não há suíte automatizada de testes configurada no projeto neste momento; a fase foi encerrada com validação estática e recortes incrementais validados a cada passo

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: modularize checkout flow`
