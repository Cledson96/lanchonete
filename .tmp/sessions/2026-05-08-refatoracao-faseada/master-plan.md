# Master Plan: Refatoração Faseada

## Arquitetura alvo da execução

```text
[Contratos/DTOs] -> [Rotas finas] -> [Services focados] -> [Integrações isoladas]
        \                \                \                    \
         -> [Serialização] -> [UI modular] -> [Hooks/componentes] -> [Testes críticos]
```

## Ordem dos componentes/fases
1. [x] **Fase 0 — Preparação**
2. [ ] **Fase 1 — DTOs + serialização**
3. [ ] **Fase 2 — Ajustes arquiteturais**
4. [ ] **Fase 3 — Checkout**
5. [ ] **Fase 4 — Cardápio**
6. [ ] **Fase 5 — WhatsApp service**
7. [ ] **Fase 6 — Workspaces admin**
8. [ ] **Fase 7 — Consolidação**

## Decisões globais
- Persistir plano mestre em `docs/plano-refatoracao-faseada.md`
- Persistir planos executáveis em `docs/refatoracao/`
- Encerrar cada fase com validação, commit e push
- Não iniciar nova fase sem concluir a anterior

## Hotspots principais
- `src/components/dashboard-cardapio-manager.tsx`
- `src/components/pedido-checkout.tsx`
- `src/lib/services/whatsapp-service.ts`
- `src/components/dashboard-orders-workspace.tsx`
- `src/components/dashboard-comandas-workspace.tsx`
- `src/lib/services/order-admin-service.ts`
