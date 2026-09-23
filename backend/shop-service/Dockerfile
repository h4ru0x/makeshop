FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    SHOP_SERVICE_PORT=3000

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---------- deps ----------
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Instala TODAS las deps (incluye dev para poder hacer build)
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Prisma + build + eliminar devDependencies
RUN apk add --no-cache openssl \
 && pnpm exec prisma generate \
 && pnpm build \
 && pnpm prune --prod
FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    SHOP_SERVICE_PORT=3000

WORKDIR /app

RUN apk add --no-cache openssl \
 && adduser -D -u 10001 nodeapp

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma db push --skip-generate && node dist/index.js"]