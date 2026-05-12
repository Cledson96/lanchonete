# Revisão de Código — Parte 1: Fundação e Contratos

**Data:** 2026-04-21
**Arquivos revisados:**
- `prisma/schema.prisma` (537 linhas)
- `src/lib/config.ts` (22 linhas)
- `src/lib/prisma.ts` (47 linhas)
- `src/lib/validators.ts` (296 linhas)

---

## 1. prisma/schema.prisma

### Pontos Positivos
- **Bem estruturado:** 17+ modelos com relações claras
- **Consistência monetária:** Uso de `Decimal` para todos os valores financeiros
- **onDelete adequado:** Cascade para filhos, Restrict para referências, SetNull para opcionais
- **Índices presentes:** Em campos de busca frequente (`status`, `createdAt`, `phone`, etc.)
- **Enums bem definidos:** Separação clara de status, canais, tipos de pagamento

### Problemas e Riscos

#### 1.1 Comanda usa OrderStatus enum (linha 403)
```prisma
model Comanda {
  status OrderStatus @default(novo)
}
```
**Problema:** Comanda não deveria ter status de entrega (`saiu_para_entrega`, `entregue`).
**Sugestão:** Criar `ComandaStatus` separado: `aberta`, `em_preparo`, `pronta`, `fechada`, `cancelada`.

#### 1.2 Conversa WhatsApp limitada a 1 pedido (linha 482)
```prisma
model WhatsAppConversation {
  orderId String? @unique
}
```
**Problema:** `@unique` impede que um cliente faça múltiplos pedidos pela mesma conversa.
**Sugestão:** Remover `@unique` se o fluxo permitir múltiplos pedidos, ou documentar se for regra de negócio.

#### 1.3 Unidades órfãs possíveis (linha 439)
```prisma
model OrderItemUnit {
  comandaEntryId String?
}
```
**Problema:** Se `comandaEntryId` for null, a unidade não tem link direto com comanda.
**Sugestão:** Verificar se todas as queries consideram esse caso.

#### 1.4 Ingrediente default quantity = 1 (linha 282)
```prisma
model MenuItemIngredient {
  quantity Int @default(1)
}
```
**Risco:** Para remoção de ingredientes (quantity = 0), o default impede no schema, mas o código já trata.
**Verificação:** Confirmar que o código sempre seta explicitamente quantity quando necessário.

#### 1.5 Falta índice em customerProfileId da conversa
```prisma
model WhatsAppConversation {
  customerProfileId String
}
```
**Sugestão:** Adicionar `@@index([customerProfileId])` para buscas por cliente.

---

## 2. src/lib/config.ts

### Pontos Positivos
- Simples e direto
- Fallbacks para desenvolvimento

### Problemas Críticos

#### 2.1 Secret hardcoded em produção
```typescript
const fallbackSecret = "local-dev-secret-change-me";
export const config = {
  authSecret: process.env.APP_AUTH_SECRET || fallbackSecret,
};
```
**🚨 RISCO DE SEGURANÇA:** Se `APP_AUTH_SECRET` não for configurado em produção, o sistema usará um secret previsível.
**Sugestão:** Lançar erro em produção se variáveis críticas estiverem ausentes:
```typescript
authSecret: process.env.APP_AUTH_SECRET || (isProd ? throw new Error("APP_AUTH_SECRET obrigatorio") : fallbackSecret)
```

#### 2.2 Falta validação de env vars
**Sugestão:** Adicionar validação no startup para garantir que todas as variáveis necessárias estão presentes.

---

## 3. src/lib/prisma.ts

### Pontos Positivos
- Singleton pattern com globalThis
- Adapter PostgreSQL configurado
- Lógica de fallback DATABASE_URL vs DATABASE_REMOTE_URL

### Problemas

#### 3.1 Falta verificação de schema gerado
**Sugestão:** Adicionar check se `prisma generate` foi executado, especialmente após migrations.

#### 3.2 Adapter não usa pool de conexões explícito
**Sugestão:** Verificar se `PrismaPg` gerencia pool internamente ou se precisa de configuração.

---

## 4. src/lib/validators.ts

### Pontos Positivos
- Schemas Zod bem estruturados
- Uso de `z.coerce` para conversão de tipos
- Validações específicas (horário, telefone, CEP, URL)
- `superRefine` para validações complexas (deleteCategorySchema)

### Problemas

#### 4.1 Limite arbitrário de 10 ingredientes
```typescript
quantity: z.coerce.number().int().min(0).max(10)
```
**Questão:** Por que max(10)? Um cliente pode querer mais de 10 unidades de um ingrediente.
**Sugestão:** Remover `.max(10)` ou aumentar para um valor mais razoável (50?).

#### 4.2 ImageUrl com validação complexa
```typescript
imageUrl: z.string().trim().refine((value) => !value || value.startsWith("/") || z.string().url().safeParse(value).success)
```
**Sugestão:** Extrair para função reutilizável `imageUrlSchema`.

#### 4.3 ownerId não valida se usuário existe
```typescript
ownerId: z.union([stringField.min(1), z.null()]).optional()
```
**Sugestão:** Adicionar validação assíncrona ou garantir no service que o owner existe.

---

## Resumo da Parte 1

| Gravidade | Quantidade | Principais |
|-----------|-----------|------------|
| 🔴 Crítica | 1 | Secret hardcoded em produção |
| 🟠 Média | 3 | ComandaStatus separado, Conversa→Pedido único, Limite 10 ingredientes |
| 🟡 Baixa | 4 | Índices faltantes, Validação ownerId, Pool Prisma, Schema gerado |

**Próxima Parte:** Autenticação e Segurança (`src/lib/auth/*`)
