# Plano do Backend v1 com Next.js App Router e Templates

## Resumo
A v1 usara `Next.js` na versao mais recente com `App Router`, `TypeScript`, `Tailwind` e `Route Handlers` para o backend. O projeto nasce com `create-next-app@latest` e depois e adaptado ao dominio da lanchonete. O frontend aproveita a estrutura nativa do Next com `layout.tsx`, `template.tsx`, route groups e segmentos dinamicos.

## Base do projeto
- Scaffold via `create-next-app@latest` com `--ts --tailwind --eslint --app --src-dir --use-npm`.
- Backend dentro do Next.js na v1.
- `App Router` como base unica.
- `TypeScript`, `Tailwind`, `ESLint` e alias `@/*`.

## Estrutura planejada
- `src/app/layout.tsx`: root layout global.
- `src/app/template.tsx`: template global.
- `src/app/(public)/*`: landing page, pedido e comanda.
- `src/app/(dashboard)/*`: dashboard interno.
- `src/app/api/*`: rotas HTTP do backend.
- `src/lib/*`: auth, Prisma, servicos e integracoes.

## Backend e rotas
- Rotas publicas:
  - `GET /api/menu`
  - `POST /api/customer/verification/request`
  - `POST /api/customer/verification/confirm`
  - `GET /api/customer/me`
  - `GET /api/customer/orders`
  - `POST /api/delivery-fee/quote`
  - `POST /api/orders`
  - `GET /api/orders/[code]`
  - `GET /api/comandas/slug/[slug]`
  - `GET /api/comandas/[id]`
  - `POST /api/comandas/[id]/items`
- Rotas internas:
  - `POST /api/auth/admin/login`
  - `POST /api/auth/admin/logout`
  - `GET /api/dashboard/orders`
  - `GET /api/dashboard/orders/[id]`
  - `POST /api/dashboard/orders/[id]/status`
  - `GET /api/dashboard/comandas`
  - `POST /api/dashboard/comandas/[id]/close`
  - `GET/POST/PATCH /api/menu/categories`
  - `GET/POST/PATCH /api/menu/items`
  - `GET/POST/PATCH /api/menu/option-groups`
  - `GET/POST/PATCH /api/delivery-fee-rules`
- Integracao:
  - `GET /api/whatsapp/webhook`
  - `POST /api/whatsapp/webhook`

## Regras de dominio
- Telefone e a identidade principal do cliente.
- Email e opcional.
- Todo pedido web exige validacao por codigo no WhatsApp.
- Pedido delivery exige `DeliveryFeeRule` valida.
- Pedido grava snapshot de cliente, pagamento e frete.
- Comanda local pode existir sem conta formal.
