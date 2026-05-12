# Parte 3 — Domínio Core (Cardápio + Pedido + Frete)

## 1. src/lib/services/menu-service.ts (119 linhas)

### Pontos Positivos
- Separação clara entre interface pública (`getPublicMenu`) e administrativa
- Filtros de disponibilidade (`isCategoryAvailableNow`, `isMenuItemAvailableNow`) consistentes
- Ordenação explícita em todas as queries

### Problemas
- **Query N+1 / Carga excessiva:** `getPublicMenu` carrega árvore profunda sem paginação
- **Filtros em memória:** Aplicados depois do fetch — banco retorna dados desnecessários
- **Casts frequentes:** Linhas 47, 51, 61 — mascaram tipagem
- **Sem cache:** Menu público é reconsultado a cada requisição

---

## 2. src/lib/services/menu-admin-service.ts (722 linhas)

### Pontos Positivos
- Uso de `hasOwn` para updates parciais
- `deleteCategory` valida dependências históricas com transações
- Transações Prisma em operações destrutivas

### Problemas
- **Violação grave do SRP:** 722 linhas misturando 5 domínios (categoria, item, option group, ingredient, delivery fee)
- **Inconsistência em validações de deleção:** `deleteOptionGroup` e `deleteIngredient` não verificam dependências
- **Lógica confusa em `updateMenuItem`:** Condição contra-intuitiva para limpar combos
- **Mensagens de erro misturadas:** Português sem acentuação

---

## 3. src/lib/services/order-service.ts (434 linhas)

### Pontos Positivos
- Validações de negócio extensivas (itens, opções, ingredientes, disponibilidade)
- Cálculo de subtotal e frete integrado
- Transação Prisma para criação completa do pedido

### Problemas
- **Função monolítica:** `createOrder` tem ~350 linhas sequenciais
- **Cast perigoso:** `as unknown as Array<...>` indica tipos não alinhados
- **Mutabilidade oculta:** `let subtotal = 0` alterado dentro de `.map()`
- **Sem idempotência:** `generateOrderCode()` usa `Date.now()` — risco de colisão

---

## 4. src/lib/services/order-admin-service.ts (611 linhas)

### Pontos Positivos
- Máquina de estados explícita com `allowedTransitions`
- Sincronização automática de comandas legadas
- Envio de WhatsApp isolado com `try/catch`

### Problemas
- **Side effects em leituras:** `listOrders` e `getOrderById` mutam dados — anti-padrão
- **Transação incompleta:** `recordOutboundOrderMessage` usa prisma fora de transação
- **Race condition:** `promoteOrderWhenAllUnitsReady` pode causar dupla promoção
- **Acoplamento excessivo:** WhatsApp, comandas e unidades no mesmo arquivo

---

## 5. src/lib/services/delivery-fee-service.ts (207 linhas)

### Pontos Positivos
- Cache de coordenadas da loja
- Fallback inteligente de geocodificação
- Validação clara de distância máxima e valor mínimo

### Problemas
- **Hack de acesso ao `storeProfile`:** Cast de prisma expõe comando interno no erro
- **Normalização insuficiente:** Apenas `trim().toLowerCase()`
- **Loja hardcoded:** Assume `slug: "loja-principal"`
- **Sem cache para cliente:** Geocodifica endereço do cliente do zero a cada vez

---

## 6. src/lib/geocoding.ts (138 linhas)

### Pontos Positivos
- Cache em memória para evitar requisições repetidas
- Múltiplas variantes de query como fallback
- Headers HTTP apropriados
- Cálculo Haversine puro sem dependências

### Problemas
- **Cache volátil sem TTL:** Perdido em restarts, sem expiração
- **Sem timeout no `fetch`:** Pode pendurar indefinidamente
- **Sem rate limiting:** Nominatim exige 1 req/s
- **Erro genérico:** Retorna 502 para qualquer falha

---

## Resumo Geral Parte 3

| Aspecto | Status | Nota |
|---------|--------|------|
| Separação de Responsabilidades | ❌ Ruim | menu-admin com 722 linhas |
| Validações de Negócio | ✅ Bom | order-service bem validado |
| Transações | ⚠️ Médio | order-admin com side effects |
| Cache | ❌ Ruim | Volátil ou inexistente |
| Rate Limiting | ❌ Faltando | geocoding sem proteção |
| Tipagem | ⚠️ Médio | Casts frequentes |
| Integridade de Dados | ⚠️ Médio | Race conditions possíveis |

### Prioridade de Correção
1. **Alta**: Separar menu-admin-service em arquivos por domínio
2. **Alta**: Remover side effects de leituras em order-admin
3. **Alta**: Adicionar timeout e rate limit no geocoding
4. **Média**: Refatorar createOrder em funções menores
5. **Média**: Adicionar cache com TTL no menu-service
6. **Baixa**: Resolver hack do storeProfile
