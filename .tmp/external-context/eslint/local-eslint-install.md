---
source: Context7 API + official ESLint docs
library: ESLint
package: eslint
topic: local ESLint install and CLI execution
fetched: 2026-05-08T21:15:00Z
official_docs: https://eslint.org/docs/latest/use/getting-started
---

## Instalação recomendada

A documentação oficial mostra instalação local no projeto:

```bash
npm install --save-dev eslint@latest @eslint/js@latest
```

E execução pela CLI com:

```bash
npx eslint .
```

## Implicação para `npm run lint`

- Se o script usa `eslint` e falha com `eslint is not recognized`, a causa provável é que `eslint` não está instalado localmente, `node_modules` não existe/está incompleto, ou o comando está sendo rodado fora do contexto em que o npm injeta `node_modules/.bin` no `PATH`.
- A referência de CLI diz explicitamente que a maioria dos usuários roda ESLint com `npx`.

## Correção recomendada

```json
{
  "scripts": {
    "lint": "eslint ."
  },
  "devDependencies": {
    "eslint": "<versão desejada>",
    "@eslint/js": "<versão desejada>"
  }
}
```

Ou, fora de scripts npm:

```bash
npx eslint .
```

## Nota da doc

- Instalação global é possível, mas a doc diz que **não é recomendada**; plugins e configs continuam precisando ser instalados localmente.
