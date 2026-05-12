# Plano Operacional da Refatoração Faseada

Este documento transforma `docs/plano-refatoracao-faseada.md` em um roteiro de execução.

> Neste documento, a **primeira fase** é a **Fase 0 — Preparação e proteção**.

---

## 1. Estratégia de execução por fase

### Fase 0 — Preparação e proteção
- **Objetivo operacional:** mapear contratos, fechar baseline dos hotspots e definir proteção mínima antes de refatorar código.
- **Entrada:** nenhuma.
- **Saídas obrigatórias:** documentação dos contratos por domínio, baseline dos hotspots e estratégia mínima de testes.
- **Critério de saída:** documentação fechada, revisada e suficiente para iniciar a Fase 1 sem descoberta estrutural grande.

### Fase 1 — Base compartilhada de tipos e serialização
- **Objetivo operacional:** introduzir DTOs e serialização centralizada antes de quebrar componentes grandes.
- **Entrada:** Fase 0 concluída.
- **Saídas obrigatórias:** tipos compartilhados por domínio, mapeadores centralizados e contratos de resposta previsíveis.
- **Critério de saída:** tipos deixam de ser redefinidos localmente nos fluxos prioritários e conversões espalhadas começam a desaparecer.

### Fase 2 — Correções arquiteturais pequenas
- **Objetivo operacional:** alinhar desvios importantes ao padrão `route -> service -> helper`.
- **Entrada:** Fase 1 concluída.
- **Saídas obrigatórias:** rotas finas, acesso a Prisma movido para service e respostas padronizadas.
- **Critério de saída:** rotas-alvo revisadas, com sucesso/erro consistentes.

### Fase 3 — Refatoração do checkout
- **Objetivo operacional:** reduzir risco no fluxo mais sensível ao usuário final.
- **Entrada:** Fase 1 concluída.
- **Saídas obrigatórias:** cálculos e validações extraídos, hooks de fluxo isolados e UI dividida por blocos.
- **Critério de saída:** componente principal mais declarativo e regras críticas protegidas por testes.

### Fase 4 — Refatoração do gerenciador de cardápio
- **Objetivo operacional:** atacar o maior hotspot da UI por responsabilidade.
- **Entrada:** Fase 1 concluída.
- **Saídas obrigatórias:** hooks de dados, helpers puros e componentes por seção.
- **Critério de saída:** arquivo raiz deixa de concentrar fetch, mutation, transformação e UI pesada ao mesmo tempo.

### Fase 5 — Refatoração do `whatsapp-service`
- **Objetivo operacional:** separar integração externa de formatação e regras de negócio.
- **Entrada:** Fase 1 concluída.
- **Saídas obrigatórias:** builders/templates organizados e adapter/client isolado.
- **Critério de saída:** payloads e mensagens ficam testáveis sem depender do transporte.

### Fase 6 — Modularização dos workspaces administrativos
- **Objetivo operacional:** reduzir acoplamento dos painéis administrativos restantes.
- **Entrada:** Fases 1 e 2 concluídas.
- **Saídas obrigatórias:** workspaces divididos por filtros, ações, listagem, detalhamento e blocos visuais.
- **Critério de saída:** componentes principais ficam menores e coordenadores.

### Fase 7 — Consolidação e endurecimento
- **Objetivo operacional:** remover duplicação residual e ampliar a proteção final.
- **Entrada:** fases anteriores concluídas.
- **Saídas obrigatórias:** revisão de duplicações, aderência arquitetural e expansão da cobertura crítica.
- **Critério de saída:** hotspots prioritários alinhados ao padrão dominante do projeto.

---

## 2. Ordem prática de execução

1. Executar a Fase 0 integralmente.
2. Só abrir a Fase 1 depois de fechar os documentos da Fase 0.
3. Executar Fase 2 antes das grandes quebras de UI.
4. Priorizar checkout (Fase 3) antes de cardápio (Fase 4).
5. Fechar WhatsApp e workspaces administrativos antes da consolidação final.

---

## 3. Plano detalhado da primeira fase: Fase 0

## 3.1 Objetivo da fase
Reduzir incerteza operacional antes de editar os hotspots principais.

## 3.2 Restrições e fatos já observados
- Hotspots priorizados no plano mestre:
  - `src/components/dashboard-cardapio-manager.tsx` (~2089 linhas)
  - `src/components/pedido-checkout.tsx` (~1498 linhas)
  - `src/lib/services/whatsapp-service.ts` (~1318 linhas)
  - `src/components/dashboard-orders-workspace.tsx` (~955 linhas)
  - `src/components/dashboard-comandas-workspace.tsx` (~895 linhas)
  - `src/lib/services/order-admin-service.ts` (~612 linhas)
