# Multi-stage Docker build for AIC Backend Services (Express.js)
# Optimized for production with security best practices

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NODE_ENV production
RUN npm run build --filter=@aic/backend

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Set correct permissions
RUN chown -R backend:nodejs /app
USER backend

EXPOSE 3100

ENV PORT 3100
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3100/api/health || exit 1

CMD ["node", "dist/index.js"]
