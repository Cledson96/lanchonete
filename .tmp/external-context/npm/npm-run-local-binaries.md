---
source: Context7 API + official npm docs
library: npm CLI
package: npm
topic: npm run local binaries and PATH
fetched: 2026-05-08T21:15:00Z
official_docs: https://docs.npmjs.com/cli/v11/commands/npm-run
---

## Relevante para `tsc is not recognized` / `eslint is not recognized`

- `npm run <script>` adiciona `node_modules/.bin` ao `PATH` do script.
- Por isso, binários de dependências locais podem ser usados **sem** prefixar `node_modules/.bin`.
- Exemplo recomendado pela doc:

```json
{
  "scripts": {
    "test": "tap test/*.js"
  }
}
```

- A documentação oficial também diz para preferir:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

sem escrever caminhos explícitos para `node_modules/.bin`.

## O que isso implica

- Se `npm run typecheck` falha com `tsc is not recognized`, a causa provável é que o pacote `typescript` **não está instalado localmente** ou `node_modules` não foi instalado corretamente.
- Se `npm run lint` falha com `eslint is not recognized`, a causa provável é a mesma para `eslint`.
- A doc do `npm run` afirma que, se você tentar rodar um script sem `node_modules`, o npm pode avisar para executar `npm install`.

## Observações importantes da doc

- Scripts rodam na raiz do pacote.
- No Windows, por padrão os scripts rodam em `cmd.exe`.
- O shell pode ser customizado por `script-shell`, então diferenças de shell também podem afetar scripts mais complexos.

## Correções alinhadas à documentação

1. Instalar os binários como dependências locais de desenvolvimento.
2. Garantir que `npm install` / `npm ci` tenha recriado `node_modules`.
3. Invocar os comandos dentro de `scripts` do `package.json` ou com `npx`.
4. Evitar depender de instalação global para builds reproduzíveis.

## Fontes-chave

- npm run: `npm run` adiciona `node_modules/.bin` ao `PATH`.
- npm scripts: executáveis de dependências são exportados para `node_modules/.bin` após `npm install`.
