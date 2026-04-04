# Plano da Landing Page - Lanchonete Familia

## Resumo
A landing page substitui o placeholder atual da rota `/` por uma home de alto impacto, responsiva e profissional, com direcao visual `artesanal premium`, hero com `foto forte de lanche`, paleta `verde + laranja` e `cardapio completo na propria home`. A marca sera apresentada como `Lanchonete Familia`, com logo novo em formato `wordmark + selo`, criado em codigo/SVG para nascer consistente no site.

### Tese visual
Uma lanchonete familiar com presenca premium: calor caseiro, apetite imediato e acabamento contemporaneo.

### Plano de conteudo
`Hero-poster -> prova rapida de confianca -> cardapio completo -> experiencia/familia -> CTA final`

### Tese de interacao
- entrada suave do hero com foco em marca, headline e prato principal
- navegacao/ancoras do cardapio com comportamento sticky no scroll
- hover e microinteracoes so em CTAs, navegacao de categorias e itens do cardapio

## Mudancas de implementacao
### Direcao de arte e branding
- Reposicionar a home como marca de consumo, nao como pagina tecnica do sistema.
- Trocar o tom atual de "plataforma/operacao" por linguagem de marca, apetite e conveniencia.
- Criar um logo novo com:
  - `wordmark` principal "Lanchonete Familia"
  - `selo` auxiliar pequeno para favicon, header, CTA e assinatura visual
  - construcao vetorial/SVG, sem depender de imagem raster
- Definir um sistema visual com:
  - verde principal quente/oliva como base da marca
  - laranja vibrante como cor de acao e apetite
  - neutros cremosos/off-white para fundo
  - tipografia mais expressiva para marca/headline e tipografia limpa para leitura/UI
- Remover da landing publica qualquer destaque de Swagger/dashboard como CTA principal; a home deve vender a marca e o pedido.

### Estrutura da landing
- Hero full-bleed na primeira dobra, sem container centralizado "boxado".
- Header enxuto com:
  - logo
  - links para `Cardapio`, `Peca agora`, `WhatsApp`
  - CTA principal de pedido
- Hero com:
  - marca forte no topo da hierarquia
  - headline curta e memoravel
  - subtexto curto
  - CTA primario para `/pedido`
  - CTA secundario para WhatsApp
  - foto dominante de lanche com tratamento premium
- Secao de apoio logo apos o hero com 3 promessas rapidas:
  - pedido facil
  - atendimento familiar
  - delivery/retirada/comanda local
- Cardapio completo na propria home:
  - consumir `GET /api/menu`
  - categorias como navegacao por ancora ou tabs sticky
  - itens apresentados como linhas/editorial blocks, nao grade generica de cards
  - destaque visual para combos, lanches e sucos mais fortes
  - preco, descricao curta e indicacao de adicionais disponiveis
- Secao de atmosfera e marca:
  - reforcar "familia", cuidado, sabor e conveniencia
  - incluir bloco curto sobre pedido por site e WhatsApp
- CTA final:
  - repetir "Peca agora"
  - reforcar WhatsApp
  - mostrar horario/endereco se essas informacoes ja estiverem disponiveis no conteudo da marca

### Responsividade e experiencia
- Desktop:
  - hero em composicao de poster com texto ancorado em area calma e imagem dominante
  - cardapio com navegacao visivel e ritmo editorial
- Mobile:
  - hero reorganizado para leitura imediata
  - CTA visivel sem competir com a imagem
  - navegacao de categorias horizontal e sticky
  - cardapio facil de percorrer com toque
- Motion:
  - reveal suave no hero
  - animacao discreta de entrada das categorias
  - hover refinado em CTAs e nos blocos principais
- Performance:
  - usar imagem hero otimizada e poucas animacoes pesadas
  - preservar legibilidade e contraste em todos os breakpoints

### Conteudo e fontes de dados
- O cardapio da home vira do backend existente via `GET /api/menu`.
- O conteudo institucional da marca deve sair de uma configuracao local unica, nao espalhado pelo JSX.
- O link de pedido web aponta para `/pedido`.
- O CTA de WhatsApp deve usar uma URL publica configuravel; se o numero final ainda nao estiver pronto, o plano assume placeholder tecnico temporario ate o valor real ser definido.
- O logo deve ser usado no header, hero, favicon/adaptacoes pequenas e CTA final.

## Interfaces publicas e contratos
- Rota publica principal continua sendo `/`, mas passa a funcionar como landing comercial completa.
- O frontend da landing consome `GET /api/menu` como fonte oficial do cardapio.
- Adicionar uma fonte central de conteudo de marca para a landing, com pelo menos:
  - nome de marca
  - headline/subheadline
  - CTAs
  - texto institucional curto
  - WhatsApp URL
  - horario/endereco, se disponivel
- O logo deve nascer em formato reutilizavel para web:
  - versao principal horizontal
  - versao selo reduzida
  - variacoes para fundo claro e fundo escuro

## Testes e cenarios
- A home deve abrir corretamente em mobile, tablet e desktop.
- O hero precisa caber na primeira dobra com marca, headline e CTA legiveis.
- O cardapio completo deve renderizar a partir de `GET /api/menu` sem quebrar layout.
- A navegacao por categorias deve funcionar no scroll e no toque.
- O CTA `Peca agora` deve levar para `/pedido`.
- O CTA de WhatsApp deve abrir o link configurado.
- O logo deve permanecer legivel em header, hero e tamanhos reduzidos.
- A pagina deve manter contraste bom, boa leitura e navegacao clara.
- O visual deve continuar forte mesmo sem sombras excessivas ou excesso de cards.

## Assuncoes e defaults
- Nome publico da marca: `Lanchonete Familia`.
- Direcao aprovada: `artesanal premium`.
- Hero aprovado: `foto forte de lanche`.
- Escopo aprovado: `landing com cardapio completo na home`.
- Estilo do logo aprovado: `wordmark + selo`.
- Paleta-base: verde como cor estrutural e laranja como cor de acao/apetite.
- A implementacao seguira as convencoes atuais do `Next.js` App Router ja existentes no projeto.
- Na implementacao, usar a estrutura atual do projeto e o setup ja presente de `next-devtools` para validar responsividade e comportamento da pagina.
