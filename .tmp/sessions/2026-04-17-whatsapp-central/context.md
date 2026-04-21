# Task Context: Central de atendimento no WhatsApp

Session ID: 2026-04-17-whatsapp-central
Created: 2026-04-17T00:00:00Z
Status: in_progress

## Current Request
Evoluir o WhatsApp do dashboard para ficar com cara de central de atendimento, incluindo prioridade, tempo sem resposta, dono/responsável da conversa e filtro “precisa responder”.

## Context Files (Standards to Follow)
- /home/cledson/.opencode/context/core/standards/code-quality.md
- /home/cledson/.opencode/context/ui/web/react-patterns.md
- /home/cledson/.opencode/context/ui/web/ui-styling-standards.md

## Reference Files (Source Material to Look At)
- /home/cledson/projetos/lanchonete/prisma/schema.prisma
- /home/cledson/projetos/lanchonete/src/lib/services/whatsapp-service.ts
- /home/cledson/projetos/lanchonete/src/components/dashboard-whatsapp-panel.tsx
- /home/cledson/projetos/lanchonete/src/app/(dashboard)/dashboard/whatsapp/page.tsx
- /home/cledson/projetos/lanchonete/src/app/api/dashboard/whatsapp/conversations/route.ts
- /home/cledson/projetos/lanchonete/src/app/api/dashboard/whatsapp/conversations/[id]/route.ts
- /home/cledson/projetos/lanchonete/src/app/api/dashboard/whatsapp/conversations/[id]/messages/route.ts
- /home/cledson/projetos/lanchonete/src/lib/auth/session.ts
- /home/cledson/projetos/lanchonete/src/lib/auth/admin.ts

## External Docs Fetched
- Nenhuma

## Components
- Inbox/lista de conversas do WhatsApp
- Metadados operacionais da conversa
- Atualização de prioridade e responsável

## Constraints
- Persistir apenas prioridade e ownerId
- Derivar “precisa responder” e “tempo sem resposta” em runtime
- Manter ajuste mínimo sem remodelar a autenticação inteira do dashboard

## Exit Criteria
- [ ] Cada conversa mostra prioridade, responsável e tempo sem resposta quando aplicável
- [ ] Existe filtro “precisa responder” na lista
- [ ] É possível assumir/liberar conversa e ajustar prioridade
- [ ] Typecheck continua passando
