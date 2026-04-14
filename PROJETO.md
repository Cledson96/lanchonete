# Lanchonete Familia — Guia do Projeto

## Visão Geral

Plataforma fullstack para a **Lanchonete Familia**, com três frentes integradas:

1. **Landing page pública** com cardápio completo e pedido web
2. **Dashboard operacional** com visões por etapa (atendimento, cozinha, expedição, caixa, admin)
3. **Integração WhatsApp** para entrada de pedidos e atualização automática de status

A v1 cobre cardápio público, pedido pelo site, pedido automatizado pelo WhatsApp, consumo no local via comanda QR code, e dashboard único — **sem pagamento online**.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Webpack) |
| Linguagem | TypeScript 5.9 |
| Frontend | React 19, Tailwind CSS 4 |
| Banco | PostgreSQL 16 (local) / Neon (remoto) |
| ORM | Prisma 7 com adapter `@prisma/adapter-pg` |
| Auth | JWT com `jose` (HS256), cookies httpOnly |
| WhatsApp | `whatsapp-web.js` (Puppeteer/Chromium) |
| Validação | Zod 4 |
| QR Code | `qrcode` (geração de QR para comandas e WhatsApp) |
| Senhas | `bcryptjs` |
| API Docs | Swagger UI (`swagger-ui-react`) |

---

## Estrutura de Pastas

