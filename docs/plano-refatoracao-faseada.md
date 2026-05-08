# Plano de Refatoração Faseada

## Resumo
Este documento registra um plano operacional de refatoração para reduzir complexidade local, padronizar contratos de dados e diminuir risco de manutenção sem trocar a arquitetura principal do projeto.

O foco está em três frentes:
- reduzir o tamanho e a responsabilidade dos maiores hotspots
- padronizar DTOs e serialização entre backend, rotas e frontend
- criar uma base mais segura para evolução com testes nos pontos críticos

---

## Objetivos
- reduzir acoplamento e responsabilidades misturadas em arquivos grandes
- manter o padrão atual de `route -> service -> helper`
- diminuir duplicação de tipos e mapeamentos
- centralizar normalização de valores vindos do Prisma
- tornar fluxos críticos mais fáceis de validar e refatorar

## Contexto atual
Padrões fortes já existentes no projeto:
- rotas geralmente finas
- regras de negócio concentradas em services
- validação centralizada
- autenticação explícita

Principais riscos identificados:
- componentes e services muito grandes
- tipos duplicados entre camadas
- normalização decimal espalhada
- pequenas quebras do padrão arquitetural
- ausência de testes automatizados visíveis nos hotspots principais

---

## Hotspots priorizados
1. `src/components/dashboard-cardapio-manager.tsx`
2. `src/components/pedido-checkout.tsx`
3. `src/lib/services/whatsapp-service.ts`
4. `src/components/dashboard-orders-workspace.tsx`
5. `src/components/dashboard-comandas-workspace.tsx`
6. `src/lib/services/order-admin-service.ts`

---

## Estratégia geral
Executar em fases curtas e verificáveis:
1. preparar e mapear riscos
2. criar base compartilhada de tipos e serialização
3. corrigir desvios arquiteturais pequenos
4. atacar fluxos críticos antes dos administrativos
5. consolidar padrões e cobertura mínima de testes

Princípios de execução:
- preferir extração incremental em vez de reescrita grande
- mover lógica pura primeiro, UI depois
- cada etapa deve deixar o sistema em estado executável
- toda fase deve ter verificação clara

---

## Fase 0 — Preparação e proteção
**Objetivo:** reduzir risco antes de abrir os maiores arquivos.

### Tarefas
#### 0.1 Mapear contratos dos fluxos críticos
- **Escopo:** checkout, cardápio, pedidos, WhatsApp e settings
- **Entrega:** lista dos inputs, outputs e dependências reais de cada fluxo
- **Estimativa:** 1h
- **Dependências:** nenhuma
- **Verificação:** contratos críticos documentados e revisados

#### 0.2 Consolidar baseline dos hotspots
- **Entrega:** lista oficial dos arquivos prioritários com tamanho aproximado e responsabilidades atuais
- **Estimativa:** 30min
- **Dependências:** nenhuma
- **Verificação:** backlog de hotspots fechado

#### 0.3 Definir estratégia mínima de testes
- **Foco:** services críticos, cálculos e transformações de dados
- **Estimativa:** 1h
- **Dependências:** 0.1
- **Verificação:** mapa mínimo de cobertura por criticidade definido

### Saída esperada
- backlog priorizado
- contratos críticos mapeados
- plano mínimo de proteção para refatoração

### Estimativa da fase
**Total:** 2h30

---

## Fase 1 — Base compartilhada de tipos e serialização
**Objetivo:** remover duplicação estrutural antes de quebrar componentes grandes.

### Tarefas
#### 1.1 Criar camada compartilhada de DTOs por domínio
- **Domínios:** cardápio, pedidos, checkout e settings
- **Estimativa:** 1h30
- **Dependências:** Fase 0
- **Verificação:** tipos principais deixam de ser redefinidos localmente

#### 1.2 Centralizar mapeamento `Prisma/Decimal -> payload`
- **Estimativa:** 1h30
- **Dependências:** 1.1
- **Verificação:** conversões `Number(...)` saem de páginas e componentes principais

#### 1.3 Padronizar shapes de resposta de API
- **Estimativa:** 1h
- **Dependências:** 1.1
- **Verificação:** contratos de resposta ficam previsíveis e compartilháveis

### Saída esperada
- DTOs compartilhados por domínio
- serialização centralizada
- menor risco de drift entre backend e frontend

### Estimativa da fase
**Total:** 4h

---

## Fase 2 — Correções arquiteturais pequenas e de alto valor
**Objetivo:** fechar desvios do padrão principal antes de mexer nos gigantes.

### Tarefas
#### 2.1 Mover Prisma direto de rota para service
- **Arquivo foco:** `src/app/api/menu/items/image/route.ts`
- **Estimativa:** 1h
- **Dependências:** Fase 1
- **Verificação:** rota deixa de acessar Prisma diretamente

#### 2.2 Padronizar respostas HTTP fora do helper central
- **Arquivos foco:**
  - `src/app/api/orders/route.ts`
  - `src/app/api/customer/lookup/route.ts`
