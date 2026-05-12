# Parte 6 — Interface do Dashboard

## 1. src/app/(dashboard)/layout.tsx (73 linhas)

### Pontos Positivos
- Server Component com redirect se não autenticado
- Uso de CSS variables consistente com o tema
- Sidebar sticky em desktop

### Problemas
- Logout via form POST tradicional (não usa Server Action nem fetch)
- Ícone de logout inline

---

## 2. src/components/dashboard-nav.tsx (117 linhas)

### Pontos Positivos
- Array de configuração limpo
- Active state com `pathname.startsWith` para rotas aninhadas
- Visual refinado (indicador dot, cores de brand)

### Problemas
- Ícones SVG inline hardcoded — não reutiliza biblioteca de ícones
- Sem lazy loading ou code-splitting por rota

---

## 3. src/app/(dashboard)/dashboard/page.tsx (308 linhas)

### Pontos Positivos
- Server Component com dados fetched no servidor
- Visual rico com progress bars e cards coloridos
- KPIs com estado de urgência (amarelo/vermelho condicional)

### Problemas
- Funções de ícones inline repetidas
- IIFE no JSX para calcular totais — adiciona complexidade visual
- `_count._all` e `_sum.totalAmount` do Prisma sem type safety visível

---

## 4. src/app/(dashboard)/dashboard/operacao/page.tsx (11 linhas)

### Pontos Positivos
- Minimalista, separa configuração da implementação

### Problemas
- Nenhum

---

## 5. src/components/dashboard-orders-workspace.tsx (944 linhas)

### Pontos Positivos
- DnD com `@dnd-kit/core` bem implementado
- Dual view: pedidos (order-level) e cozinha (item/unit-level)
- Polling a cada 7s
- Filtros por canal e tipo
- Cards ricos com info de canal, comanda, observações, progresso

### Problemas
- **Arquivo muito grande (944 linhas):** KanbanColumn, OrderCard, KitchenItemCard deveriam ser extraídos
- `buildKitchenItems` reconstruído em vários lugares — redundante
- `refreshOrders` com `keepDetail=true` faz duas requisições serializadas
- `useEffect` dependencies incluem `refreshOrders` que é `useCallback` com dependências mutáveis
- `parseJson` genérico sem type safety runtime

---

## 6. src/components/dashboard-cardapio-manager.tsx (2090 linhas)

### Pontos Positivos
- Interface completa com tabs
- State machine local para edição
- Suporte a combos com quantidades
- Toggle de dias da semana, ativo/inativo, destaque
- Upload/remoção de imagem com feedback visual
- Busca e filtros

### Problemas
- **Arquivo excessivamente grande (2090 linhas):** Deveria ser quebrado em listagem, editor de item, editor de categoria, diálogo de exclusão
- `asNumber` trata `toString()` genérico — pode perder precisão com Decimal
- `saveItem` não valida schema no cliente antes de enviar
- `fileInputsRef` usa `item.id` como chave, sem fallback para item novo
- `refreshCatalog` não trata erro de rede
- `updateLocalItem` faz update otimista sem tratamento de erro do servidor

---

## Resumo Geral Parte 6

| Aspecto | Status | Nota |
|---------|--------|------|
| UX/UI | ✅ Bom | Interfaces ricas e funcionais |
| Organização | ❌ Ruim | Arquivos monolíticos |
| Performance | ⚠️ Médio | Polling redundante, fetches duplicados |
| Type Safety | ⚠️ Médio | Casts, parseJson genérico |
| Manutenibilidade | ❌ Ruim | 2090 linhas em um arquivo |

### Prioridade de Correção
1. **Alta**: Dividir dashboard-cardapio-manager em subcomponentes
2. **Alta**: Extrair KanbanColumn, OrderCard, KitchenItemCard
3. **Média**: Otimizar refreshOrders para não fazer fetch duplo
4. **Média**: Adicionar validação cliente antes de saveItem
5. **Baixa**: Reutilizar biblioteca de ícones
