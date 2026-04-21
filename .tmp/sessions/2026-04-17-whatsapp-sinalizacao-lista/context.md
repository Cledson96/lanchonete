# Task Context: Sinalização visual na lista do WhatsApp

Session ID: 2026-04-17-whatsapp-sinalizacao-lista
Created: 2026-04-17T00:00:00Z
Status: in_progress

## Current Request
Na lista de conversas do WhatsApp, sinalizar visualmente quando a pessoa mandou mensagem e quando a conversa está em modo atendente/human_handoff.

## Context Files (Standards to Follow)
- /home/cledson/.opencode/context/core/standards/code-quality.md

## Reference Files (Source Material to Look At)
- /home/cledson/projetos/lanchonete/src/components/dashboard-whatsapp-panel.tsx
- /home/cledson/projetos/lanchonete/src/app/(dashboard)/dashboard/whatsapp/page.tsx
- /home/cledson/projetos/lanchonete/src/app/(dashboard)/dashboard/whatsapp/[id]/page.tsx
- /home/cledson/projetos/lanchonete/src/lib/services/whatsapp-service.ts
- /home/cledson/projetos/lanchonete/src/app/api/dashboard/whatsapp/conversations/route.ts

## External Docs Fetched
- Nenhuma

## Components
- Lista de conversas do WhatsApp no dashboard
- Badge/estado de atendimento

## Constraints
- Ajuste mínimo, sem migration
- Reaproveitar os campos já existentes (`messages[0].direction` e `state`)

## Exit Criteria
- [ ] Lista destaca visualmente quando a última mensagem foi inbound
- [ ] Lista destaca visualmente quando a conversa está em human_handoff
- [ ] Typecheck continua passando