```
lanchonete/
├── docs/                          # Documentação de planejamento
│   ├── plano-lanchonete-v1.md     # Plano geral da plataforma
│   ├── plano-backend-v1.md        # Plano do backend com rotas
│   ├── plano-landing-page-v1.md    # Plano visual da landing
│   ├── modelo-dados.md            # Resumo do modelo Prisma
│   ├── database-setup.md           # Setup do banco local/remoto
│   ├── whatsapp-webjs-setup.md     # Setup do WhatsApp Web.js
│   └── cardapio-auditoria.md      # Auditoria dos itens do cardápio
├── prisma/
│   ├── schema.prisma              # Schema completo do banco
│   ├── seed.ts                    # Seed com dados do cardápio real
│   └── migrations/                # Migrações do Prisma
├── scripts/
│   └── db/                        # Scripts de setup do PostgreSQL local
│       ├── install-postgres-local.sh
│       ├── init-local-cluster.sh
│       ├── start-local-db.sh
│       ├── stop-local-db.sh
│       ├── status-local-db.sh
│       ├── psql-local.sh
│       ├── smoke-test-local-db.sh
│       ├── print-env.sh
│       └── common.sh
├── public/
│   ├── branding/                  # Logo wordmark + selo (PNG)
│   ├── landing/                    # Imagens da landing page
│   ├── menu-catalog/              # Fotos dos itens do cardápio (WebP)
│   └── window.svg, next.svg, etc.
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fontes, metadata)
│   │   ├── globals.css            # CSS vars, Tailwind, estilos globais
│   │   ├── error.tsx / loading.tsx / not-found.tsx / template.tsx
│   │   ├── (public)/              # Route group público
│   │   │   ├── layout.tsx         # Header + CartProvider
│   │   │   ├── page.tsx           # Landing page (hero + cardápio)
│   │   │   ├── pedido/            # Fluxo de pedido web
│   │   │   │   ├── page.tsx       # Checkout de pedido
│   │   │   │   ├── [code]/        # Acompanhamento de pedido
│   │   │   │   └── sucesso/       # Confirmação
│   │   │   └── comanda/
│   │   │       └── [slug]/         # Comanda por QR code
│   │   ├── (dashboard)/           # Route group protegido
│   │   │   ├── layout.tsx         # Sidebar + auth check
│   │   │   └── dashboard/
│   │   │       ├── page.tsx       # Métricas
│   │   │       ├── cozinha/       # Fila de preparo
│   │   │       ├── expedicao/      # Pedidos prontos/saiu para entrega
│   │   │       ├── pedidos/        # Arquivo de pedidos
│   │   │       ├── comandas/       # Comandas abertas
│   │   │       ├── cardapio/       # CRUD do cardápio
│   │   │       └── whatsapp/       # Painel WhatsApp
│   │   ├── dashboard/
│   │   │   └── login/             # Login do admin
│   │   ├── api/                   # Route Handlers (backend)
│   │   │   ├── auth/admin/        # Login/logout admin
│   │   │   ├── menu/              # CRUD cardápio + categorias + opções
│   │   │   ├── orders/            # Criar e consultar pedidos
│   │   │   ├── comandas/          # Comandas e itens
│   │   │   ├── customer/          # Verificação, lookup, perfil
│   │   │   ├── delivery-fee/      # Cotação de frete
│   │   │   ├── delivery-fee-rules/# CRUD regras de frete
│   │   │   ├── dashboard/         # Orders, comandas, whatsapp (admin)
│   │   │   ├── whatsapp/          # Webhook + sessão/QR
│   │   │   ├── docs/              # Swagger UI
│   │   │   └── openapi.json/      # Spec OpenAPI
│   │   └── api-docs/              # Página de docs da API
│   ├── components/                # Componentes React
│   │   ├── brand-logo.tsx         # Logo SVG da marca
│   │   ├── cart-button.tsx        # Botão do carrinho
│   │   ├── cart-drawer.tsx        # Drawer do carrinho
│   │   ├── category-nav.tsx       # Navegação por categorias
│   │   ├── menu-browser.tsx       # Browser do cardápio
│   │   ├── menu-item-card.tsx     # Card de item do cardápio
│   │   ├── menu-item-detail-dialog.tsx
│   │   ├── pedido-checkout.tsx    # Checkout de pedido
│   │   ├── comanda-*.tsx          # Componentes de comanda
│   │   ├── dashboard-*.tsx        # Componentes do dashboard
│   │   └── public-comanda-experience.tsx
│   └── lib/
│       ├── auth/
│       │   ├── admin.ts           # Login/logout admin
│       │   ├── customer.ts        # Verificação e sessão de cliente
│       │   └── session.ts         # JWT sign/verify com jose
│       ├── integrations/
│       │   └── whatsapp.ts        # Bot de atendimento WhatsApp
│       ├── services/              # Lógica de negócio
│       │   ├── menu-service.ts
│       │   ├── menu-admin-service.ts
│       │   ├── order-service.ts
│       │   ├── order-admin-service.ts
│       │   ├── comanda-service.ts
│       │   ├── customer-service.ts
│       │   ├── delivery-fee-service.ts
│       │   ├── verification-service.ts
│       │   └── whatsapp-service.ts
│       ├── brand-content.ts       # Conteúdo da marca (nome, WhatsApp, horários)
│       ├── cart-store.tsx         # Estado do carrinho (React Context)
│       ├── comanda-ui.ts          # Helpers de UI para comandas
│       ├── config.ts              # Variáveis de ambiente centralizadas
│       ├── geocoding.ts           # Geocodificação para entrega
│       ├── http.ts                 # Helpers HTTP
│       ├── menu-images.ts         # Mapeamento de imagens do cardápio
│       ├── menu-images.shared.ts  # Imagens compartilhadas
│       ├── openapi.ts             # Definição OpenAPI
│       ├── prisma.ts              # Cliente Prisma singleton
│       ├── request.ts             # Helpers de request
│       ├── utils.ts               # Utilitários gerais
│       ├── validators.ts          # Schemas Zod
│       └── whatsapp-client.ts     # Manager do WhatsApp Web.js
├── cardapio/                      # Fotos originais do cardápio físico
├── .env.example                   # Template de variáveis de ambiente
├── .env.local                     # Variáveis locais (gitignored)
├── next.config.ts                 # Config do Next.js
├── prisma.config.ts               # Config do Prisma CLI
├── tsconfig.json                  # TypeScript config
├── eslint.config.mjs              # ESLint flat config
├── postcss.config.mjs             # PostCSS (Tailwind)
└── package.json                   # Dependências e scripts
```

---

## Modelo de Dados (Prisma)

### Entidades principais

