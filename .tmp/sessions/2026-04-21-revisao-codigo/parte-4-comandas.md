# Parte 4 — Comandas e QR Code

## 1. src/lib/services/comanda-service.ts (525 linhas)

### Pontos Positivos
- Transacionalidade consistente com `prisma.$transaction`
- Validação robusta de inputs (menu item, adicionais, ingredientes, quantidades)
- Geração de identificadores únicos com verificação de colisão
- Dupla escrita controlada (ComandaEntry + OrderItem)
- Sincronização legada para migração de dados

### Problemas
- **Loop infinito teórico:** `while (true)` sem limite de tentativas na geração de código/slug
- **Validação hardcoded:** Limite de quantidade 0-10 não parametrizável
- **Sync legada sem batch limit:** Itera todas as comandas em memória, pode ser lento em bases grandes
- **Duplicação de lógica:** Estruturas similares para ComandaEntry e OrderItem (linhas 316-383)
- **Cálculo de total desconsidera outros ajustes** além de discountAmount

---

## 2. API Routes — Comandas (5 arquivos, 121 linhas total)

### Pontos Positivos
- Separação clara entre rotas públicas e administrativas
- Thin controllers — lógica delegada ao service
- Consistência de assinatura (`ok({ comanda })`)
- Uso de schemas de validação

### Problemas
- **Rota POST `/api/comandas/[id]/items` é pública sem autenticação:** Risco de spam/abuso se slug for adivinhado
- **Sem rate limiting** em rotas públicas
- **Sem validação de origem/referer** nas rotas públicas
- GET por ID não verifica permissão do requester

---

## 3. src/components/public-comanda-experience.tsx (214 linhas)

### Pontos Positivos
- UX clara e objetiva
- Polling silencioso de 7s para tempo real
- Estados de carregamento e erro tratados
- Reutilização de componentes compartilhados

### Problemas
- **Polling contínuo mesmo após erro ou comanda fechada:** Nunca pausa — ideal parar quando `status === "fechado"`
- **Erros de rede silenciados:** Polling usa `.catch(() => undefined)`
- **Sem tratamento diferenciado de "não encontrada"**
- **Botão não desabilita durante fetch:** Risco de duplicidade se clicado rapidamente

---

## 4. src/components/dashboard-comandas-workspace.tsx (884 linhas)

### Pontos Positivos
- Interface rica e bem organizada (lista + detalhe + KPIs)
- Geração de QR Code cliente-side com cores da marca
- Keyboard accessibility nos modais
- Auto-seleção da primeira comanda aberta
- Separação de estados de loading
- Feedback visual temporário com timeout

### Problemas
- **Arquivo muito grande (884 linhas):** Concentra lista, detalhe, 4 modais, ícones e helpers. Difícil de testar e manter
- **Polling de 7s sem backoff ou pausa:** Dashboard fica aberto por horas, gera tráfego desnecessário
- **`openComanda` refaz fetch mesmo com dados em cache:** Poderia reaproveitar objeto da lista
- **Inconsistência de tipagem em `handleAddItem`:** Conversão de Record para array poderia ser um helper compartilhado
- **Cores CSS hardcoded:** Tokens como `rgba(45,24,11,0.4)` literais no código

---

## Resumo Geral Parte 4

| Aspecto | Status | Nota |
|---------|--------|------|
| Transacionalidade | ✅ Bom | Transações Prisma consistentes |
| Validações | ✅ Bom | Inputs bem validados |
| Segurança de Rotas | ⚠️ Médio | Públicas sem rate limit |
| UX/UI | ✅ Bom | Interface rica e funcional |
| Tamanho de Arquivos | ❌ Ruim | Dashboard com 884 linhas |
| Eficiência | ⚠️ Médio | Polling infinito, fetch redundante |
| Manutenibilidade | ⚠️ Médio | Duplicação de lógica, cores hardcoded |

### Prioridade de Correção
1. **Alta**: Adicionar rate limiting nas rotas públicas de comanda
2. **Alta**: Pausar polling quando comanda estiver fechada
3. **Média**: Dividir dashboard-comandas-workspace em subcomponentes
4. **Média**: Adicionar limite de tentativas no loop de geração de código
5. **Baixa**: Extrair helper compartilhado para conversão de ingredientCustomizations
6. **Baixa**: Mover cores para tokens CSS