- **Estimativa:** 1h
- **Dependências:** Fase 1
- **Verificação:** uso consistente de helpers de resposta e erro

#### 2.3 Revisar validação e tratamento de erro nas rotas alteradas
- **Estimativa:** 45min
- **Dependências:** 2.1, 2.2
- **Verificação:** comportamento esperado mantido para sucesso e erro

### Saída esperada
- padrão `route -> service -> helper` mais consistente

### Estimativa da fase
**Total:** 2h45

---

## Fase 3 — Refatoração do checkout
**Objetivo:** reduzir risco no fluxo mais sensível ao usuário.

### Tarefas
#### 3.1 Separar tipos, helpers e cálculos puros
- **Arquivo foco:** `src/components/pedido-checkout.tsx`
- **Estimativa:** 1h30
- **Dependências:** Fase 1
- **Verificação:** regras de cálculo e validação saem do componente principal

#### 3.2 Extrair hooks de fluxo
- **Exemplos:** submissão, loading, erro, validações, estado derivado
- **Estimativa:** 2h
- **Dependências:** 3.1
- **Verificação:** componente principal fica mais declarativo

#### 3.3 Separar UI por etapa/bloco
- **Exemplos:** entrega, pagamento, resumo e confirmação
- **Estimativa:** 2h
- **Dependências:** 3.2
- **Verificação:** subcomponentes independentes funcionando

#### 3.4 Adicionar testes do fluxo crítico extraído
- **Foco:** cálculos, regras, erros e validações
- **Estimativa:** 2h
- **Dependências:** 3.1
- **Verificação:** happy path, edge cases e error cases cobertos

### Saída esperada
- checkout modular
- regras isoladas
- menor risco de regressão futura

### Estimativa da fase
**Total:** 7h30

---

## Fase 4 — Refatoração do gerenciador de cardápio
**Objetivo:** quebrar o maior hotspot da UI.

### Tarefas
#### 4.1 Identificar subdomínios internos do arquivo
- **Exemplos:** categorias, itens, ordenação, imagem, publicação
- **Estimativa:** 1h
- **Dependências:** Fase 1
- **Verificação:** mapa de responsabilidades fechado

#### 4.2 Extrair hooks de dados e ações
- **Estimativa:** 2h
- **Dependências:** 4.1
- **Verificação:** fetches e mutations saem do componente principal

#### 4.3 Extrair helpers puros de transformação e ordenação
- **Estimativa:** 1h30
- **Dependências:** 4.1
- **Verificação:** lógica não visual isolada e reutilizável

#### 4.4 Dividir UI em componentes por seção
- **Estimativa:** 3h
- **Dependências:** 4.2, 4.3
- **Verificação:** componente raiz passa a coordenar em vez de concentrar tudo

#### 4.5 Adicionar testes das regras extraídas
- **Estimativa:** 2h
- **Dependências:** 4.3
- **Verificação:** transformações e regras críticas cobertas

### Saída esperada
- maior arquivo do projeto reduzido
- responsabilidades separadas
- base mais fácil para evolução do cardápio

### Estimativa da fase
**Total:** 9h30

---

## Fase 5 — Refatoração do `whatsapp-service`
**Objetivo:** separar integração externa de regras de negócio.

### Tarefas
#### 5.1 Separar montagem de mensagem de envio
- **Estimativa:** 1h30
- **Dependências:** Fase 1
- **Verificação:** builders e formatters deixam de depender da camada de transporte

#### 5.2 Extrair client ou adapter de integração
- **Estimativa:** 1h30
- **Dependências:** 5.1
- **Verificação:** integração externa fica isolada

#### 5.3 Organizar templates e builders por caso de uso
- **Estimativa:** 2h
- **Dependências:** 5.1
- **Verificação:** cada mensagem tem responsabilidade clara

#### 5.4 Adicionar testes dos builders e regras principais
- **Estimativa:** 2h
- **Dependências:** 5.1, 5.3
- **Verificação:** mensagens e payloads corretos por cenário

### Saída esperada
- service menor
- integração externa mais testável
- menor acoplamento entre formatação e envio

### Estimativa da fase
**Total:** 7h

---

## Fase 6 — Modularização dos workspaces administrativos
**Objetivo:** reduzir complexidade dos painéis grandes restantes.

### Tarefas
#### 6.1 Modularizar `dashboard-orders-workspace.tsx`
- **Foco:** filtros, ações, listagem e detalhamento
- **Estimativa:** 3h
- **Dependências:** Fases 1 e 2
- **Verificação:** responsabilidades distribuídas em módulos menores

#### 6.2 Modularizar `dashboard-comandas-workspace.tsx`
- **Foco:** estado, listagem, ações e blocos visuais
- **Estimativa:** 3h
- **Dependências:** Fases 1 e 2
- **Verificação:** componente principal reduzido e mais claro