| Modelo | Descrição |
|--------|-----------|
| `User` | Contas de acesso (admin, atendimento, cozinha, entrega, caixa, cliente) |
| `CustomerProfile` | Dados do cliente (nome, telefone, endereços, opt-in WhatsApp) |
| `Address` | Endereços de entrega do cliente |
| `StoreProfile` | Dados da loja (endereço, coordenadas, raio de entrega) |
| `Category` | Categorias do cardápio (Lanches, Sucos, Combos, etc.) |
| `MenuItem` | Itens do cardápio (simples ou combo) |
| `MenuItemComponent` | Componentes de um combo (relação N:N) |
| `OptionGroup` | Grupos de adicionais/opções (tamanho, sabor, extra) |
| `OptionItem` | Opções dentro de um grupo (ex: "Catupiry", +R$2) |
| `MenuItemOptionGroup` | Relação N:N entre MenuItem e OptionGroup |
| `Order` | Pedido (web, WhatsApp, local) com status e totais |
| `OrderItem` | Itens do pedido com preço congelado |
| `OrderItemOption` | Adicionais selecionados no item do pedido |
| `OrderStatusEvent` | Histórico auditável de mudanças de status |
| `Comanda` | Conta aberta para consumo no local (QR code) |
| `ComandaEntry` | Adição de item na comanda |
| `ComandaEntryOption` | Adicionais na entrada da comanda |
| `DeliveryFeeRule` | Regras de frete por região/CEP/distância |
| `WhatsAppConversation` | Estado da conversa automatizada |
| `WhatsAppMessage` | Mensagens trocadas no WhatsApp |
| `PhoneVerificationChallenge` | OTP para validar telefone no checkout |

### Enums principais

- **UserRole**: `admin`, `atendimento`, `cozinha`, `entrega`, `caixa`, `cliente`
- **OrderChannel**: `web`, `whatsapp`, `local`
- **OrderType**: `delivery`, `retirada`, `local`
- **OrderStatus**: `novo` → `aceito` → `em_preparo` → `pronto` → `saiu_para_entrega` → `entregue` → `fechado` / `cancelado`
- **PaymentMethod**: `dinheiro`, `cartao_credito`, `cartao_debito`, `pix`, `outro`
- **PaymentStatus**: `pendente`, `combinado`, `pago`, `cancelado`
- **MenuItemKind**: `simples`, `combo`

---

## Rotas Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page com hero, cardápio completo e CTAs |
| `/pedido` | Checkout de pedido (delivery ou retirada) |
| `/pedido/[code]` | Acompanhamento de pedido por código |
| `/pedido/sucesso` | Confirmação de pedido |
| `/comanda/[slug]` | Comanda acessada por QR code |

---

## Rotas do Dashboard (protegidas)

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Métricas gerais (pedidos hoje, faturamento, canais) |
| `/dashboard/cozinha` | Fila de preparo em tempo real |
| `/dashboard/expedicao` | Pedidos prontos e saída para entrega |
| `/dashboard/pedidos` | Arquivo de pedidos concluídos/cancelados |
| `/dashboard/comandas` | Comandas abertas e fechamento |
| `/dashboard/cardapio` | CRUD de categorias, itens, opções e imagens |
| `/dashboard/whatsapp` | Painel do WhatsApp (conexão, QR, conversas) |
| `/dashboard/login` | Login do admin |

---

## APIs (Route Handlers)

### Públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/menu` | Cardápio completo (categorias com itens) |
| POST | `/api/orders` | Criar pedido web |
| GET | `/api/orders/[code]` | Consultar pedido por código |
| POST | `/api/comandas/[id]/items` | Adicionar item na comanda |
| GET | `/api/comandas/[id]` | Consultar comanda |
| GET | `/api/comandas/slug/[slug]` | Buscar comanda por QR slug |
| POST | `/api/customer/verification/request` | Solicitar OTP por WhatsApp |
| POST | `/api/customer/verification/confirm` | Confirmar OTP |
| GET | `/api/customer/me` | Perfil do cliente logado |
| GET | `/api/customer/orders` | Pedidos do cliente |
| POST | `/api/delivery-fee/quote` | Cotação de frete |
| GET | `/api/whatsapp/webhook` | Verificação do webhook |
| POST | `/api/whatsapp/webhook` | Receber mensagens do WhatsApp |

