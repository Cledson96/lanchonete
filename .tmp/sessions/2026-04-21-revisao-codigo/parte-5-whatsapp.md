# Parte 5 — Integração WhatsApp

## 1. src/lib/whatsapp-client.ts (353 linhas)

### Pontos Positivos
- Singleton robusto com `globalThis` para sobreviver a hot-reload
- Fallback de número (com/sem dígito 9) para Brasil
- Eventos limitados a 25 entradas (capped memory)
- `initPromise` evita race conditions na inicialização

### Problemas
- **Puppeteer args hardcoded (`--no-sandbox`):** Reduz isolamento de segurança
- **Sem retry/backoff explícito** para envio falho
- **`change_state` registrado como `init`:** Pode confundir logs
- **Loop de variants em `sendTextMessage`:** `lastError` pode ser sobrescrito, mensagem de erro genérica

---

## 2. src/lib/services/whatsapp-service.ts (1293 linhas)

### Pontos Positivos
- Máquina de estados bem definida (`BotState`) com contexto serializado
- Fallback para site público quando bot desabilitado (48h)
- Tratamento de concorrência na criação de conversa (catch `P2002`)
- Handoff humano implementado
- Busca de CEP via ViaCEP integrada
- Normalização de texto inbound (NFD + lowercase)

### Problemas
- **Arquivo muito grande (~1300 linhas):** Viola SRP — mistura bot, persistência, inbox e envio
- **Conversas "silenciosas":** Registra mensagem inbound antes de verificar `whatsappBotEnabled`
- **`sendWhatsAppTextMessage` em dev:** Retorna `delivered: false` sem throw — mascara falhas
- **Race condition em `claimPublicSiteReply`:** `updateMany` não é atômico com o envio
- **`PAYMENT_OPTIONS` hardcoded** em português sem i18n

---

## 3. src/lib/integrations/whatsapp.ts (18 linhas)

### Pontos Positivos
- Abstração limpa que desacopla a aplicação da implementação

### Problemas
- **`verifyWhatsAppSignature()` retorna `true` incondicionalmente:** Stub perigoso para webhooks futuros
- Praticamente um pass-through — poderia ser eliminado se não houver plano de múltiplos providers

---

## 4. src/app/api/whatsapp/webhook/route.ts (19 linhas)

### Pontos Positivos
- Comunicação clara no response sobre mudança de arquitetura

### Problemas
- Retorna 200 em vez de 410 Gone para endpoint legado

---

## 5. src/app/api/whatsapp/session/route.ts (15 linhas)

### Pontos Positivos
- Protegido por `requireAdmin`
- `runtime = "nodejs"` explícito

### Problemas
- Apenas GET — não expõe conectar/desconectar/resetar via API

---

## Resumo Geral Parte 5

| Aspecto | Status | Nota |
|---------|--------|------|
| Máquina de Estados | ✅ Bom | BotState bem definido |
| Concorrência | ⚠️ Médio | Race conditions teóricas |
| Tamanho | ❌ Ruim | 1300 linhas |
| Segurança | ⚠️ Médio | Stub perigoso, no-sandbox |
| i18n | ❌ Ruim | Hardcoded em português |

### Prioridade de Correção
1. **Alta**: Dividir whatsapp-service.ts em módulos
2. **Alta**: Corrigir race condition em claimPublicSiteReply
3. **Média**: Implementar verifyWhatsAppSignature real
4. **Média**: Adicionar retry/backoff no envio
5. **Baixa**: Extrair i18n
