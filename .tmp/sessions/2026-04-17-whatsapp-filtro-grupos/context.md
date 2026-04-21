# Task Context: Filtrar grupos no histórico do WhatsApp

Session ID: 2026-04-17-whatsapp-filtro-grupos
Created: 2026-04-17T00:00:00Z
Status: in_progress

## Current Request
Mostrar no histórico/conversas do WhatsApp apenas conversas que não sejam de grupos, porque o robô não responde grupos.

## Context Files (Standards to Follow)
- /home/cledson/.opencode/context/core/standards/code-quality.md
- /home/cledson/.opencode/context/core/workflows/feature-breakdown.md

## Reference Files (Source Material to Look At)
- /home/cledson/projetos/lanchonete/src/lib/services/whatsapp-service.ts
- /home/cledson/projetos/lanchonete/prisma/schema.prisma
- /home/cledson/projetos/lanchonete/src/app/(dashboard)/dashboard/whatsapp/page.tsx
- /home/cledson/projetos/lanchonete/src/app/api/dashboard/whatsapp/conversations/route.ts
- /home/cledson/projetos/lanchonete/src/components/dashboard-whatsapp-panel.tsx

## External Docs Fetched
- Nenhuma

## Components
- Listagem de conversas do WhatsApp no dashboard
- Serviço de consulta das conversas

## Constraints
- Ajuste mínimo no backend da listagem
- Não alterar o fluxo de resposta do bot neste passo
- Conversas de grupo devem ser inferidas por `externalThreadId` com sufixo `@g.us`

## Exit Criteria
- [ ] O histórico do dashboard não mostra conversas de grupos do WhatsApp
- [ ] O refresh da listagem também respeita o filtro
- [ ] Typecheck continua passando