### Internas (admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/admin/login` | Login admin |
| POST | `/api/auth/admin/logout` | Logout admin |
| GET | `/api/dashboard/orders` | Listar pedidos (admin) |
| GET | `/api/dashboard/orders/[id]` | Detalhe do pedido |
| POST | `/api/dashboard/orders/[id]/status` | Mudar status do pedido |
| GET | `/api/dashboard/comandas` | Listar comandas |
| POST | `/api/dashboard/comandas/[id]/close` | Fechar comanda |
| GET/POST/PATCH | `/api/menu/categories` | CRUD categorias |
| GET/POST/PATCH | `/api/menu/items` | CRUD itens do cardápio |
| GET/POST/PATCH | `/api/menu/option-groups` | CRUD grupos de opções |
| GET/POST/PATCH | `/api/delivery-fee-rules` | CRUD regras de frete |
| GET | `/api/dashboard/whatsapp/conversations` | Listar conversas |
| GET | `/api/dashboard/whatsapp/conversations/[id]` | Detalhe da conversa |
| GET | `/api/dashboard/whatsapp/conversations/[id]/messages` | Mensagens |
| GET | `/api/whatsapp/session` | Status da sessão WhatsApp |
| GET | `/api/whatsapp/session/qr` | QR code para pareamento |
| POST | `/api/whatsapp/session/connect` | Iniciar conexão |
| POST | `/api/whatsapp/session/disconnect` | Desconectar |
| POST | `/api/whatsapp/session/reset` | Resetar sessão |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/openapi.json` | Spec OpenAPI |

---

## Autenticação

- **Admin**: JWT (HS256) via `jose`, cookie `lanchonete_admin`, expira em 7 dias
- **Cliente**: JWT (HS256) via `jose`, cookie `lanchonete_customer`, expira em 30 minutos
- Senhas hasheadas com `bcryptjs`
- Verificação de telefone via OTP enviado pelo WhatsApp
- Sessão admin verificada em `getAdminSession()` no layout do dashboard
- Sessão de cliente verificada em `getCustomerSession()` nas rotas protegidas

---

## WhatsApp

- **Biblioteca**: `whatsapp-web.js` com Puppeteer (headless Chromium)
- **Sessão**: Persistida em disco local (`.runtime/whatsapp-session/`)
- **Conexão**: Dashboard → escanear QR → status conectado
- **Funcionalidades v1**:
  - Envio de OTP do checkout
  - Mensagens automáticas de status do pedido (aceito, em preparo, saiu para entrega)
  - Bot textual de pedido pelo WhatsApp
  - Inbox simples no dashboard
- **Limitação**: Arquitetura para processo único Node em VPS (não serverless)

---

## Banco de Dados

### Local (desenvolvimento)

- PostgreSQL 16 instalado em espaço de usuário (sem instalação global)
- Cluster em `~/.local/share/lanchonete-postgres/data`
- Porta `54329`, banco `lanchonete_dev`, usuário `lanchonete_app`
- Scripts em `scripts/db/` para instalar, iniciar, parar e gerenciar

### Remoto (produção)

- Planejado para Neon (PostgreSQL serverless)
- `DATABASE_REMOTE_URL` para runtime, `DIRECT_DATABASE_REMOTE_URL` para migrations
- Em dev, `DATABASE_URL` aponta para o banco local

### Comandos Prisma

```bash
# Formatar schema
npm run prisma:format

# Validar schema
npm run prisma:validate

# Gerar client
npm run prisma:generate

