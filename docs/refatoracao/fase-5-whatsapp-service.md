# Fase 5 — WhatsApp service

**Status:** planejada

## Objetivo
Separar integração externa de builders, templates e regras de negócio no fluxo do WhatsApp.

## Dependências
- `fase-1-dtos-serializacao.md`

## Arquivo principal
- `src/lib/services/whatsapp-service.ts`

## Sequência recomendada
1. separar builders/formatters
2. extrair adapter de integração
3. isolar templates por caso de uso
4. cobrir cenários principais com testes

## Critérios de aceite
- transporte desacoplado da formatação
- regras de composição de mensagem mais testáveis
- service principal menor e mais focado

## Validação sugerida
- `npm run typecheck`
- `npm run lint`

## Commit sugerido
`refactor: isolate whatsapp integration and builders`
