---
source: Context7 API + official TypeScript docs
library: TypeScript
package: typescript
topic: local TypeScript install and tsc execution
fetched: 2026-05-08T21:15:00Z
official_docs: https://www.typescriptlang.org/download/
---

## Instalação recomendada

A documentação oficial recomenda instalar TypeScript por projeto:

```bash
npm install --save-dev typescript
```

Depois, executar o compilador com:

```bash
npx tsc
```

## Implicação para `npm run typecheck`

- Se o script usa `tsc` e falha com `tsc is not recognized`, a correção recomendada pela documentação é ter `typescript` instalado no projeto e executar o compilador via ambiente de script do npm ou via `npx`.
- A própria doc observa que instalações por projeto mantêm versões consistentes entre máquinas.

## Correção recomendada

Use algo como:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "<versão desejada>"
  }
}
```

Ou, fora de scripts npm:

```bash
npx tsc --noEmit
```

## Nota da doc

- Instalação global existe, mas a documentação recomenda preferir instalação local por projeto para builds reproduzíveis.