- `package.json` ainda não expõe scripts de teste automatizado.
- A Fase 0 deve gerar documentação suficiente para destravar a Fase 1 sem refatoração prematura.

## 3.3 Arquivos a criar na Fase 0

### Diretório
- `docs/fase-0/`

### Documentos de contrato por domínio
- `docs/fase-0/checkout-contratos.md`
- `docs/fase-0/cardapio-contratos.md`
- `docs/fase-0/pedidos-contratos.md`
- `docs/fase-0/whatsapp-contratos.md`
- `docs/fase-0/settings-contratos.md`

### Documentos transversais
- `docs/fase-0/hotspots-baseline.md`
- `docs/fase-0/testes-minimos.md`
- `docs/fase-0/README.md`

## 3.4 Sequência de execução por arquivo

### Etapa 0 — Preparar estrutura da fase
1. Criar `docs/fase-0/README.md`.
2. Registrar no README:
   - objetivo da fase
   - lista dos documentos da fase
   - status de cada documento
   - checklist final de saída

**Entregável binário:** pasta criada e índice da fase existente.

### Etapa 1 — Fechar baseline dos hotspots
1. Criar `docs/fase-0/hotspots-baseline.md`.
2. Registrar para cada hotspot:
   - caminho do arquivo
   - tamanho aproximado
   - responsabilidade principal
   - responsabilidades secundárias
   - dependências diretas visíveis
   - risco principal de refatoração
3. Marcar prioridade explícita de ataque conforme o plano mestre.

**Arquivos-fonte para leitura nesta etapa:**
- `src/components/dashboard-cardapio-manager.tsx`
- `src/components/pedido-checkout.tsx`
- `src/lib/services/whatsapp-service.ts`
- `src/components/dashboard-orders-workspace.tsx`
- `src/components/dashboard-comandas-workspace.tsx`
- `src/lib/services/order-admin-service.ts`

**Entregável binário:** baseline fechado e priorizado.

### Etapa 2 — Mapear contratos do fluxo de checkout
1. Criar `docs/fase-0/checkout-contratos.md`.
2. Documentar:
   - entradas do frontend
   - chamadas HTTP consumidas
   - payloads enviados
   - respostas esperadas
   - services acionados
   - validações e dependências externas
   - pontos de serialização/conversão

**Arquivos-fonte mínimos:**
- `src/app/(public)/pedido/page.tsx`
- `src/components/pedido-checkout.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[code]/route.ts`
- `src/app/api/customer/lookup/route.ts`
- `src/app/api/customer/me/route.ts`
- `src/app/api/customer/verification/request/route.ts`
- `src/app/api/customer/verification/confirm/route.ts`
- `src/app/api/delivery-fee/quote/route.ts`
- `src/app/api/zip-code/lookup/route.ts`
- `src/app/api/store/status/route.ts`
- `src/lib/services/order-service.ts`
- `src/lib/services/customer-service.ts`
- `src/lib/services/verification-service.ts`
- `src/lib/services/delivery-fee-service.ts`
- `src/lib/services/store-settings-service.ts`

**Entregável binário:** contrato de checkout fechado.

### Etapa 3 — Mapear contratos do fluxo de cardápio
1. Criar `docs/fase-0/cardapio-contratos.md`.
2. Documentar leitura pública, administração, upload de imagem, categorias, itens e grupos de opção.

**Arquivos-fonte mínimos:**
- `src/app/(public)/page.tsx`
- `src/components/menu-browser.tsx`
- `src/components/menu-item-card.tsx`
- `src/components/menu-item-detail-dialog.tsx`
- `src/components/dashboard-cardapio-manager.tsx`
- `src/app/api/menu/route.ts`
- `src/app/api/menu/categories/route.ts`
- `src/app/api/menu/items/route.ts`
- `src/app/api/menu/option-groups/route.ts`
- `src/app/api/menu/items/image/route.ts`
- `src/lib/services/menu-service.ts`
- `src/lib/services/menu-admin-service.ts`

**Entregável binário:** contrato de cardápio fechado.

### Etapa 4 — Mapear contratos do fluxo de pedidos
1. Criar `docs/fase-0/pedidos-contratos.md`.
2. Documentar operação administrativa, consulta por cliente, status e itens/unidades.

**Arquivos-fonte mínimos:**
- `src/components/dashboard-orders-workspace.tsx`
- `src/components/dashboard-order-detail-sheet.tsx`
- `src/app/api/dashboard/orders/route.ts`
- `src/app/api/dashboard/orders/[id]/route.ts`
- `src/app/api/dashboard/orders/[id]/status/route.ts`
- `src/app/api/dashboard/orders/[id]/items/[itemId]/units/[unitId]/status/route.ts`
- `src/app/api/customer/orders/route.ts`
- `src/lib/services/order-admin-service.ts`
- `src/lib/services/order-item-unit-service.ts`
- `src/lib/services/order-service.ts`

