# Revisão de Código Completa — Lanchonete Família

## Resumo Executivo

Revisão completa de ~120 arquivos divididos em 8 partes. Sistema funcional com boa cobertura de funcionalidades, mas com problemas críticos de manutenibilidade (arquivos monolíticos), segurança (headers faltando, rate limiting) e organização (duplicação de código, SRP violado).

---

## Pontuação por Parte

| Parte | Status | Nota Principal |
|-------|--------|----------------|
| 1. Fundação | ⚠️ Médio | Schema bem estruturado, config com fallback inseguro |
| 2. Autenticação | ⚠️ Médio | JWT ok, mas sem invalidação de token no logout |
| 3. Domínio Core | ❌ Ruim | Arquivos monolíticos, side effects em leituras |
| 4. Comandas | ⚠️ Médio | Transações boas, mas polling infinito e arquivo grande |
| 5. WhatsApp | ⚠️ Médio | Bot funcional, mas 1300 linhas em um arquivo |
| 6. Dashboard UI | ❌ Ruim | Arquivo de 2090 linhas, duplicação de fetches |
| 7. Interface Pública | ❌ Ruim | Checkout com 1484 linhas, strings hardcoded |
| 8. Qualidade | ❌ Ruim | ESLint mínimo, sem headers de segurança |

---

## Top 10 Problemas Críticos

### 🔴 Alta Prioridade

1. **Arquivos monolíticos**
   - `dashboard-cardapio-manager.tsx` (2090 linhas)
   - `pedido-checkout.tsx` (1484 linhas)
   - `whatsapp-service.ts` (1293 linhas)
   - **Impacto:** Difícil de testar, manter e fazer code review

2. **Side effects em funções de leitura**
   - `order-admin-service.ts`: `listOrders()` e `getOrderById()` mutam dados
   - **Impacto:** Lentidão, locks inesperados, comportamento não determinístico

3. **Falta de headers de segurança**
   - `next.config.ts` não configura CSP, HSTS, X-Frame-Options
   - **Impacto:** Vulnerável a XSS, clickjacking

4. **Rate limiting inexistente**
   - Rotas públicas de comanda, geocoding, login sem proteção
   - **Impacto:** Spam, abuse, banimento de API externa

5. **Token JWT não invalidado no logout**
   - Logout apenas limpa cookie, token continua válido por 7 dias
   - **Impacto:** Se token for roubado, pode ser usado mesmo após logout

### 🟡 Média Prioridade

6. **Polling infinito sem pausa**
   - Comanda pública e dashboard fazem fetch a cada 7s para sempre
   - **Impacto:** Tráfego desnecessário, bateria do cliente

7. **Cache inexistente ou volátil**
   - Menu público reconsultado a cada requisição
   - Geocoding sem TTL
   - **Impacto:** Latência, custo de API externa

8. **Duplicação de código**
   - `formatMoney`, `readJson`, `labelField` definidos múltiplas vezes
   - Lógica de ComandaEntry e OrderItem duplicada
   - **Impacto:** Manutenção custosa, inconsistências

9. **Type casting inseguro**
   - `as unknown as Array<...>` em order-service
   - `as unknown as` na landing page
   - **Impacto:** Perda de type safety, erros em runtime

10. **Validações hardcoded**
    - Quantidade de ingrediente limitada a 0-10
    - Loja com slug hardcoded "loja-principal"
    - Horário de almoço hardcoded no checkout
    - **Impacto:** Rigidez, dificuldade de ajuste

---

## Recomendações por Categoria

### Refatoração
- Dividir arquivos >500 linhas em módulos menores
- Extrair componentes reutilizáveis (KanbanColumn, OrderCard, etc.)
- Criar hooks customizados (useDebounce, usePolling)

### Segurança
- Adicionar rate limiting em todas as rotas públicas
- Configurar headers de segurança no next.config
- Implementar blacklist de tokens JWT
- Separar secrets admin/cliente

### Performance
- Adicionar cache com TTL no menu-service
- Pausar polling quando comanda/pedido estiver fechado
- Adicionar timeout e rate limit no geocoding

### Qualidade
- Adicionar regras ESLint customizadas (complexidade, a11y)
- Integrar Prettier
- Proibir `console.log` em produção
- Adicionar testes unitários para funções críticas

---

## Arquivos de Relatório

- `parte-1-fundacao.md`
- `parte-2-autenticacao.md`
- `parte-3-dominio-core.md`
- `parte-4-comandas.md`
- `parte-5-whatsapp.md`
- `parte-6-dashboard-ui.md`
- `parte-7-interface-publica.md`
- `parte-8-qualidade-configuracao.md`

---

## Próximos Passos Sugeridos

1. **Curto prazo (1-2 semanas):**
   - Headers de segurança
   - Rate limiting nas rotas públicas
   - Pausar polling quando fechado

2. **Médio prazo (1-2 meses):**
   - Dividir arquivos monolíticos
   - Cache no menu-service
   - Token blacklist

3. **Longo prazo (3+ meses):**
   - Testes automatizados
   - i18n
   - CI/CD com lint e typecheck
