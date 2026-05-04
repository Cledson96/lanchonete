# Politica de auditoria de dependencias

## Gate de producao

O gate bloqueante de seguranca para dependencias de producao e:

```bash
npm run audit:prod
```

Esse script executa `npm audit --omit=dev --audit-level=high`. O objetivo e bloquear vulnerabilidades `high` e `critical` sem aplicar correcoes quebrantes com `npm audit fix --force`.

## Overrides seguros

Em 2026-05-04, o `next@16.2.4` e a versao estavel `latest` no npm. Essa versao ainda declara internamente `postcss@8.4.31`, mas o projeto usa `overrides` para resolver `postcss` para uma versao corrigida (`>= 8.5.10`) sem usar `npm audit fix --force`.

Tambem usamos override de `@hono/node-server` para corrigir a dependencia transitiva do Prisma sem downgrade. Nao usamos `npm audit fix --force`, pois o npm pode sugerir downgrades quebrantes.

## Reavaliacao

Reavaliar os overrides quando uma destas condicoes acontecer:

- `npm view next version` publicar uma versao estavel maior que `16.2.4`.
- `npm view next@latest dependencies --json` mostrar `postcss >= 8.5.10`.
- `npm view prisma@latest dependencies --json` deixar de puxar uma versao vulneravel de `@hono/node-server`.

Na reavaliacao, atualizar `next` e `eslint-config-next` juntos, rodar `npm install`, e validar:

```bash
npm run lint
npm run typecheck
npm run prisma:validate
APP_AUTH_SECRET=temporary-build-check-secret NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
npm run audit:prod
```