**Entregável binário:** contrato de pedidos fechado.

### Etapa 5 — Mapear contratos do fluxo de WhatsApp
1. Criar `docs/fase-0/whatsapp-contratos.md`.
2. Documentar sessão, QR code, conexão, desconexão, conversas, mensagens e integração externa.

**Arquivos-fonte mínimos:**
- `src/components/dashboard-whatsapp-panel.tsx`
- `src/components/dashboard-whatsapp-conversation.tsx`
- `src/app/api/whatsapp/session/route.ts`
- `src/app/api/whatsapp/session/connect/route.ts`
- `src/app/api/whatsapp/session/disconnect/route.ts`
- `src/app/api/whatsapp/session/reset/route.ts`
- `src/app/api/whatsapp/session/qr/route.ts`
- `src/app/api/dashboard/whatsapp/conversations/route.ts`
- `src/app/api/dashboard/whatsapp/conversations/[id]/route.ts`
- `src/app/api/dashboard/whatsapp/conversations/[id]/messages/route.ts`
- `src/lib/services/whatsapp-service.ts`
- `src/lib/whatsapp-client.ts`
- `src/lib/integrations/whatsapp.ts`

**Entregável binário:** contrato de WhatsApp fechado.

### Etapa 6 — Mapear contratos do fluxo de settings
1. Criar `docs/fase-0/settings-contratos.md`.
2. Documentar configurações de loja, regras de entrega e dependências compartilhadas com checkout.

**Arquivos-fonte mínimos:**
- `src/components/dashboard-settings-manager.tsx`
- `src/app/api/dashboard/settings/route.ts`
- `src/app/api/delivery-fee-rules/route.ts`
- `src/app/api/store/status/route.ts`
- `src/lib/services/store-settings-service.ts`
- `src/lib/services/delivery-fee-service.ts`
- `src/lib/services/menu-admin-service.ts`

**Entregável binário:** contrato de settings fechado.

### Etapa 7 — Definir estratégia mínima de testes
1. Criar `docs/fase-0/testes-minimos.md`.
2. Registrar:
   - fluxos críticos a proteger primeiro
   - services/helpers com maior retorno de teste
   - lacunas de infraestrutura atual
   - proposta de framework de teste
   - ordem recomendada de adoção
3. Prioridade mínima recomendada:
   - `order-service.ts`
   - `delivery-fee-service.ts`
   - `order-admin-service.ts`
   - helpers de cálculo/serialização extraídos nas próximas fases
   - builders/formatadores do `whatsapp-service.ts`

**Decisão obrigatória desta etapa:** escolher e registrar a estratégia para testes unitários/lógicos, já que o repositório ainda não expõe scripts de teste.

**Entregável binário:** mapa mínimo de cobertura definido.

### Etapa 8 — Fechamento da fase
1. Revisar `docs/fase-0/*.md`.
2. Atualizar `docs/fase-0/README.md` com status final.
3. Registrar:
   - arquivos criados
   - riscos encontrados
   - dúvidas abertas para Fase 1
   - recomendação objetiva de início da Fase 1

**Entregável binário:** fase encerrada e pronta para handoff.

---

## 3.5 Template mínimo para os documentos de contrato

Cada arquivo `*-contratos.md` deve conter:
- objetivo do fluxo
- componentes/páginas envolvidas
- rotas envolvidas
- services envolvidos
- payloads de entrada
- payloads de saída
- validações aplicadas
- dependências externas
- pontos de serialização / conversão de tipos
- riscos para refatoração
- dúvidas abertas

---

## 3.6 Critérios de aceite da Fase 0
- [ ] `docs/fase-0/README.md` criado
- [ ] `docs/fase-0/hotspots-baseline.md` criado
- [ ] contratos de checkout, cardápio, pedidos, WhatsApp e settings documentados
- [ ] `docs/fase-0/testes-minimos.md` criado
- [ ] principais riscos registrados por fluxo
- [ ] recomendação de teste inicial definida
- [ ] Fase 1 desbloqueada sem dúvida estrutural relevante

---

## 3.7 Próximo passo depois da Fase 0
Com a Fase 0 concluída, o próximo documento a detalhar deve ser o plano operacional da **Fase 1**, usando os contratos e riscos mapeados aqui para decidir:
- nomes finais dos DTOs por domínio
- localização da camada de serialização
- rotas/services que devem migrar primeiro
- sequência segura de adoção por fluxo
