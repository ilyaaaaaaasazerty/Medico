FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@medico/backend --workspace=@medico/shared --include-workspace-root

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
COPY package*.json ./
COPY turbo.json ./
RUN npm run build --workspace=@medico/backend

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 medico

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY apps/backend/package.json ./package.json
COPY apps/backend/prisma ./prisma

USER medico
EXPOSE 3001

CMD ["node", "dist/index.js"]
