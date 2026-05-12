# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/5500000000000

ENV APP_AUTH_SECRET=build-time-placeholder-change-at-runtime
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_WHATSAPP_URL=${NEXT_PUBLIC_WHATSAPP_URL}
ENV USE_LOCAL_DB_ON_START=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run prisma:generate
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV WHATSAPP_SESSION_PATH=.runtime/whatsapp-session

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=node:node /app/src/lib/whatsapp-contract.ts ./src/lib/whatsapp-contract.ts
COPY --from=builder --chown=node:node /app/whatsapp-worker ./whatsapp-worker

RUN mkdir -p .runtime/whatsapp-session src/lib \
  && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "run", "start"]
