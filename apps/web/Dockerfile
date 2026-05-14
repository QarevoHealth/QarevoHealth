# Stage 1: Builder
FROM node:22-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json next.config.ts postcss.config.mjs ./
# COPY next-env.d.ts ./
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY public/ ./public/

RUN pnpm build


# Stage 2: Production
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && \
    useradd --create-home --shell /bin/bash nextuser

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN chown -R nextuser:nextuser /app

USER nextuser

EXPOSE 3000

CMD ["pnpm", "start"]