# Rodar seed
npm run prisma:seed
```

---

## Variáveis de Ambiente

Ver `.env.example` para referência completa:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do banco local (PostgreSQL) |
| `DATABASE_REMOTE_URL` | URL pooled da Neon (produção) |
| `DIRECT_DATABASE_REMOTE_URL` | URL direta da Neon (migrations) |
| `USE_LOCAL_DB_ON_START` | Forçar banco local em produção |
| `APP_AUTH_SECRET` | Segredo JWT |
| `ADMIN_EMAIL` | Email do admin |
| `ADMIN_PHONE` | Telefone do admin |
| `ADMIN_PASSWORD` | Senha do admin |
| `NEXT_PUBLIC_WHATSAPP_URL` | URL pública do WhatsApp |
| `WHATSAPP_SESSION_PATH` | Caminho da sessão WhatsApp |
| `WHATSAPP_HEADLESS` | Rodar Chromium headless |
| `WHATSAPP_CLIENT_NAME` | Nome da sessão WhatsApp |
| `WHATSAPP_ALLOWED_COUNTRY_CODE` | DDI permitido (default: 55) |
| `WHATSAPP_BOT_ENABLED` | Ligar/desligar bot |
| `NEON_API_KEY` | API key da Neon (opcional) |

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia o Next.js em modo dev (webpack)

# Build e produção
npm run build            # Build de produção
npm run start            # Inicia o servidor de produção

# Qualidade
npm run lint             # ESLint com zero warnings
npm run typecheck        # Verificação de tipos TypeScript

# Prisma
npm run prisma:format    # Formata o schema
npm run prisma:validate  # Valida o schema
npm run prisma:generate  # Gera o client
npm run prisma:seed      # Popula o banco com dados do cardápio

# Banco local
./scripts/db/start-local-db.sh    # Inicia o PostgreSQL local
./scripts/db/stop-local-db.sh     # Para o PostgreSQL local
./scripts/db/status-local-db.sh   # Status do banco
./scripts/db/print-env.sh         # Imprime variáveis para .env.local
```

---

## Padrões e Convenções

### Paths e imports
- Alias `@/*` mapeia para `./src/*`
- Route groups: `(public)` para páginas públicas, `(dashboard)` para admin

### CSS e Design
- **Paleta principal**: Laranja `#f27a22` (marca/ação), Verde `#8cc63f` (sucesso/verde)
- **Fundo**: Creme `#fdfaf6`, Superfície branca
- **Fontes**: Plus Jakarta Sans (corpo), Sora (display/headlines), IBM Plex Mono (mono)
- **Border radius**: `--radius-sm: 0.75rem` até `--radius-xl: 2.25rem` (visual arredondado)
- **Sombras**: Tons de laranja sutis (`--shadow-sm`, `--shadow-md`, `--shadow-lg`)
- CSS custom properties em `globals.css`, tema inline no `@theme`

### Componentes
- Componentes server por padrão (RSC)
- `"use client"` apenas quando necessário (carrinho, interatividade)
- Estado do carrinho via React Context (`CartProvider` + `useCart`)

### Branding
- Nome público: **Lanchonete Familia**
- Logo em SVG/React (`BrandLogo` component) com variantes: `compact`, `menu-style`, `dark`
- Conteúdo da marca centralizado em `src/lib/brand-content.ts`
- Imagens de produto em `public/menu-catalog/` (WebP)

---

## Fluxos Principais

### 1. Pedido Web (delivery ou retirada)
1. Cliente acessa `/` → navega o cardápio → adiciona itens ao carrinho
2. Clica em "Pedir agora" → vai para `/pedido`
3. Preenche dados, escolhe delivery ou retirada
4. Se delivery, calcula frete via `DeliveryFeeRule`
5. Confirma telefone via OTP enviado pelo WhatsApp
6. Pedido criado com status `novo` → entra na fila do dashboard
7. Admin aceita → status muda para `aceito` → mensagem automática no WhatsApp

### 2. Comanda Local (QR code)
1. Cliente escaneia QR code → acessa `/comanda/[slug]`
2. Visualiza a comanda e adiciona itens ao longo do tempo
3. Cada adição gera `ComandaEntry` com total acumulado
4. Cozinha recebe os itens via dashboard
5. Caixa fecha a comanda → status `fechado`

### 3. Pedido via WhatsApp
1. Cliente manda mensagem → `WhatsAppConversation` criada
2. Bot guiado coleta canal, itens, quantidade, adicionais, endereço
3. Pedido criado com `channel: whatsapp` → entra na mesma fila
4. Atualizações de status disparam mensagens automáticas

---

## Estado Atual do Projeto

- ✅ Landing page funcional com cardápio completo
- ✅ Checkout de pedido web (delivery + retirada)
- ✅ Dashboard operacional com métricas, cozinha, expedição, comandas
- ✅ CRUD do cardápio no dashboard
- ✅ Integração WhatsApp (conexão, QR, mensagens, bot)
- ✅ Comanda por QR code
- ✅ Autenticação admin e cliente
- ✅ Verificação de telefone por OTP
- ✅ Seed com dados reais do cardápio
- ✅ Banco local com scripts de setup
- ✅ API documentada com OpenAPI/Swagger