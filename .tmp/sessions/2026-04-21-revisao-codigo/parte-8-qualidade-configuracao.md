# Parte 8 — Qualidade e Configuração

## 1. next.config.ts (9 linhas)

### Pontos Positivos
- TypeScript config (`NextConfig` typed)
- `qualities` para otimização de imagem

### Problemas
- Muito espartano. Falta:
  - `output` (export ou standalone)
  - `images.domains/remotePatterns` (se usar imagens externas)
  - Headers de segurança (CSP, HSTS, X-Frame-Options)
  - `experimental` flags se necessário
  - Rewrites/redirects
- Sem configuração de compressão ou caching

---

## 2. tsconfig.json (34 linhas)

### Pontos Positivos
- `strict: true`, `isolatedModules: true`, `noEmit: true` — boas práticas
- Path alias `@/*` configurado
- `moduleResolution: bundler`

### Problemas
- `target: ES2017` — conservador para 2025, mas funcional
- `include` cobre `.mts` mas não `.mjs`
- `skipLibCheck: true` oculta potenciais incompatibilidades de tipos

---

## 3. eslint.config.mjs (18 linhas)

### Pontos Positivos
- Usa `eslint-config-next` (core-web-vitals + typescript)
- `globalIgnores` limpo

### Problemas
- Sem regras customizadas do projeto
- Sem integração com Prettier
- Sem regras de acessibilidade (`jsx-a11y`)
- Não inclui regra para proibir `console.log` em produção
- Poderia adicionar `import/order` ou `@typescript-eslint/no-explicit-any`
- Não valida complexidade ciclomática (files com 2000+ linhas passam)

---

## Resumo Geral Parte 8

| Aspecto | Status | Nota |
|---------|--------|------|
| TypeScript | ✅ Bom | Strict mode ativado |
| ESLint | ⚠️ Médio | Config mínima, sem regras custom |
| Next.js Config | ❌ Ruim | Faltam headers de segurança |
| Build | ⚠️ Médio | Sem output config, sem compressão |

### Prioridade de Correção
1. **Alta**: Adicionar headers de segurança no next.config
2. **Alta**: Configurar output para standalone (Docker)
3. **Média**: Adicionar regras ESLint customizadas (complexidade, a11y)
4. **Média**: Integrar Prettier com ESLint
5. **Baixa**: Atualizar target para ES2020+
