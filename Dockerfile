FROM node:22-bookworm-slim@sha256:9f0dde62d10e7ff7a310ecaebd66225f6b46c17e6cb778449a77b05d3541bea2 AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*


FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --no-audit --no-fund


FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use dummy environment variables for the build process
RUN DB_HOST=localhost \
    DB_PORT=3306 \
    DB_USER=build \
    DB_PASSWORD=build \
    DB_NAME=build \
    NEXTAUTH_SECRET=build-secret \
    NEXTAUTH_URL=http://localhost:3000 \
    CRON_SECRET=build-cron-secret \
    ORGA_API_BASE_URL=https://example.invalid \
    ORGA_API_KEY=build-api-key \
    VALID_ORGA_ID=build-orga-id \
    MAX_ATTEMPTS=3 \
    npx prisma generate

RUN DB_HOST=localhost \
    DB_PORT=3306 \
    DB_USER=build \
    DB_PASSWORD=build \
    DB_NAME=build \
    NEXTAUTH_SECRET=build-secret \
    NEXTAUTH_URL=http://localhost:3000 \
    CRON_SECRET=build-cron-secret \
    ORGA_API_BASE_URL=https://example.invalid \
    ORGA_API_KEY=build-api-key \
    VALID_ORGA_ID=build-orga-id \
    MAX_ATTEMPTS=3 \
    npm run build


FROM builder AS migrate

CMD ["npx", "prisma", "migrate", "deploy"]


FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]