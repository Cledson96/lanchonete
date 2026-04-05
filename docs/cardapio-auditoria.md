# Auditoria do Cardapio

Fonte principal usada nesta revisao: imagens da pasta `cardapio/`.

## Confirmado nas fotos

### Lanches
- `X-Burguer`: `R$ 12,00`
- `X-Salada`: `R$ 14,00`
- `X-Bacon`: `R$ 17,50`
- `X-Frango`: `R$ 17,50`
- `X-Egg`: `R$ 17,50`
- `X-Calabresa`: `R$ 17,50`
- `X-Tudo`: `R$ 30,00`
- `X-No Prato`: `R$ 35,00`
- `Misto Quente`: `R$ 7,00`
- `Bauru`: `R$ 12,00`
- `Omelete`: `R$ 14,00`

### Combo Lanches
- `X-Salada + suco natural 300ml + fritas`: `R$ 27,00`
- `X-Egg + suco natural 300ml + fritas`: `R$ 29,00`
- `X-Bacon + suco natural 300ml + fritas`: `R$ 29,00`
- `X-Frango + suco natural 300ml + fritas`: `R$ 29,00`
- `X-Calabresa + suco natural 300ml + fritas`: `R$ 29,00`
- Observacao da placa: existe nota sobre opcao de bebida com `suco de laranja` ou `Coca-Cola 220ml`.

### Lanches Artesanais
- `Artesanal Tradicional Simples`: `R$ 16,00`
- `Tradicional`: `R$ 18,00`
- `Artesanal Bacon`: `R$ 24,00`
- `Artesanal Calabresa`: `R$ 24,00`
- `X-Alcatra`: `R$ 28,00`
- `Artesanal Duplo`: `R$ 28,00`

### Combos Artesanais
- `Combo Artesanal Tradicional`: `R$ 34,00`
- `Combo Artesanal Bacon`: `R$ 40,00`
- `Combo Artesanal Calabresa`: `R$ 40,00`
- `Combo Artesanal Duplo`: `R$ 44,00`

### Pastel Salgado
- `Carne`: `R$ 7,00`
- `Queijo`: `R$ 7,00`
- `Pizza`: `R$ 7,00`
- `Frango`: `R$ 7,00`
- `Queijo e Presunto`: `R$ 7,00`

### Pastel Doce
- `Chocolate com morango`: `R$ 12,00`
- `Chocolate branco c/ morango`: `R$ 12,00`
- `Banana c/ canela e leite condensado`: `R$ 12,00`
- `Prestigio`: `R$ 12,00`
- `Queijo com goiabada`: `R$ 12,00`

### Pastel Especial
- `Carne com ovo`: `R$ 12,00`
- `Carne com queijo e milho`: `R$ 12,00`
- `Carne com queijo e ovo`: `R$ 15,00`
- `Frango com catupiry ou cheddar`: `R$ 12,00`
- `Frango com queijo`: `R$ 12,00`
- `Frango com queijo e ovo`: `R$ 15,00`
- `Especial`: `R$ 30,00`

### Tapioca Salgada
- `Natural`: `R$ 5,00`
- `Pizza`: `R$ 14,00`
- `Frango`: `R$ 14,00`
- `Da Casa`: `R$ 14,00`
- `Italiana`: `R$ 14,00`
- `Calabresa com catupiry`: `R$ 14,00`
- `Carne moida com queijo`: `R$ 14,00`
- `Ovo com queijo`: `R$ 14,00`

### Tapioca Doce
- `Baianinha`: `R$ 14,00`
- `Uva com chocolate`: `R$ 14,00`
- `Banana com canela`: `R$ 14,00`
- `Prestigio`: `R$ 14,00`
- `Sensacao`: `R$ 14,00`
- `Ouro Branco`: `R$ 14,00`
- `Ouro Branco com Nutella`: `R$ 17,00`
- `Sonho de Valsa`: `R$ 14,00`
- `Sonho de Valsa com Nutella`: `R$ 17,00`
- `Romeu e Julieta`: `R$ 14,00`
- `Chocolate com morango`: `R$ 14,00`
- `Chocolate branco c/ morango`: `R$ 14,00`

### Acai
- `Copo 240ml (3 adicionais)`: `R$ 13,00`
- `Copo 360ml (3 adicionais)`: `R$ 18,00`
- `Copo 500ml (3 adicionais)`: `R$ 22,00`
- Complementos legiveis na placa: `aveia`, `granola`, `sucrilhos`, `amendoim`, `leite em po`, `pacoca`, `doce de leite`, `leite condensado`, `nutella`, `chocolate branco`, `confete`, `uva`, `morango`, `banana`

## Revisao de ingredientes

- Onde a placa mostrava o recheio de forma legivel, os ingredientes foram copiados para `description`.
- Onde a linha estava parcialmente legivel, a descricao foi normalizada de forma conservadora a partir do nome do item e dos ingredientes visiveis.
- O modal do item e o card agora usam essas descricoes revisadas como fonte oficial.

## Imagens do catalogo

- O catalogo inicial agora usa imagens de produto em `public/menu-catalog/`.
- Estrategia usada: lote inicial misto, priorizando imagens coerentes por categoria para eliminar placeholders e deixar o cardapio navegavel.
- O dashboard continua sendo o caminho oficial para subir, trocar ou remover fotos individuais depois.

## Pendencias manuais

- `Acai - Barca Pequena`: a placa mostra o item, mas o preco nao esta legivel o suficiente para cadastrar com seguranca.
- `Acai - Barca Grande`: a placa mostra o item, mas o preco nao esta legivel o suficiente para cadastrar com seguranca.
- Algumas linhas menores dos ingredientes dos `lanches tradicionais` e dos `artesanais` estavam parcialmente legiveis; por isso a revisao textual foi mantida conservadora, sem prometer item que nao estivesse claro.
