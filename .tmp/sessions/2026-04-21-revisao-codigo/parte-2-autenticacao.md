# Parte 2 — Autenticação e Segurança

## 1. src/lib/auth/session.ts

### Pontos Positivos
- Uso de `jose` (biblioteca moderna e segura para JWT)
- Cookies com `httpOnly`, `sameSite: "lax"`, `secure` apenas em produção
- Diferenciação clara entre sessão admin (7d) e cliente (30m)
- Cookie name distinto para cada tipo de sessão

### Problemas
- **Mesmo secret para admin e cliente**: `APP_AUTH_SECRET` é usado para ambos. Se houver vazamento, ambos os sistemas ficam comprometidos.
- **Tempo de expiração do cliente muito curto**: 30 minutos pode gerar UX ruim no checkout.
- **Não implementa refresh token**: Cliente precisa re-logar a cada 30 min.
- **Sem rate limiting na verificação de sessão**.

### Recomendação
- Separar secrets: `APP_AUTH_SECRET_ADMIN` e `APP_AUTH_SECRET_CUSTOMER`
- Ou adicionar `audience` claim no JWT para distinguir
- Considerar refresh token para cliente

---

## 2. src/lib/auth/admin.ts

### Pontos Positivos
- bcrypt com salt rounds 12 (adequado)
- Login retorna session token
- `requireAdmin()` verifica sessão e role

### Problemas
- **Sem rate limiting**: Endpoint de login pode ser brute-forcado
- **Sem log de tentativas falhas**: Dificulta detecção de ataques
- **Não implementa 2FA** (ainda que não seja obrigatório para v1)
- **Senha em texto no seed**: `ADMIN_PASSWORD` em .env pode ser fraca

### Recomendação
- Implementar rate limiting (ex: max 5 tentativas / 15 min por IP)
- Logar tentativas falhas
- Validar força mínima da senha no seed/setup

---

## 3. src/lib/auth/customer.ts

### Pontos Positivos
- Delegação limpa para session.ts
- Separação de concerns

### Problemas
- **Não implementa customer real**: Apenas verifica sessão, não há customer ID persistente no JWT
- **Não há refresh token**: OTP expira e não há mecanismo de reautenticação silenciosa

---

## 4. src/app/api/auth/admin/login/route.ts

### Pontos Positivos
- Aceita tanto form (HTML) quanto JSON (API)
- Redirect adequado para form submissions
- Retorna token no body para JSON clients

### Problemas
- **Sem rate limiting no endpoint**
- **Mensagem de erro genérica** (não distingue email não encontrado de senha incorreta — isso é uma FEATURE de segurança, não bug)
- **Sem headers de segurança** (CSP, X-Frame-Options, etc.)

---

## 5. src/app/api/auth/admin/logout/route.ts

### Pontos Positivos
- Limpa cookie corretamente
- Redirect após logout

### Problemas
- **Não invalida token no servidor**: JWT continua válido até expirar (7 dias). Se alguém roubar o token, pode usar mesmo após logout.
- **Sem blacklist de tokens revogados**.

### Recomendação
- Implementar token blacklist (Redis ou banco) para invalidação imediata
- Ou usar sessões stateful no banco

---

## Resumo Geral Parte 2

| Aspecto | Status | Nota |
|---------|--------|------|
| JWT Implementation | ✅ Bom | jose, cookies httpOnly |
| Password Hashing | ✅ Bom | bcrypt 12 rounds |
| Session Management | ⚠️ Médio | Sem invalidação, mesmo secret |
| Rate Limiting | ❌ Faltando | Nenhum lugar |
| Audit/Logging | ❌ Faltando | Sem logs de tentativas |
| Token Revocation | ❌ Faltando | Logout não invalida |
| Separation of Concerns | ✅ Bom | Admin/Customer separados |

### Prioridade de Correção
1. **Alta**: Separar secrets admin/cliente
2. **Alta**: Implementar token blacklist para logout
3. **Média**: Rate limiting no login
4. **Média**: Refresh token para cliente
5. **Baixa**: 2FA para admin
