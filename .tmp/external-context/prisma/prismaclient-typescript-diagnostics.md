---
source: Context7 API + official Prisma docs
library: Prisma
package: prisma
topic: PrismaClient TypeScript diagnostics for missing models, enums, and adapter type mismatches
fetched: 2026-05-08T21:25:00Z
official_docs: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client
---

## Relevant Prisma documentation findings

### 1) Generated client out of date is a primary cause

Prisma's docs say `prisma generate` creates Prisma Client from the models and generator configuration in `schema.prisma`, and you should run it after:

- changing the Prisma schema
- updating generator configuration
- enabling features that affect the client API
- pulling schema changes from another branch or teammate

Docs:
- `Generating Prisma Client`: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client
- `Prisma CLI reference / generate`: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#generate

### 2) Schema/client divergence also explains missing `client.user`, `client.order`, or enums

Prisma Client is generated from the schema models. If the schema changed but the generated client did not, TypeScript will not expose the new model delegates or enums yet.

Prisma also documents that `db pull` introspects the database into `schema.prisma`, and explicitly tells you to run `prisma generate` afterward.

Docs:
- `Introduction to Prisma Client`: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction
- `Prisma CLI reference / db pull`: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#db-pull

### 3) In Prisma v7, import path mistakes can look exactly like missing models/enums

Prisma v7 changed the generator and import flow:

- `provider = "prisma-client"`
- `output` is required
- after `prisma generate`, import `PrismaClient` from your generated output path, not from `@prisma/client`

If code still imports from `@prisma/client` while the project uses the new generated output, you can see missing models, missing enums, or stale types.

Docs:
- `Upgrade to v7`: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- `Introduction to Prisma Client`: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction

### 4) `adapter` type errors are commonly version/import compatibility issues

Prisma's current docs say Prisma 7 requires a driver adapter, and the constructor pattern is:

```ts
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

If TypeScript says `adapter` is not a valid option, likely causes supported by the docs are:

- using an older generated client or older `@prisma/client` types
- importing `PrismaClient` from the wrong place
- upgrading only one package and leaving `prisma` and `@prisma/client` out of sync

Docs:
- `Introduction to Prisma Client`: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction
- `Upgrade to v7 / Driver adapters`: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7#driver-adapters

### 5) Version compatibility matters

Prisma's upgrade docs instruct updating both packages together:

```bash
npm install @prisma/client@7
npm install -D prisma@7
```

Then regenerate the client.

Prisma's system requirements also say current Prisma requires TypeScript 5.4+; outdated TypeScript can create confusing type-checking failures after `prisma generate`.

Docs:
- `Upgrade to v7`: https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- `System requirements`: https://www.prisma.io/docs/orm/reference/system-requirements

## Diagnostic summary

Most likely causes, in order:

1. `schema.prisma` changed but `prisma generate` was not run.
2. The app is importing an old or wrong client (`@prisma/client` vs generated output path).
3. The project upgraded Prisma partially, leaving `prisma` and `@prisma/client` on incompatible versions.
4. `db pull`, branch changes, or custom `--schema` usage updated a different schema than the one used to generate/import the client.
5. TypeScript itself is below Prisma's supported version and is producing misleading type errors.

## Recommended fixes from the docs

- Run `npx prisma generate` after every schema or generator change.
- If using Prisma v7, verify `generator client { provider = "prisma-client"; output = "..." }` and import from that generated path.
- Keep `prisma` and `@prisma/client` upgraded together.
- If the database schema changed via introspection, run `prisma db pull` and then `prisma generate`.
- If you use multiple schema files or a custom location, ensure `prisma generate --schema=...` points to the schema your app actually uses.
- For `adapter` errors, verify the project is actually on the Prisma version whose docs you are following, and that the imported `PrismaClient` matches that version's generated output.
- If type errors remain odd after regeneration, upgrade TypeScript to a version supported by current Prisma.