#### 6.3 Revisar `dashboard-settings-manager.tsx`
- **Foco:** mover tipos e helpers locais para camadas compartilhadas
- **Estimativa:** 1h30
- **Dependências:** Fase 1
- **Verificação:** menos duplicação local

#### 6.4 Adicionar testes das regras extraídas
- **Estimativa:** 2h
- **Dependências:** 6.1, 6.2, 6.3
- **Verificação:** regras críticas cobertas

### Saída esperada
- workspaces administrativos menos acoplados
- melhor legibilidade e manutenção

### Estimativa da fase
**Total:** 9h30

---

## Fase 7 — Consolidação e endurecimento
**Objetivo:** garantir consistência final depois das extrações principais.

### Tarefas
#### 7.1 Revisar duplicação residual
- **Escopo:** tipos, mapeamentos, helpers e regras repetidas
- **Estimativa:** 1h30
- **Dependências:** fases anteriores concluídas
- **Verificação:** duplicações relevantes eliminadas ou registradas

#### 7.2 Revisar aderência aos padrões do projeto
- **Foco:** rotas finas, services focados, helpers puros, responsabilidades claras
- **Estimativa:** 1h
- **Dependências:** fases anteriores concluídas
- **Verificação:** hotspots principais alinhados ao padrão dominante

#### 7.3 Expandir cobertura dos fluxos críticos
- **Escopo:** pedido, checkout, delivery, settings e integrações críticas
- **Estimativa:** 2h30
- **Dependências:** extrações concluídas
- **Verificação:** proteção mínima ampliada para os fluxos mais sensíveis

### Saída esperada
- padronização final
- dívida técnica residual menor

### Estimativa da fase
**Total:** 5h

---

## Ordem recomendada de execução
1. Fase 0 — Preparação e proteção
2. Fase 1 — Base compartilhada de tipos e serialização
3. Fase 2 — Correções arquiteturais pequenas
4. Fase 3 — Refatoração do checkout
5. Fase 4 — Refatoração do gerenciador de cardápio
6. Fase 5 — Refatoração do `whatsapp-service`
7. Fase 6 — Modularização dos workspaces administrativos
8. Fase 7 — Consolidação e endurecimento

---

## Caminho crítico
As etapas que mais destravam o restante do trabalho são:
- **Fase 1**, porque reduz retrabalho em várias áreas
- **Fase 3**, porque protege o fluxo mais sensível ao usuário
- **Fase 4**, porque ataca o maior hotspot do projeto

---

## Estratégia de testes
### Prioridade alta
- cálculos e transformações de dados
- regras de negócio em services
- validações e serialização
- builders de mensagens e integrações críticas

### Prioridade média
- fluxos integrados de rota + service
- hooks de UI críticos

### Meta recomendada
- **Crítico:** 100%
- **Alto impacto:** 90%+
- **Utilitários e helpers:** 80%+

---

## Riscos e mitigação
### Risco 1 — Regressão no checkout
**Mitigação:** extrair lógica pura antes de quebrar a UI.

### Risco 2 — Drift entre backend e frontend
**Mitigação:** criar DTOs compartilhados logo na Fase 1.

### Risco 3 — Refatorar arquivo gigante sem fronteiras claras
**Mitigação:** quebrar por responsabilidade, não apenas por tamanho.

### Risco 4 — Falta de testes durante a refatoração
**Mitigação:** adicionar testes junto da extração, não só ao final.

---

## Estimativa total
- **Tempo total:** ~48h a 50h
- **Complexidade geral:** alta
- **Abordagem recomendada:** ciclos curtos, fase por fase

---

## Plano de execução por sprint
### Sprint 1
- Fase 0
- Fase 1
- Fase 2

### Sprint 2
- Fase 3

### Sprint 3
- Fase 4

### Sprint 4
- Fase 5
- Fase 6

### Sprint 5
- Fase 7

---

## Instruções para outro agente executar este plano
Use este documento como plano mestre. Em cada fase:

1. leia a fase inteira antes de editar qualquer arquivo
2. confirme dependências da fase anterior
3. execute as tarefas na ordem indicada
4. mantenha as mudanças pequenas e verificáveis
5. ao final da fase, registre:
   - arquivos alterados
   - decisões tomadas
   - riscos encontrados
   - pendências abertas
6. não inicie a próxima fase sem validar a atual

### Regra operacional
Sempre que possível:
- extrair lógica pura primeiro
- depois extrair tipos/serialização compartilhada
- por último quebrar UI e orchestration

### Checklist mínimo por fase
- [ ] objetivo da fase atendido
- [ ] dependências respeitadas
- [ ] arquivos afetados revisados
- [ ] comportamento crítico verificado
- [ ] testes adicionados ou atualizados quando aplicável
- [ ] pendências registradas

---

## Próximo passo recomendado
Transformar este plano mestre em um plano operacional por fase, com:
- arquivos exatos a criar ou mover
- sequência de edição por arquivo
- entregáveis binários por etapa
- tarefas pequenas o suficiente para execução por agente
